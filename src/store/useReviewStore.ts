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

import initialContractData from '../assets/sample-contract.json';
import initialFindingsData from '../assets/findings.json';

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
}

const defaultFilters: FilterState = {
  severity: 'all',
  category: 'all',
  status: 'all',
  search: '',
  sort: 'document',
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

      selectFinding: (findingId, highlightParagraph) => {
        set({
          selectedFindingId: findingId,
          highlightedParagraphId: highlightParagraph ?? null,
        });
      },

      setStatus: (findingId, status) => {
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
      },

      addNote: (findingId, text, author = 'Legal Reviewer') => {
        if (!text.trim()) return;
        set((state) => {
          const currentReview = state.reviews[findingId] || {
            status: 'pending',
            notes: [],
          };
          const newNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            author,
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
          // Cross-paragraph edit: replace start paragraph from offset to end with suggested text
          newText = currentText.slice(0, start) + finding.suggestedEdit;
        } else {
          // Standard single paragraph replacement
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

      getFilteredFindings: () => {
        const { findings, filters, reviews } = get();

        return findings.filter((f) => {
          // Severity filter
          if (filters.severity !== 'all' && f.severity !== filters.severity) {
            return false;
          }
          // Category filter
          if (filters.category !== 'all' && f.category !== filters.category) {
            return false;
          }
          // Status filter
          const status = reviews[f.id]?.status || 'pending';
          if (filters.status !== 'all' && status !== filters.status) {
            return false;
          }
          // Search query
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
          // Default: document order (order in original JSON)
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
      }),
    }
  )
);
