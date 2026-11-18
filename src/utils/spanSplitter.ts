import type { Finding, FindingSeverity } from '../types/finding';
import type { ContractParagraph } from '../types/contract';
import { normalizeText, resolveAnchorRange } from './textMatcher';

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

  for (const finding of findings) {
    if (!finding.anchor) continue;

    const { anchor } = finding;

    // Case 1: Finding starts in this paragraph
    if (anchor.paragraphId === paragraphId) {
      if (!anchor.endParagraphId || anchor.endParagraphId === paragraphId) {
        // Single paragraph anchor
        const resolved = resolveAnchorRange(
          paragraphText,
          anchor.start,
          anchor.end,
          anchor.quote
        );
        ranges.push({
          finding,
          start: resolved.start,
          end: resolved.end,
          isCrossParagraph: false,
        });
      } else {
        const startIndex = allParagraphs.findIndex(
          (paragraph) => paragraph.id === anchor.paragraphId
        );
        const endIndex = allParagraphs.findIndex(
          (paragraph) => paragraph.id === anchor.endParagraphId
        );
        if (startIndex < 0 || endIndex <= startIndex) continue;

        const startParagraph = allParagraphs[startIndex];
        const endParagraph = allParagraphs[endIndex];
        if (
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

        ranges.push({
          finding,
          start: anchor.start,
          end: paragraphText.length,
          isCrossParagraph: true,
        });
      }
    }
    // Case 2: Multi-paragraph anchor ends in this paragraph
    else if (anchor.endParagraphId === paragraphId) {
      const startIndex = allParagraphs.findIndex(
        (paragraph) => paragraph.id === anchor.paragraphId
      );
      const endIndex = allParagraphs.findIndex(
        (paragraph) => paragraph.id === anchor.endParagraphId
      );
      if (startIndex < 0 || endIndex <= startIndex) continue;

      const startParagraph = allParagraphs[startIndex];
      const endParagraph = allParagraphs[endIndex];
      if (
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

      ranges.push({
        finding,
        start: 0,
        end: anchor.end,
        isCrossParagraph: true,
      });
    }
  }

  return ranges;
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
