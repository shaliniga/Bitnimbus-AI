import type { ContractParagraph, ContractDocument } from '../types/contract';
import type { Finding, FindingReviewState } from '../types/finding';
import { normalizeText, resolveAnchorRange } from './textMatcher.ts';

export interface TextEditOperation {
  findingId: string;
  paragraphId: string;
  start: number;
  end: number;
  replacement: string;
}

export function buildFindingEditOperations(
  finding: Finding,
  paragraphs: ContractParagraph[],
  originalParagraphs: Record<string, string>
): TextEditOperation[] | null {
  const anchor = finding.anchor;
  if (!anchor || finding.suggestedEdit === null) return null;

  const startIndex = paragraphs.findIndex(
    (paragraph) => paragraph.id === anchor.paragraphId
  );
  if (startIndex < 0) return null;

  const startParagraph = paragraphs[startIndex];
  const startText =
    originalParagraphs[startParagraph.id] ?? startParagraph.text;
  const endParagraphId = anchor.endParagraphId ?? anchor.paragraphId;
  const endIndex = paragraphs.findIndex(
    (paragraph) => paragraph.id === endParagraphId
  );
  if (endIndex < startIndex) return null;

  if (endIndex === startIndex) {
    const range = resolveAnchorRange(
      startText,
      anchor.start,
      anchor.end,
      anchor.quote
    );
    if (!range.exact || range.start === range.end) return null;

    return [{
      findingId: finding.id,
      paragraphId: startParagraph.id,
      start: range.start,
      end: range.end,
      replacement: finding.suggestedEdit,
    }];
  }

  const endParagraph = paragraphs[endIndex];
  const endText = originalParagraphs[endParagraph.id] ?? endParagraph.text;
  if (
    !Number.isInteger(anchor.start) ||
    !Number.isInteger(anchor.end) ||
    anchor.start < 0 ||
    anchor.start > startText.length ||
    anchor.end < 0 ||
    anchor.end > endText.length
  ) {
    return null;
  }

  const intermediateParagraphs = paragraphs.slice(startIndex + 1, endIndex);
  const anchoredText = [
    startText.slice(anchor.start),
    ...intermediateParagraphs.map(
      (paragraph) => originalParagraphs[paragraph.id] ?? paragraph.text
    ),
    endText.slice(0, anchor.end),
  ].join(' ');
  if (normalizeText(anchoredText) !== normalizeText(anchor.quote)) return null;

  return [
    {
      findingId: finding.id,
      paragraphId: startParagraph.id,
      start: anchor.start,
      end: startText.length,
      replacement: finding.suggestedEdit,
    },
    ...intermediateParagraphs.map((paragraph) => ({
      findingId: finding.id,
      paragraphId: paragraph.id,
      start: 0,
      end: (originalParagraphs[paragraph.id] ?? paragraph.text).length,
      replacement: '',
    })),
    {
      findingId: finding.id,
      paragraphId: endParagraph.id,
      start: 0,
      end: anchor.end,
      replacement: '',
    },
  ];
}

export function hasConflictingEdits(operations: TextEditOperation[]): boolean {
  for (let index = 0; index < operations.length; index++) {
    for (let otherIndex = index + 1; otherIndex < operations.length; otherIndex++) {
      const current = operations[index];
      const other = operations[otherIndex];
      if (
        current.findingId !== other.findingId &&
        current.paragraphId === other.paragraphId &&
        current.start < other.end &&
        other.start < current.end
      ) {
        return true;
      }
    }
  }
  return false;
}

export function applyTextEditOperations(
  contract: ContractDocument,
  originalParagraphs: Record<string, string>,
  operations: TextEditOperation[],
  affectedParagraphs: Set<string>
): ContractDocument {
  const operationsByParagraph = new Map<string, TextEditOperation[]>();
  for (const operation of operations) {
    const paragraphOperations =
      operationsByParagraph.get(operation.paragraphId) ?? [];
    paragraphOperations.push(operation);
    operationsByParagraph.set(operation.paragraphId, paragraphOperations);
  }

  return {
    ...contract,
    sections: contract.sections.map((section) => ({
      ...section,
      paragraphs: section.paragraphs.map((paragraph) => {
        if (!affectedParagraphs.has(paragraph.id)) return { ...paragraph };

        let text = originalParagraphs[paragraph.id] ?? paragraph.text;
        const paragraphOperations = operationsByParagraph.get(paragraph.id) ?? [];
        for (const operation of [...paragraphOperations].sort(
          (a, b) => b.start - a.start
        )) {
          text =
            text.slice(0, operation.start) +
            operation.replacement +
            text.slice(operation.end);
        }
        return { ...paragraph, text };
      }),
    })),
  };
}

export function getAppliedEditOperations(
  findings: Finding[],
  reviews: Record<string, FindingReviewState>,
  paragraphs: ContractParagraph[],
  originalParagraphs: Record<string, string>
): TextEditOperation[] {
  const operations: TextEditOperation[] = [];
  for (const finding of findings) {
    if (!reviews[finding.id]?.isEditApplied) continue;
    const findingOperations = buildFindingEditOperations(
      finding,
      paragraphs,
      originalParagraphs
    );
    if (findingOperations) operations.push(...findingOperations);
  }
  return operations;
}
