import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReviewWorkspacePage } from './pages/ReviewWorkspacePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Global App Layout — Dashboard, Documents, Reports, Settings show global nav */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Dedicated full-screen Review Workspace — NO global nav, its own compact toolbar */}
        <Route path="/review/:documentId" element={<ReviewWorkspacePage />} />
        {/* /review redirects to the primary MSA document */}
        <Route path="/review" element={<Navigate to="/review/msa-northwind-brightline-2026" replace />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
