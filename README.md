# Bitnimbus AI – Intelligent Contract Review Dashboard

A modern, interactive contract review dashboard built with React and TypeScript. It provides a centralized workspace to review a Master Services Agreement (MSA), identify contract risks, manage findings, apply suggested amendments, and track review progress.

**Live Demo:** https://bitnimbus.netlify.app/  
**GitHub Repository:** https://github.com/shaliniga/Bitnimbus-AI

---

## Overview

Bitnimbus AI is a client-side contract review application designed to simplify the contract review process through an intuitive dashboard and an interactive document workspace.

The application includes a portfolio dashboard and a dedicated review workspace for a sample Master Services Agreement. Users can explore contract findings, navigate between highlighted clauses and their associated findings, manage review decisions, add notes, and apply or revert suggested amendments.

> **Note:** This is a frontend demonstration using bundled sample contract data and findings. It does not currently integrate with a live AI service or backend.

## Key Features

### 1. Contract Portfolio Dashboard
- View contract portfolio summaries and review progress.
- Monitor contract risk levels and review statuses.
- Explore document metadata and portfolio entries.
- View recent review activity.

### 2. Interactive Contract Review
- Read the supplied Master Services Agreement in a structured document viewer.
- Highlight contract clauses associated with findings.
- Navigate between findings and their corresponding document sections.
- Support overlapping and cross-paragraph annotations.
- Navigate findings using keyboard shortcuts.

### 3. Finding Management
- Review findings categorized by severity.
- Filter findings by severity, category, and review status.
- Search findings and sort them by severity, confidence, or status.
- Accept or dismiss findings.
- Add reviewer comments and notes.

### 4. Suggested Amendments
- View proposed text changes with inline comparisons.
- Apply suggested amendments to the contract.
- Revert applied amendments to restore original text.
- Prevent conflicting amendment operations.

### 5. Review Progress and Reports
- Track accepted, dismissed, and pending findings.
- View review summaries and risk analytics.
- Export reports in Markdown and JSON formats.
- Print review summaries.

### 6. Persistent Review State
- Save review progress using browser LocalStorage.
- Restore review statuses, notes, and amendments after refreshing the page.
- Configure automatic saving through reviewer settings.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| State Management | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Persistence | Browser LocalStorage |

## Getting Started

### Prerequisites

- Node.js 22.12 or later
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/shaliniga/Bitnimbus-AI.git
```

Navigate to the project directory:

```bash
cd Bitnimbus-AI
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL provided by Vite, usually:

```text
http://localhost:5173
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build the application |
| `npm run lint` | Run Oxlint |
| `npm test` | Run the review workflow tests |
| `npm run preview` | Preview the production build |

## Application Routes

| Route | Description |
|---|---|
| `/` | Dashboard and portfolio overview |
| `/documents` | Contract portfolio and document metadata |
| `/review` | Redirects to the supported MSA review |
| `/review/:documentId` | Contract review workspace |
| `/reports` | Review analytics and amendment reports |
| `/settings` | Reviewer preferences and application settings |

## Project Structure

```text
Bitnimbus-AI/
├── public/
├── src/
│   ├── assets/
│   │   ├── findings.json
│   │   └── sample-contract.json
│   ├── components/
│   │   ├── common/
│   │   ├── document/
│   │   ├── findings/
│   │   ├── header/
│   │   ├── layout/
│   │   └── modals/
│   ├── hooks/
│   ├── pages/
│   ├── store/
│   │   └── useReviewStore.ts
│   ├── types/
│   └── utils/
│       ├── amendments.ts
│       ├── documentReview.ts
│       ├── reviewPersistence.ts
│       ├── spanSplitter.ts
│       └── textMatcher.ts
├── tests/
├── package.json
└── README.md
```

## Current Limitations

- Only the bundled Master Services Agreement has actual contract content and associated findings.
- Other portfolio entries are demo-only and cannot be reviewed.
- Adding a portfolio entry currently saves document metadata; file upload and contract parsing are not implemented.
- PDF and DOCX parsing are not currently supported.
- Findings are predefined sample data rather than AI-generated results.
- Risk analytics and dashboard activity use local demonstration data.
- Review data is stored in browser LocalStorage. There is no backend, authentication, or cross-device synchronization.

## Future Enhancements

- Integrate an AI-powered contract analysis service.
- Support PDF and DOCX document uploads and parsing.
- Generate contract findings automatically.
- Introduce backend APIs and database persistence.
- Add authentication and role-based access control.
- Support collaborative contract reviews.

---

## Author

**Shalini G.**

[GitHub](https://github.com/shaliniga)

---

## License

This project is available for demonstration and learning purposes.
