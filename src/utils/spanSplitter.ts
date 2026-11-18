import type { Finding, FindingSeverity } from '../types/finding';
import type { ContractParagraph } from '../types/contract';
import { normalizeText, resolveAnchorRange } from './textMatcher.ts';
import type { TextEditOperation } from './amendments';

export interface ParagraphFindingRange {
  finding: Finding;
  start: number;
  end: number;
  isCrossParagraph: boolean;
}

export interface TextSegment {
  text: string;
  start: number;
  end: number;
  findingIds: string[];
  findings: Finding[];
  highestSeverity?: FindingSeverity;
  isOverlapping: boolean;
}

export function getNextOverlappingFindingId(
  findingIds: string[],
  selectedFindingId: string | null
): string | null {
  if (findingIds.length === 0) return null;
  const selectedIndex = findingIds.indexOf(selectedFindingId ?? '');
  const nextIndex =
    selectedIndex < 0 ? 0 : (selectedIndex + 1) % findingIds.length;
  return findingIds[nextIndex];
}

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Determines which findings apply to a given paragraph and calculates the exact start and end offsets.
 */
export function getParagraphFindingRanges(
  paragraphId: string,
  paragraphText: string,
  findings: Finding[],
  allParagraphs: ContractParagraph[]
): ParagraphFindingRange[] {
  const ranges: ParagraphFindingRange[] = [];
  if (new Set(allParagraphs.map((paragraph) => paragraph.id)).size !== allParagraphs.length) {
    return ranges;
  }
  const currentIndex = allParagraphs.findIndex(
    (paragraph) => paragraph.id === paragraphId
  );
  if (currentIndex < 0) return ranges;
  const currentParagraph = allParagraphs[currentIndex];
  if (currentParagraph.text !== paragraphText) return ranges;

  for (const finding of findings) {
    if (!finding.anchor) continue;

    const { anchor } = finding;
    const startIndex = allParagraphs.findIndex(
      (paragraph) => paragraph.id === anchor.paragraphId
    );
    const endParagraphId = anchor.endParagraphId ?? anchor.paragraphId;
    const endIndex = allParagraphs.findIndex(
      (paragraph) => paragraph.id === endParagraphId
    );
    if (startIndex < 0 || endIndex < startIndex) continue;

    if (startIndex === endIndex) {
      if (currentIndex !== startIndex) continue;
      const resolved = resolveAnchorRange(
        paragraphText,
        anchor.start,
        anchor.end,
        anchor.quote
      );
      if (resolved.exact && resolved.start < resolved.end) {
        ranges.push({
          finding,
          start: resolved.start,
          end: resolved.end,
          isCrossParagraph: false,
        });
      }
      continue;
    }

    const startParagraph = allParagraphs[startIndex];
    const endParagraph = allParagraphs[endIndex];
    if (
      !normalizeText(anchor.quote) ||
      !Number.isInteger(anchor.start) ||
      !Number.isInteger(anchor.end) ||
      anchor.start < 0 ||
      anchor.start > startParagraph.text.length ||
      anchor.end < 0 ||
      anchor.end > endParagraph.text.length
    ) {
      continue;
    }

    const anchoredText = [
      startParagraph.text.slice(anchor.start),
      ...allParagraphs
        .slice(startIndex + 1, endIndex)
        .map((paragraph) => paragraph.text),
      endParagraph.text.slice(0, anchor.end),
    ].join(' ');
    if (normalizeText(anchoredText) !== normalizeText(anchor.quote)) continue;

    if (currentIndex < startIndex || currentIndex > endIndex) continue;
    ranges.push({
      finding,
      start:
        currentIndex === startIndex
          ? anchor.start
          : currentIndex === endIndex
          ? 0
          : 0,
      end:
        currentIndex === startIndex
          ? paragraphText.length
          : currentIndex === endIndex
          ? anchor.end
          : paragraphText.length,
      isCrossParagraph: true,
    });
  }

  return ranges;
}

function mapBoundaryThroughEdits(
  offset: number,
  isEnd: boolean,
  operations: TextEditOperation[]
): number {
  let delta = 0;
  for (const operation of [...operations].sort((a, b) => a.start - b.start)) {
    if (offset < operation.start) break;
    if (offset === operation.start) return operation.start + delta;
    if (offset >= operation.end) {
      delta += operation.replacement.length - (operation.end - operation.start);
      continue;
    }
    return operation.start + delta + (isEnd ? operation.replacement.length : 0);
  }
  return offset + delta;
}

export function mapFindingRangesToAmendedText(
  ranges: ParagraphFindingRange[],
  paragraphId: string,
  operations: TextEditOperation[]
): ParagraphFindingRange[] {
  const paragraphOperations = operations.filter(
    (operation) => operation.paragraphId === paragraphId
  );
  if (paragraphOperations.length === 0) return ranges;

  return ranges.map((range) => {
    const ownEdit = paragraphOperations.find(
      (operation) =>
        operation.findingId === range.finding.id &&
        operation.start === range.start &&
        operation.end === range.end
    );
    if (ownEdit) {
      const start = mapBoundaryThroughEdits(ownEdit.start, false, paragraphOperations);
      return {
        ...range,
        start,
        end: start + ownEdit.replacement.length,
      };
    }

    return {
      ...range,
      start: mapBoundaryThroughEdits(range.start, false, paragraphOperations),
      end: mapBoundaryThroughEdits(range.end, true, paragraphOperations),
    };
  });
}

/**
 * Splits paragraph text into disjoint segments with assigned finding metadata.
 * Gracefully handles overlapping spans, single spans, and unannotated text.
 */
export function splitParagraphIntoSegments(
  paragraphText: string,
  ranges: ParagraphFindingRange[]
): TextSegment[] {
  if (ranges.length === 0) {
    return [
      {
        text: paragraphText,
        start: 0,
        end: paragraphText.length,
        findingIds: [],
        findings: [],
        isOverlapping: false,
      },
    ];
  }

  // Collect all boundary points
  const boundaryPoints = new Set<number>([0, paragraphText.length]);
  for (const range of ranges) {
    boundaryPoints.add(Math.max(0, Math.min(range.start, paragraphText.length)));
    boundaryPoints.add(Math.max(0, Math.min(range.end, paragraphText.length)));
  }

  const sortedPoints = Array.from(boundaryPoints).sort((a, b) => a - b);
  const segments: TextSegment[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const segStart = sortedPoints[i];
    const segEnd = sortedPoints[i + 1];

    if (segStart === segEnd) continue;

    // Find all ranges covering [segStart, segEnd]
    const matchingRanges = ranges.filter(
      (r) => r.start <= segStart && r.end >= segEnd
    );

    const findings = matchingRanges.map((r) => r.finding);
    const findingIds = findings.map((f) => f.id);

    // Compute highest severity
    let highestSeverity: FindingSeverity | undefined;
    if (findings.length > 0) {
      highestSeverity = findings.reduce<FindingSeverity>((prev, curr) => {
        return SEVERITY_WEIGHT[curr.severity] > SEVERITY_WEIGHT[prev]
          ? curr.severity
          : prev;
      }, findings[0].severity);
    }

    segments.push({
      text: paragraphText.slice(segStart, segEnd),
      start: segStart,
      end: segEnd,
      findingIds,
      findings,
      highestSeverity,
      isOverlapping: findings.length > 1,
    });
  }

  return segments;
}
