import type { DocumentItem } from '../types/document';

export function isSupportedReviewDocument(
  document: DocumentItem | null,
  routeDocumentId: string | undefined,
  contractId: string
): boolean {
  return (
    document !== null &&
    document.isPrimary === true &&
    document.id === contractId &&
    routeDocumentId === contractId
  );
}
