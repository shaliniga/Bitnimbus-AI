import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContractDocument, ContractParagraph } from '../types/contract';
import type {
  Finding,
  FindingReviewState,
  ReviewStatus,
  FilterState,
  FindingsDataset,
} from '../types/finding';
import type { DocumentItem, ActivityLogItem } from '../types/document';

import initialContractData from '../assets/sample-contract.json';
import initialFindingsData from '../assets/findings.json';

export interface UserSettings {
  reviewerName: string;
  reviewerRole: string;
  email: string;
  department: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  highRiskAlerts: boolean;
  autoSaveReviewDrafts: boolean;
  exportFormat: 'markdown' | 'json' | 'pdf';
}

interface ReviewStoreState {
  contract: ContractDocument;
  originalParagraphs: Record<string, string>; // paragraphId -> original plain text
  findings: Finding[];
  agentMeta: {
    name: string;
    version: string;
    generatedAt: string;
  };
  reviews: Record<string, FindingReviewState>;
  selectedFindingId: string | null;
  highlightedParagraphId: string | null;
  filters: FilterState;
  zenMode: boolean;
  showSummaryModal: boolean;
  showShortcutsModal: boolean;

  // Multi-document & enterprise platform state
  documents: DocumentItem[];
  activityLog: ActivityLogItem[];
  userSettings: UserSettings;

  // Actions
  selectFinding: (
    findingId: string | null,
    highlightParagraph?: string | null
  ) => void;
  setStatus: (findingId: string, status: ReviewStatus) => void;
  addNote: (findingId: string, text: string, author?: string) => void;
  deleteNote: (findingId: string, noteId: string) => void;
  applySuggestedEdit: (findingId: string) => void;
  revertSuggestedEdit: (findingId: string) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  resetAllReviews: () => void;
  setZenMode: (enabled: boolean) => void;
  toggleSummaryModal: (open?: boolean) => void;
  toggleShortcutsModal: (open?: boolean) => void;
  nextFinding: () => void;
  prevFinding: () => void;
  getFilteredFindings: () => Finding[];

  // Document & Platform actions
  addDocument: (doc: DocumentItem) => void;
  deleteDocument: (id: string) => void;
  logActivity: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  getDynamicDocuments: () => DocumentItem[];
}

const defaultFilters: FilterState = {
  severity: 'all',
  category: 'all',
  status: 'all',
  search: '',
  sort: 'document',
};

const initialDocuments: DocumentItem[] = [
  {
    id: 'msa-northwind-brightline-2026',
    name: 'Master Services Agreement (MSA)',
    type: 'Master Services Agreement',
    vendor: 'Brightline Data Solutions LLC',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-03-01',
    effectiveDate: '2026-03-01',
    riskLevel: 'Critical',
    status: 'In Progress',
    findingCount: 24,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 24,
    isPrimary: true,
    fileSize: '2.4 MB',
    tags: ['Data Processing', 'Analytics', 'Vendor SOW'],
  },
  {
    id: 'saas-cyberguard-2026',
    name: 'Enterprise Security Services Agreement',
    type: 'Security SaaS Agreement',
    vendor: 'CyberGuard Technologies Inc.',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-03-04',
    effectiveDate: '2026-03-15',
    riskLevel: 'Critical',
    status: 'Pending Review',
    findingCount: 19,
    acceptedCount: 0,
    dismissedCount: 0,
    pendingCount: 19,
    fileSize: '1.8 MB',
    tags: ['Infosec', 'SOC2', 'Penetration Testing'],
  },
  {
    id: 'sla-vertex-ai-2026',
    name: 'AI Model Hosting & API SLA',
    type: 'Service Level Agreement',
    vendor: 'Vertex AI Labs LLC',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-02-18',
    effectiveDate: '2026-03-01',
    riskLevel: 'High',
    status: 'In Progress',
    findingCount: 14,
    acceptedCount: 5,
    dismissedCount: 3,
    pendingCount: 6,
    fileSize: '1.2 MB',
    tags: ['AI Infrastructure', '99.9% Uptime', 'LLM API'],
  },
  {
    id: 'dpa-cloudscale-2026',
    name: 'Data Processing Addendum (GDPR / CCPA)',
    type: 'Data Privacy Agreement',
    vendor: 'CloudScale Systems Inc.',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-02-24',
    effectiveDate: '2026-02-28',
    riskLevel: 'Moderate',
    status: 'Completed',
    findingCount: 8,
    acceptedCount: 7,
    dismissedCount: 1,
    pendingCount: 0,
    fileSize: '950 KB',
    tags: ['GDPR', 'Standard Contractual Clauses', 'Privacy'],
  },
  {
    id: 'nda-meridian-2026',
    name: 'Mutual Non-Disclosure Agreement',
    type: 'Confidentiality Agreement',
    vendor: 'Meridian Capital Partners LLC',
    counterparty: 'Northwind Analytics, Inc.',
    uploadDate: '2026-01-15',
    effectiveDate: '2026-01-20',
    riskLevel: 'Low',
    status: 'Completed',
    findingCount: 3,
    acceptedCount: 2,
    dismissedCount: 1,
    pendingCount: 0,
    fileSize: '420 KB',
    tags: ['M&A', 'Due Diligence', 'Confidentiality'],
  },
];

const initialActivities: ActivityLogItem[] = [
  {
    id: 'act-1',
    documentId: 'msa-northwind-brightline-2026',
    documentName: 'Master Services Agreement',
    type: 'amend',
    title: 'AI Contract Review Generated',
    description: 'Contract Review Agent v2.3.1 identified 24 findings across 11 clauses.',
    author: 'AI Review Agent',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    severity: 'high',
  },
  {
    id: 'act-2',
    documentId: 'dpa-cloudscale-2026',
    documentName: 'Data Processing Addendum',
    type: 'accept',
    title: 'Review Finalized & Approved',
    description: '7 privacy amendments accepted, 1 low-risk clause dismissed.',
    author: 'Sarah Chen (Lead Counsel)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    severity: 'low',
  },
  {
    id: 'act-3',
    documentId: 'sla-vertex-ai-2026',
    documentName: 'AI Model Hosting SLA',
    type: 'note',
    title: 'Uptime Remedy Flagged',
    description: 'Added negotiation note regarding 99.9% monthly availability credits.',
    author: 'Marcus Vance (Legal Ops)',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    severity: 'medium',
  },
];

const defaultSettings: UserSettings = {
  reviewerName: 'Sarah Chen',
  reviewerRole: 'Senior Legal Operations Counsel',
  email: 'schen@northwind.io',
  department: 'Legal & Risk Operations',
  theme: 'light',
  emailNotifications: true,
  highRiskAlerts: true,
  autoSaveReviewDrafts: true,
  exportFormat: 'markdown',
};

export const useReviewStore = create<ReviewStoreState>()(
  persist(
    (set, get) => ({
      contract: initialContractData as unknown as ContractDocument,
      originalParagraphs: {},
      findings: (initialFindingsData as unknown as FindingsDataset).findings,
      agentMeta: {
        name: (initialFindingsData as unknown as FindingsDataset).agent?.name || 'Contract Review Agent',
        version: (initialFindingsData as unknown as FindingsDataset).agent?.version || '2.3.1',
        generatedAt: (initialFindingsData as unknown as FindingsDataset).generatedAt,
      },
      reviews: {},
      selectedFindingId: (initialFindingsData as unknown as FindingsDataset).findings[0]?.id || null,
      highlightedParagraphId: null,
      filters: defaultFilters,
      zenMode: false,
      showSummaryModal: false,
      showShortcutsModal: false,

      // Multi-page platform state
      documents: initialDocuments,
      activityLog: initialActivities,
      userSettings: defaultSettings,

      selectFinding: (findingId, highlightParagraph) => {
        set({
          selectedFindingId: findingId,
          highlightedParagraphId: highlightParagraph ?? null,
        });
      },

      logActivity: (item) => {
        const newActivity: ActivityLogItem = {
          ...item,
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          activityLog: [newActivity, ...state.activityLog.slice(0, 49)], // keep last 50
        }));
      },

      setStatus: (findingId, status) => {
        const finding = get().findings.find((f) => f.id === findingId);
        set((state) => {
          const currentReview = state.reviews[findingId] || {
            status: 'pending',
            notes: [],
          };
          return {
            reviews: {
              ...state.reviews,
              [findingId]: {
                ...currentReview,
                status,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });

        // Log real-time activity
        if (finding) {
          get().logActivity({
            documentId: 'msa-northwind-brightline-2026',
            documentName: 'Master Services Agreement',
            type: status === 'accepted' ? 'accept' : 'dismiss',
            title: status === 'accepted' ? `Accepted Finding #${finding.id}` : `Dismissed Finding #${finding.id}`,
            description: `${finding.title} (${finding.severity.toUpperCase()} Risk)`,
            author: get().userSettings.reviewerName,
            severity: finding.severity,
          });
        }
      },

      addNote: (findingId, text, author) => {
        if (!text.trim()) return;
        const currentAuthor = author || get().userSettings.reviewerName;
        const finding = get().findings.find((f) => f.id === findingId);

        set((state) => {
          const currentReview = state.reviews[findingId] || {
            status: 'pending',
            notes: [],
          };
          const newNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            author: currentAuthor,
            text: text.trim(),
            timestamp: new Date().toISOString(),
          };
          return {
            reviews: {
              ...state.reviews,
              [findingId]: {
                ...currentReview,
                notes: [...currentReview.notes, newNote],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });

        if (finding) {
          get().logActivity({
            documentId: 'msa-northwind-brightline-2026',
            documentName: 'Master Services Agreement',
            type: 'note',
            title: `Added Note on #${finding.id}`,
            description: text.length > 60 ? `${text.slice(0, 60)}...` : text,
            author: currentAuthor,
            severity: finding.severity,
          });
        }
      },

      deleteNote: (findingId, noteId) => {
        set((state) => {
          const currentReview = state.reviews[findingId];
          if (!currentReview) return state;
          return {
            reviews: {
              ...state.reviews,
              [findingId]: {
                ...currentReview,
                notes: currentReview.notes.filter((n) => n.id !== noteId),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      applySuggestedEdit: (findingId) => {
        const state = get();
        const finding = state.findings.find((f) => f.id === findingId);
        if (!finding || !finding.suggestedEdit || !finding.anchor) return;

        const { paragraphId, start, end, endParagraphId } = finding.anchor;
        const contract = { ...state.contract };
        const originalParagraphs = { ...state.originalParagraphs };

        let targetParagraph: ContractParagraph | null = null;
        for (const sec of contract.sections) {
          const p = sec.paragraphs.find((para) => para.id === paragraphId);
          if (p) {
            targetParagraph = p;
            break;
          }
        }

        if (!targetParagraph) return;

        // Backup original text if not already saved
        if (!originalParagraphs[paragraphId]) {
          originalParagraphs[paragraphId] = targetParagraph.text;
        }

        // Apply replacement text
        const currentText = targetParagraph.text;
        let newText: string;

        if (endParagraphId && endParagraphId !== paragraphId) {
          newText = currentText.slice(0, start) + finding.suggestedEdit;
        } else {
          newText =
            currentText.slice(0, start) +
            finding.suggestedEdit +
            currentText.slice(end);
        }

        targetParagraph.text = newText;

        const currentReview = state.reviews[findingId] || {
          status: 'pending',
          notes: [],
        };

        set({
          contract,
          originalParagraphs,
          reviews: {
            ...state.reviews,
            [findingId]: {
              ...currentReview,
              status: 'accepted',
              isEditApplied: true,
              appliedText: finding.suggestedEdit,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        get().logActivity({
          documentId: 'msa-northwind-brightline-2026',
          documentName: 'Master Services Agreement',
          type: 'amend',
          title: `Applied Redline Amendment on #${finding.id}`,
          description: `Contract text § ${paragraphId.replace('p-', '')} amended with proposed replacement.`,
          author: get().userSettings.reviewerName,
          severity: finding.severity,
        });
      },

      revertSuggestedEdit: (findingId) => {
        const state = get();
        const finding = state.findings.find((f) => f.id === findingId);
        if (!finding || !finding.anchor) return;

        const { paragraphId } = finding.anchor;
        const originalText = state.originalParagraphs[paragraphId];
        if (!originalText) return;

        const contract = { ...state.contract };
        for (const sec of contract.sections) {
          const p = sec.paragraphs.find((para) => para.id === paragraphId);
          if (p) {
            p.text = originalText;
            break;
          }
        }

        const currentReview = state.reviews[findingId];
        if (!currentReview) return;

        set({
          contract,
          reviews: {
            ...state.reviews,
            [findingId]: {
              ...currentReview,
              isEditApplied: false,
              appliedText: undefined,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        get().logActivity({
          documentId: 'msa-northwind-brightline-2026',
          documentName: 'Master Services Agreement',
          type: 'revert',
          title: `Reverted Amendment on #${finding.id}`,
          description: `Original text restored for § ${paragraphId.replace('p-', '')}.`,
          author: get().userSettings.reviewerName,
          severity: finding.severity,
        });
      },

      setFilter: (key, value) => {
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      resetAllReviews: () => {
        set({
          contract: initialContractData as unknown as ContractDocument,
          originalParagraphs: {},
          reviews: {},
          selectedFindingId: (initialFindingsData as unknown as FindingsDataset).findings[0]?.id || null,
          highlightedParagraphId: null,
          filters: defaultFilters,
        });

        get().logActivity({
          documentId: 'msa-northwind-brightline-2026',
          documentName: 'Master Services Agreement',
          type: 'revert',
          title: 'Review Progress Reset',
          description: 'All reviews, notes, and amendments were reset to initial state.',
          author: get().userSettings.reviewerName,
        });
      },

      setZenMode: (enabled) => set({ zenMode: enabled }),
      toggleSummaryModal: (open) =>
        set((state) => ({
          showSummaryModal: open !== undefined ? open : !state.showSummaryModal,
        })),
      toggleShortcutsModal: (open) =>
        set((state) => ({
          showShortcutsModal: open !== undefined ? open : !state.showShortcutsModal,
        })),

      addDocument: (doc) => {
        set((state) => ({
          documents: [doc, ...state.documents],
        }));
        get().logActivity({
          documentId: doc.id,
          documentName: doc.name,
          type: 'upload',
          title: `Uploaded New Contract: ${doc.name}`,
          description: `Vendor: ${doc.vendor} • Size: ${doc.fileSize || 'N/A'}`,
          author: get().userSettings.reviewerName,
        });
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
      },

      updateUserSettings: (newSettings) => {
        set((state) => ({
          userSettings: {
            ...state.userSettings,
            ...newSettings,
          },
        }));
      },

      getDynamicDocuments: () => {
        const { documents, reviews, findings } = get();
        // Compute live metrics for primary MSA contract
        let accepted = 0;
        let dismissed = 0;
        let pending = 0;

        findings.forEach((f) => {
          const rev = reviews[f.id];
          if (rev?.status === 'accepted') accepted++;
          else if (rev?.status === 'dismissed') dismissed++;
          else pending++;
        });

        const totalReviewed = accepted + dismissed;
        const total = findings.length;

        let status: DocumentItem['status'] = 'Pending Review';
        if (totalReviewed === total) status = 'Completed';
        else if (totalReviewed > 0) status = 'In Progress';

        // Calculate residual risk level
        const highPending = findings.filter(
          (f) => f.severity === 'high' && reviews[f.id]?.status !== 'accepted' && reviews[f.id]?.status !== 'dismissed'
        ).length;

        let riskLevel: DocumentItem['riskLevel'] = 'Critical';
        if (highPending === 0) {
          const medPending = findings.filter(
            (f) => f.severity === 'medium' && reviews[f.id]?.status !== 'accepted' && reviews[f.id]?.status !== 'dismissed'
          ).length;
          if (medPending === 0) riskLevel = 'Low';
          else riskLevel = 'Moderate';
        } else if (highPending < 4) {
          riskLevel = 'High';
        }

        return documents.map((doc) => {
          if (doc.isPrimary) {
            return {
              ...doc,
              acceptedCount: accepted,
              dismissedCount: dismissed,
              pendingCount: pending,
              status,
              riskLevel,
            };
          }
          return doc;
        });
      },

      getFilteredFindings: () => {
        const { findings, filters, reviews } = get();

        return findings.filter((f) => {
          if (filters.severity !== 'all' && f.severity !== filters.severity) {
            return false;
          }
          if (filters.category !== 'all' && f.category !== filters.category) {
            return false;
          }
          const status = reviews[f.id]?.status || 'pending';
          if (filters.status !== 'all' && status !== filters.status) {
            return false;
          }
          if (filters.search.trim()) {
            const query = filters.search.toLowerCase();
            const matchTitle = f.title.toLowerCase().includes(query);
            const matchExplanation = f.explanation.toLowerCase().includes(query);
            const matchCategory = f.category.toLowerCase().includes(query);
            const matchQuote = f.anchor?.quote.toLowerCase().includes(query) || false;
            if (!matchTitle && !matchExplanation && !matchCategory && !matchQuote) {
              return false;
            }
          }
          return true;
        }).sort((a, b) => {
          if (filters.sort === 'severity-desc') {
            const weight = { high: 3, medium: 2, low: 1 };
            return weight[b.severity] - weight[a.severity];
          }
          if (filters.sort === 'confidence-desc') {
            return b.confidence - a.confidence;
          }
          if (filters.sort === 'status') {
            const statusA = reviews[a.id]?.status || 'pending';
            const statusB = reviews[b.id]?.status || 'pending';
            return statusA.localeCompare(statusB);
          }
          return 0;
        });
      },

      nextFinding: () => {
        const filtered = get().getFilteredFindings();
        if (filtered.length === 0) return;

        const currentId = get().selectedFindingId;
        const currentIndex = filtered.findIndex((f) => f.id === currentId);
        const nextIndex = (currentIndex + 1) % filtered.length;
        const nextFinding = filtered[nextIndex];

        set({
          selectedFindingId: nextFinding.id,
          highlightedParagraphId: nextFinding.anchor?.paragraphId || null,
        });
      },

      prevFinding: () => {
        const filtered = get().getFilteredFindings();
        if (filtered.length === 0) return;

        const currentId = get().selectedFindingId;
        const currentIndex = filtered.findIndex((f) => f.id === currentId);
        const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
        const prevFinding = filtered[prevIndex];

        set({
          selectedFindingId: prevFinding.id,
          highlightedParagraphId: prevFinding.anchor?.paragraphId || null,
        });
      },
    }),
    {
      name: 'northwind_ai_document_review_v1',
      partialize: (state) => ({
        reviews: state.reviews,
        originalParagraphs: state.originalParagraphs,
        zenMode: state.zenMode,
        documents: state.documents,
        activityLog: state.activityLog,
        userSettings: state.userSettings,
      }),
    }
  )
);
