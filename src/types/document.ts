import type { FindingSeverity } from './finding';

export type DocumentReviewStatus = 'Pending Review' | 'In Progress' | 'Completed';
export type DocumentRiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  vendor: string;
  counterparty: string;
  uploadDate: string;
  effectiveDate: string;
  riskLevel: DocumentRiskLevel;
  status: DocumentReviewStatus;
  findingCount: number;
  acceptedCount: number;
  dismissedCount: number;
  pendingCount: number;
  isPrimary?: boolean; // true for the full MSA contract with 24 findings
  fileSize?: string;
  tags?: string[];
}

export interface ActivityLogItem {
  id: string;
  documentId: string;
  documentName: string;
  type: 'accept' | 'dismiss' | 'note' | 'amend' | 'upload' | 'revert';
  title: string;
  description: string;
  author: string;
  timestamp: string;
  severity?: FindingSeverity;
}
