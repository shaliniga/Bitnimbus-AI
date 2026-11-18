# Northwind Analytics — AI Document Review & Legal Operations Platform

An enterprise-grade, multi-page legal AI review platform designed for corporate legal counsel and legal operations teams. The platform combines portfolio-wide risk governance with a context-rich, bidirectional contract review workspace.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **React Router v7**, **Recharts**, and **Zustand**.

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

## 🏛️ Multi-Page Platform Architecture

The application is structured into five cohesive, dedicated views connected via **React Router**:

```
+-----------------------------------------------------------------------------------------------------------------+
| GLOBAL TOPBAR: [Scale] Northwind LEGAL AI | Dashboard | Documents | Review Workspace [24] | Reports | Settings  |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                                 |
|  1. /dashboard       -> Portfolio metrics, Risk distribution chart, Recent documents & Live activity feed       |
|  2. /documents       -> Contract repository with filters (Risk, Status, Search) & Upload document modal         |
|  3. /review          -> Full 3-column Contract Review Workspace with integrated command bar & redlines          |
|  4. /reports         -> Review completion analytics, category & severity distribution, negotiated amendments    |
|  5. /settings        -> Reviewer profile, theme preferences (light/dark/system), and alert configurations       |
|                                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------+
```

### 1. Dashboard (`/`)
- **Key Metrics**: Total active contracts, Completed reviews, Pending reviews, and High-risk agreements.
- **Visual Analytics**: Interactive Recharts bar chart of portfolio risk distribution (Critical, High, Moderate, Low) and findings severity breakdown.
- **Quick Actions**: One-click jump to resume the in-flight Master Services Agreement review.
- **Live Activity Feed**: Real-time event log tracking reviewer decisions, applied amendments, and comments.

### 2. Documents Portfolio (`/documents`)
- **Search & Multi-Filters**: Filter by risk level, review status, or text search across vendors, document titles, and tags.
- **Comprehensive Listing**: Displays document name, vendor, risk pill, status badge, finding progress bar, upload date, and direct review launch.
- **Contract Upload Interface**: Upload modal supporting JSON, PDF, and DOCX files with simulated AI risk extraction that registers contracts directly into the portfolio.

### 3. Review Workspace (`/review` or `/review/:id`)
- **Preserved Core Functionality**: Preserves the complete three-column legal review interface without breaking existing annotations or keyboard navigation.
- **Unified Command Bar**: Eliminated redundant duplicate headers by integrating the document title, vendor name, back-to-portfolio breadcrumb, and sidebar toggle into a slim, single-tier workspace toolbar.
- **Executive Risk Barometer**: Dynamically computes residual risk score ($0$–$100$) weighted by severity and confidence.
- **Interval-Splitting Highlighter**: Gracefully handles overlapping finding anchors (`f-04` & `f-05` in `§ 6.2`), cross-paragraph spans (`f-02` in `§ 3.4`–`§ 3.5`), and document-wide missing clauses (`f-09`).
- **Live Redline Amendment**: Allows reviewers to accept AI proposed edits, applying changes in-place with an "Amended" badge and inline word-level diff.
- **Speed Review Zen Mode (`Z`)**: Distraction-free single-clause triage mode.

### 4. Reports & Analytics (`/reports`)
- **Completion Analytics**: Donut/pie chart of Accepted vs. Dismissed vs. Pending findings.
- **Severity & Discipline Breakdown**: Bar charts depicting risk gravity and legal categories (Liability, Data Protection, Termination, Payment, etc.).
- **Negotiated Redline Schedule**: Table of all accepted contract modifications.
- **Multi-Format Export**: Instant export to Markdown, JSON Audit log, or browser print / PDF.

### 5. Settings (`/settings`)
- **Reviewer Identity**: Reviewer name, role, email, and department metadata.
- **Theme Preferences**: Clean Light, Deep Dark, or System Match.
- **Audit Automation**: Auto-save drafts to `localStorage`, critical risk alerts, and export format defaults.

---

## ⌨️ Keyboard Shortcuts (Review Workspace)

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

## 🛡️ Data Handling & State Management

- **Centralized Zustand Store**: Persistent state via `zustand/middleware` under `localStorage` key `northwind_ai_document_review_v1`.
- **Dynamic Metric Synchronization**: Actions taken on individual findings in the Review Workspace automatically update the portfolio metrics, progress rings, and activity feeds across all pages in real time.
- **Strict Verification**: Built with `verbatimModuleSyntax: true` and verified with Oxlint (0 errors, 0 warnings).
