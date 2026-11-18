export type FindingSeverity = 'high' | 'medium' | 'low';
export type ReviewStatus = 'pending' | 'accepted' | 'dismissed';

export interface FindingAnchor {
  paragraphId: string;
  start: number;
  end: number;
  quote: string;
  endParagraphId?: string;
}

export interface Finding {
  id: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  explanation: string;
  anchor: FindingAnchor | null;
  suggestedEdit: string | null;
  confidence: number;
}

export interface AIAgentMeta {
  name: string;
  version: string;
}

export interface FindingsDataset {
  documentId: string;
  agent: AIAgentMeta;
  generatedAt: string;
  findings: Finding[];
}

export interface FindingNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface FindingReviewState {
  status: ReviewStatus;
  notes: FindingNote[];
  isEditApplied?: boolean;
  appliedText?: string;
  updatedAt?: string;
}

export type SeverityFilter = 'all' | FindingSeverity;
export type StatusFilter = 'all' | ReviewStatus;
export type SortOption = 'document' | 'severity-desc' | 'confidence-desc' | 'status';

export interface FilterState {
  severity: SeverityFilter;
  category: string; // 'all' or category name
  status: StatusFilter;
  search: string;
  sort: SortOption;
}
