import type { ContractDocument } from '../types/contract';
import type { Finding, FindingNote, FindingReviewState } from '../types/finding';
import {
  applyTextEditOperations,
  buildFindingEditOperations,
  hasConflictingEdits,
  type TextEditOperation,
} from './amendments.ts';

const REVIEW_STATUSES = new Set(['pending', 'accepted', 'dismissed']);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeReviews(
  value: unknown,
  findings: Finding[]
): Record<string, FindingReviewState> {
  if (!isRecord(value)) return {};

  const validFindingIds = new Set(findings.map((finding) => finding.id));
  const reviews: Record<string, FindingReviewState> = {};
  for (const [findingId, rawReview] of Object.entries(value)) {
    if (!validFindingIds.has(findingId) || !isRecord(rawReview)) continue;
    if (
      typeof rawReview.status !== 'string' ||
      !REVIEW_STATUSES.has(rawReview.status)
    ) {
      continue;
    }

    const notes: FindingNote[] = Array.isArray(rawReview.notes)
      ? rawReview.notes.filter(
          (note): note is FindingNote =>
            isRecord(note) &&
            typeof note.id === 'string' &&
            typeof note.author === 'string' &&
            typeof note.text === 'string' &&
            typeof note.timestamp === 'string'
        )
      : [];
    reviews[findingId] = {
      status: rawReview.status as FindingReviewState['status'],
      notes,
      ...(typeof rawReview.isEditApplied === 'boolean'
        ? { isEditApplied: rawReview.isEditApplied }
        : {}),
      ...(typeof rawReview.appliedText === 'string'
        ? { appliedText: rawReview.appliedText }
        : {}),
      ...(typeof rawReview.editError === 'string'
        ? { editError: rawReview.editError }
        : {}),
      ...(typeof rawReview.updatedAt === 'string'
        ? { updatedAt: rawReview.updatedAt }
        : {}),
    };
  }
  return reviews;
}

export function sanitizeOriginalParagraphs(
  value: unknown,
  contract: ContractDocument
): Record<string, string> {
  if (!isRecord(value)) return {};

  const originalTextById = new Map(
    contract.sections.flatMap((section) =>
      section.paragraphs.map((paragraph) => [paragraph.id, paragraph.text] as const)
    )
  );
  const originalParagraphs: Record<string, string> = {};
  for (const [paragraphId, text] of Object.entries(value)) {
    if (
      typeof text === 'string' &&
      originalTextById.get(paragraphId) === text
    ) {
      originalParagraphs[paragraphId] = text;
    }
  }
  return originalParagraphs;
}

export interface RestoredReviewDraft {
  contract: ContractDocument;
  reviews: Record<string, FindingReviewState>;
  originalParagraphs: Record<string, string>;
}

export function restoreReviewDraft(
  initialContract: ContractDocument,
  findings: Finding[],
  reviews: Record<string, FindingReviewState>,
  savedOriginalParagraphs: Record<string, string>
): RestoredReviewDraft {
  const restoredReviews = { ...reviews };
  const paragraphs = initialContract.sections.flatMap(
    (section) => section.paragraphs
  );
  const operations: TextEditOperation[] = [];

  for (const finding of findings) {
    if (!restoredReviews[finding.id]?.isEditApplied) continue;
    const findingOperations = buildFindingEditOperations(
      finding,
      paragraphs,
      savedOriginalParagraphs
    );
    if (
      !findingOperations ||
      hasConflictingEdits([...operations, ...findingOperations])
    ) {
      restoredReviews[finding.id] = {
        ...restoredReviews[finding.id],
        isEditApplied: false,
        appliedText: undefined,
        editError:
          'This saved amendment could not be restored because its clause is missing or overlaps another edit.',
      };
      continue;
    }
    operations.push(...findingOperations);
  }

  const affectedParagraphs = new Set(
    operations.map((operation) => operation.paragraphId)
  );
  const originalParagraphs: Record<string, string> = {};
  for (const paragraphId of affectedParagraphs) {
    const paragraph = paragraphs.find((item) => item.id === paragraphId);
    if (paragraph) originalParagraphs[paragraphId] = paragraph.text;
  }

  return {
    contract: applyTextEditOperations(
      initialContract,
      originalParagraphs,
      operations,
      affectedParagraphs
    ),
    reviews: restoredReviews,
    originalParagraphs,
  };
}
