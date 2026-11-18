# Northwind Analytics — AI Document Review Workspace

An intuitive, high-velocity legal review interface designed for legal operations reviewers. This workspace pairs an AI contract review agent’s findings directly alongside structured agreements, transforming complex contract risk audits into an actionable, bidirectional triage experience.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Zustand**.

---

## 🚀 Quickstart: How to Run

### Prerequisites
- Node.js 18+ (tested with Node 20 / 22)
- npm or yarn / pnpm

### Installation & Development
```bash
# Clone the repository
git clone <repo-url>
cd ai-document-reviewer

# Install dependencies
npm install

# Start development server with hot-module reload
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build & Linting
```bash
# Type check and build production bundle
npm run build

# Run Oxlint
npm run lint

# Preview production build locally
npm run preview
```

---

## 🎯 The Scenario & Core Reviewer Workflows

A legal operations reviewer at **Northwind Analytics** received a vendor Master Services Agreement with **Brightline Data Solutions LLC**. The AI review agent generated 24 findings.

The reviewer needs to:
1. **Understand at a glance how "risky" the document is and where problems reside**:
   - **Executive Risk Barometer**: Dynamically computes an overall contract risk score (0–100) weighted by severity and AI confidence. As the reviewer mitigates issues or accepts business risks, the score recalculates in real time.
   - **Interactive Document Outline & Risk Heatmap**: A visual minimap gutter reveals risk concentration across all 11 sections of the contract.
2. **Work through findings in context**:
   - **Bidirectional Navigation**: Clicking any highlighted text in the document scrolls to and selects the finding card; clicking any finding card centers and pulses the anchored paragraph.
   - **Interval-Splitting Engine**: Effortlessly handles overlapping annotations and cross-paragraph anchors.
3. **Decide what to do with each finding**:
   - **Accept & Apply Amendment**: Accepts the finding and dynamically patches the contract text with the proposed redline edit, displaying an "Amended by Reviewer" badge.
   - **Dismiss**: Dismisses the issue as an acceptable business risk while maintaining an audit trail.
   - **Notes & Collaboration**: Reviewers can add custom commentary or 1-click legal tags (*"Flag for external counsel"*, *"Counter-propose 12-mo cap"*, *"Non-negotiable warranty"*).
4. **Know when they are done**:
   - Real-time progress indicators (e.g. `18 / 24 reviewed • 75%`).
   - Executive Audit Modal summarizing agreed amendments, reviewer notes, and residual risks with export options (**Markdown**, **JSON**, and **Print / PDF**).

---

## 💡 Key Design Decisions & Alternatives Considered

### 1. Highlight Engine: Interval-Splitting vs. Nested DOM Spans
* **Problem**: In realistic legal review datasets, findings overlap. For example, in paragraph `§ 6.2`, finding `f-04` covers characters 0–227, while `f-05` covers characters 167–376. Naive DOM tags (`<mark>...</mark>`) will create malformed HTML or throw rendering errors when overlapping.
* **Our Solution**: Implemented an interval-splitting algorithm (`src/utils/spanSplitter.ts`). It computes all unique boundary points $\{0, s_1, e_1, s_2, e_2, \dots, \text{length}\}$, slices the text into disjoint sub-intervals, and attaches an array of active finding IDs to each sub-interval.
* **UX Result**: When text has overlapping issues, it renders a distinct purple tint and an interactive stacked badge (`[Layers 2]`). Clicking it opens a contextual picker to toggle between the overlapping findings without visual glitches.

### 2. Multi-Paragraph Anchors
* **Problem**: Finding `f-02` begins in `§ 3.4` (offset 151) and concludes in `§ 3.5` (offset 173).
* **Our Solution**: The highlighter inspects both `paragraphId` and `endParagraphId`. It maps `[151, len]` on the starting paragraph and `[0, 173]` on the concluding paragraph, linking both text spans to finding `f-02`.

### 3. Missing Clauses (`anchor: null`)
* **Problem**: Systemic findings such as `f-09` (*No data protection or security obligations*) have no text anchor in the contract.
* **Alternative Considered**: Hiding them in a separate tab or leaving them as detached cards.
* **Our Solution**: Dedicated **Document-Wide / Missing Clauses** banner positioned at the top of the findings pane and minimap. Reviewers can accept the recommendation to attach a standard Data Processing Addendum (DPA) Schedule directly to the redline export.

### 4. Live Contract Amendment vs. Read-Only Side Diff
* **Decision**: Rather than merely displaying suggested edits in a static sidebar, reviewers can click **"Accept & Apply"**. This modifies the document model in memory, displays an inline redline diff, and tags the clause as `Amended by Reviewer` with an instant revert option.

### 5. Zen Speed Review Mode
* **Decision**: Power reviewers reviewing dozens of clauses per day need maximum focus. We added a **Zen Triage Mode** (`Z` key) that isolates the current finding alongside its context paragraph with large, accessible triage controls.

---

## ⌨️ Keyboard-Driven Review

| Key | Action |
| :--- | :--- |
| `J` or `↓` | Next Finding (advances focus and auto-scrolls) |
| `K` or `↑` | Previous Finding |
| `A` | Accept finding / Apply suggested amendment |
| `D` | Dismiss finding as acceptable risk |
| `Z` | Toggle Zen Speed Review Mode |
| `?` | Show Keyboard Shortcuts cheatsheet |
| `Esc` | Close modal or exit Zen Mode |

---

## 🛡️ Robustness & Data Integrity

- **Fuzzy Quote Matching**: If whitespace normalization or character encodings cause start/end offsets to drift, `resolveAnchorRange` in `src/utils/textMatcher.ts` automatically runs a normalized search to self-heal offsets.
- **State Persistence**: Review actions (status, custom notes, applied edits) persist across page reloads via `localStorage` (`northwind_ai_document_review_v1`), with a one-click session reset button.
- **Strict TypeScript & Oxlint**: Built under `verbatimModuleSyntax: true` and zero lint warnings.

---

## ⚖️ Prioritization & Trade-offs

### What We Prioritized
1. **Fluid, bidirectional context**: Zero friction between reading the contract and evaluating the AI's critique.
2. **Robust interval segmentation**: Overlapping anchors and cross-paragraph spans work seamlessly.
3. **Actionable triage**: Clear differentiation between High, Medium, and Low risks, inline redline diffs, and live contract amendments.
4. **Executive reporting**: Instant generation of negotiation schedules, audit notes, and risk score tracking.

### What We Cut / Scoped Out
- **Backend database**: Per specification, kept in-memory and `localStorage`.
- **Custom rich text editor**: We opted for clean structured text replacement rather than a heavy WYSIWYG editor like ProseMirror or Slate to keep performance snappy and bundle size small (~99 KB gzipped).

### What We'd Do With More Time
- **Interactive LLM Co-Pilot Drawer**: Connect an active LLM to allow reviewers to prompt: *"Draft a counter-clause with a 12-month liability cap and mutual indemnification"*.
- **Virtualization for 200+ Page Documents**: Implement `@tanstack/react-virtual` for enterprise-scale 500-page master agreements.
- **Multi-Reviewer Collaboration**: Real-time presence and conflict resolution via CRDTs (e.g., Yjs).
