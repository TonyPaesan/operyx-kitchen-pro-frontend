/**
 * App Component
 *
 * PURPOSE:
 * - Main application entry point
 * - Routing configuration
 *
 * CONSTRAINTS:
 * - Phase 11A: READ-ONLY views (brief, variance, findings)
 * - Phase 12: Human-in-the-loop workflow UIs (budget, labour, cash, evidence)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MondayBriefPage } from "./pages/MondayBriefPage";
import { VariancePage } from "./pages/VariancePage";
import { GuardianFindingsPage } from "./pages/GuardianFindingsPage";
import { BudgetWorkflowPage } from "./pages/BudgetWorkflowPage";
import { LabourWorkflowPage } from "./pages/LabourWorkflowPage";
import { CashWorkflowPage } from "./pages/CashWorkflowPage";
import { EvidenceWorkflowPage } from "./pages/EvidenceWorkflowPage";
import { TestBudgetPage } from "./pages/TestBudgetPage";

// Default tenant ID for single-tenant view
// In production, this would come from authentication
const DEFAULT_TENANT_ID = "9801f53f-55be-4a2c-91e4-38870641876f";

function App() {
  const tenantId = DEFAULT_TENANT_ID;

  return (
    <BrowserRouter>
      <Layout tenantId={tenantId}>
        <Routes>
          <Route path="/" element={<Navigate to="/brief" replace />} />
          {/* Phase 11A: Read-only views */}
          <Route
            path="/brief"
            element={<MondayBriefPage tenantId={tenantId} />}
          />
          <Route
            path="/variance"
            element={<VariancePage tenantId={tenantId} />}
          />
          <Route
            path="/findings"
            element={<GuardianFindingsPage tenantId={tenantId} />}
          />
          {/* Phase 12: Workflow UIs */}
          <Route
            path="/workflow/budget"
            element={<BudgetWorkflowPage tenantId={tenantId} />}
          />
          <Route
            path="/workflow/labour"
            element={<LabourWorkflowPage tenantId={tenantId} />}
          />
          <Route
            path="/workflow/cash"
            element={<CashWorkflowPage tenantId={tenantId} />}
          />
          <Route
            path="/workflow/evidence"
            element={<EvidenceWorkflowPage tenantId={tenantId} />}
          />
          <Route path="/test-budget" element={<TestBudgetPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
