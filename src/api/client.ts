/**
 * API Client for Operyx Kitchen Pro Read-Only UI
 *
 * PURPOSE:
 * - Fetch existing data from the backend API
 * - All operations are READ-ONLY
 *
 * CONSTRAINTS:
 * - NO writes
 * - NO mutations
 * - NO new domain logic
 */

import type {
  Venue,
  MondayBrief,
  Variance,
  GuardianFinding,
} from "../types";

const API_BASE = "/api";

// ============================================================================
// VENUES (READ-ONLY)
// ============================================================================

export async function getVenues(tenantId: string): Promise<Venue[]> {
  const response = await fetch(`${API_BASE}/venues/${tenantId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch venues: ${response.statusText}`);
  }
  const data = await response.json();
  return data.venues || [];
}

// ============================================================================
// MONDAY BRIEFS (READ-ONLY)
// ============================================================================

export async function getMondayBrief(
  tenantId: string,
  venueId: string,
  weekStartDate: string
): Promise<MondayBrief | null> {
  const response = await fetch(
    `${API_BASE}/monday-briefs/${tenantId}/venue/${venueId}/week?weekStartDate=${weekStartDate}`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch Monday brief: ${response.statusText}`);
  }
  const data = await response.json();
  return data.brief || null;
}

export async function getMondayBriefs(
  tenantId: string,
  venueId: string
): Promise<MondayBrief[]> {
  const response = await fetch(
    `${API_BASE}/monday-briefs/${tenantId}/venue/${venueId}/list`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch Monday briefs: ${response.statusText}`);
  }
  const data = await response.json();
  return data.briefs || [];
}

// ============================================================================
// VARIANCES (READ-ONLY)
// ============================================================================

export async function getVariances(
  tenantId: string,
  venueId: string
): Promise<Variance[]> {
  const response = await fetch(
    `${API_BASE}/variances/${tenantId}/venue/${venueId}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch variances: ${response.statusText}`);
  }
  const data = await response.json();
  return data.variances || [];
}

export async function getVariancesByPeriod(
  tenantId: string,
  venueId: string,
  periodStartDate: string,
  periodEndDate: string
): Promise<Variance[]> {
  const response = await fetch(
    `${API_BASE}/variances/${tenantId}/venue/${venueId}?periodStartDate=${periodStartDate}&periodEndDate=${periodEndDate}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch variances: ${response.statusText}`);
  }
  const data = await response.json();
  return data.variances || [];
}

// ============================================================================
// GUARDIAN FINDINGS (READ-ONLY)
// ============================================================================

export async function getGuardianFindings(
  tenantId: string,
  venueId: string,
  weekStartDate?: string
): Promise<GuardianFinding[]> {
  let url = `${API_BASE}/guardian/${tenantId}/venue/${venueId}`;
  if (weekStartDate) {
    url += `?weekStartDate=${weekStartDate}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Guardian findings: ${response.statusText}`);
  }
  const data = await response.json();
  return data.findings || [];
}

export async function getGuardianFindingsSummary(
  tenantId: string
): Promise<Record<string, number>> {
  const response = await fetch(`${API_BASE}/guardian/${tenantId}/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Guardian summary: ${response.statusText}`);
  }
  const data = await response.json();
  return data.summary || {};
}

// ============================================================================
// BUDGET WORKFLOW
// ============================================================================

import type {
  Budget,
  BudgetVersion,
  BudgetStatus,
  BudgetPayload,
  LabourPlan,
  LabourPlanVersion,
  LabourPlanStatus,
  LabourPlanPayload,
  CashSnapshot,
  CashSnapshotPayload,
  Evidence,
  EvidenceCandidate,
  EvidenceSource,
} from "../types";

export async function getBudgets(
  tenantId: string,
  venueId: string,
  status?: BudgetStatus
): Promise<Budget[]> {
  let url = `${API_BASE}/budgets/${tenantId}/venue/${venueId}`;
  if (status) {
    url += `?status=${status}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch budgets: ${response.statusText}`);
  }
  const data = await response.json();
  return data.budgets || [];
}

export async function getBudget(
  tenantId: string,
  budgetId: string
): Promise<Budget | null> {
  const response = await fetch(`${API_BASE}/budgets/${tenantId}/${budgetId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch budget: ${response.statusText}`);
  }
  const data = await response.json();
  return data.budget || null;
}

export async function getConfirmedBudget(
  tenantId: string,
  venueId: string
): Promise<Budget | null> {
  const response = await fetch(
    `${API_BASE}/budgets/${tenantId}/venue/${venueId}/confirmed`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch confirmed budget: ${response.statusText}`);
  }
  const data = await response.json();
  return data.budget || null;
}

export async function getBudgetVersions(
  tenantId: string,
  budgetId: string
): Promise<BudgetVersion[]> {
  const response = await fetch(
    `${API_BASE}/budgets/${tenantId}/${budgetId}/versions`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch budget versions: ${response.statusText}`);
  }
  const data = await response.json();
  return data.versions || [];
}

export async function createBudget(
  tenantId: string,
  venueId: string,
  payload: BudgetPayload,
  createdBy: string
): Promise<{ budget: Budget; version: BudgetVersion }> {
  const response = await fetch(
    `${API_BASE}/budgets/${tenantId}/venue/${venueId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, createdBy }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create budget: ${response.statusText}`);
  }
  return response.json();
}

export async function confirmBudget(
  tenantId: string,
  budgetId: string,
  payload: BudgetPayload,
  confirmedBy: string
): Promise<{ budget: Budget; version: BudgetVersion }> {
  const response = await fetch(
    `${API_BASE}/budgets/${tenantId}/${budgetId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, confirmedBy }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to confirm budget: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// LABOUR PLAN WORKFLOW
// ============================================================================

export async function getLabourPlans(
  tenantId: string,
  venueId: string,
  status?: LabourPlanStatus
): Promise<LabourPlan[]> {
  let url = `${API_BASE}/labour-plans/${tenantId}/venue/${venueId}`;
  if (status) {
    url += `?status=${status}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch labour plans: ${response.statusText}`);
  }
  const data = await response.json();
  return data.labourPlans || [];
}

export async function getLabourPlan(
  tenantId: string,
  labourPlanId: string
): Promise<LabourPlan | null> {
  const response = await fetch(
    `${API_BASE}/labour-plans/${tenantId}/${labourPlanId}`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch labour plan: ${response.statusText}`);
  }
  const data = await response.json();
  return data.labourPlan || null;
}

export async function getConfirmedLabourPlan(
  tenantId: string,
  venueId: string
): Promise<LabourPlan | null> {
  const response = await fetch(
    `${API_BASE}/labour-plans/${tenantId}/venue/${venueId}/confirmed`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch confirmed labour plan: ${response.statusText}`);
  }
  const data = await response.json();
  return data.labourPlan || null;
}

export async function getLabourPlanVersions(
  tenantId: string,
  labourPlanId: string
): Promise<LabourPlanVersion[]> {
  const response = await fetch(
    `${API_BASE}/labour-plans/${tenantId}/${labourPlanId}/versions`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch labour plan versions: ${response.statusText}`);
  }
  const data = await response.json();
  return data.versions || [];
}

export async function createLabourPlan(
  tenantId: string,
  venueId: string,
  payload: LabourPlanPayload,
  createdBy: string
): Promise<{ labourPlan: LabourPlan; version: LabourPlanVersion }> {
  const response = await fetch(
    `${API_BASE}/labour-plans/${tenantId}/venue/${venueId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, createdBy }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create labour plan: ${response.statusText}`);
  }
  return response.json();
}

export async function confirmLabourPlan(
  tenantId: string,
  labourPlanId: string,
  payload: LabourPlanPayload,
  confirmedBy: string
): Promise<{ labourPlan: LabourPlan; version: LabourPlanVersion }> {
  const response = await fetch(
    `${API_BASE}/labour-plans/${tenantId}/${labourPlanId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, confirmedBy }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to confirm labour plan: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// CASH SNAPSHOT WORKFLOW
// ============================================================================

export async function getCashSnapshots(
  tenantId: string,
  venueId: string
): Promise<CashSnapshot[]> {
  const response = await fetch(
    `${API_BASE}/cash-snapshots/${tenantId}/venue/${venueId}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch cash snapshots: ${response.statusText}`);
  }
  const data = await response.json();
  return data.snapshots || [];
}

export async function getCashSnapshotByWeek(
  tenantId: string,
  venueId: string,
  weekStartDate: string
): Promise<CashSnapshot | null> {
  const response = await fetch(
    `${API_BASE}/cash-snapshots/${tenantId}/venue/${venueId}/week/${weekStartDate}`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch cash snapshot: ${response.statusText}`);
  }
  const data = await response.json();
  return data.snapshot || null;
}

export async function getCashSnapshotHistory(
  tenantId: string,
  venueId: string,
  weekStartDate: string
): Promise<CashSnapshot[]> {
  const response = await fetch(
    `${API_BASE}/cash-snapshots/${tenantId}/venue/${venueId}/week/${weekStartDate}/history`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch cash snapshot history: ${response.statusText}`);
  }
  const data = await response.json();
  return data.snapshots || [];
}

export async function createCashSnapshot(
  tenantId: string,
  venueId: string,
  weekStartDate: string,
  payload: CashSnapshotPayload,
  createdBy: string
): Promise<{ snapshot: CashSnapshot }> {
  const response = await fetch(
    `${API_BASE}/cash-snapshots/${tenantId}/venue/${venueId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStartDate, payload, createdBy }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create cash snapshot: ${response.statusText}`);
  }
  return response.json();
}

export async function createCorrectionSnapshot(
  tenantId: string,
  snapshotId: string,
  weekStartDate: string,
  payload: CashSnapshotPayload,
  createdBy: string,
  reason: string
): Promise<{ snapshot: CashSnapshot }> {
  const response = await fetch(
    `${API_BASE}/cash-snapshots/${tenantId}/${snapshotId}/correct`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStartDate, payload, createdBy, reason }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create correction: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// EVIDENCE WORKFLOW
// ============================================================================

export async function getEvidenceByVenue(
  tenantId: string,
  venueId: string,
  source?: EvidenceSource
): Promise<Evidence[]> {
  let url = `${API_BASE}/evidence/${tenantId}/venue/${venueId}`;
  if (source) {
    url += `?source=${source}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch evidence: ${response.statusText}`);
  }
  const data = await response.json();
  return data.evidence || [];
}

export async function getEvidence(
  tenantId: string,
  evidenceId: string
): Promise<Evidence | null> {
  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/${evidenceId}`
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch evidence: ${response.statusText}`);
  }
  const data = await response.json();
  return data.evidence || null;
}

export async function uploadEvidence(
  tenantId: string,
  venueId: string,
  file: File,
  source: EvidenceSource,
  uploadedBy: string
): Promise<{ evidence: Evidence }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("source", source);
  formData.append("uploadedBy", uploadedBy);

  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/venue/${venueId}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  // Check content type before parsing to avoid JSON parse errors on HTML responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response received:", text.substring(0, 200));
    throw new Error(`Server returned non-JSON response (${response.status}). This may indicate an authentication or routing issue.`);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to upload evidence: ${response.statusText}`);
  }

  return response.json();
}

export async function extractFromEvidence(
  tenantId: string,
  evidenceId: string
): Promise<{ candidates: EvidenceCandidate[] }> {
  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/${evidenceId}/extract`,
    {
      method: "POST",
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to extract from evidence: ${response.statusText}`);
  }
  return response.json();
}

export async function getCandidatesByEvidence(
  tenantId: string,
  evidenceId: string
): Promise<EvidenceCandidate[]> {
  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/${evidenceId}/candidates`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch candidates: ${response.statusText}`);
  }
  const data = await response.json();
  return data.candidates || [];
}

export async function getPendingCandidates(
  tenantId: string
): Promise<EvidenceCandidate[]> {
  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/candidates/pending`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch pending candidates: ${response.statusText}`);
  }
  const data = await response.json();
  return data.candidates || [];
}

export async function confirmCandidate(
  tenantId: string,
  candidateId: string,
  reviewedBy: string,
  overridePayload?: Record<string, unknown>
): Promise<{ candidate: EvidenceCandidate; canonicalRecord: unknown }> {
  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/candidate/${candidateId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewedBy, overridePayload }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to confirm candidate: ${response.statusText}`);
  }
  return response.json();
}

export async function rejectCandidate(
  tenantId: string,
  candidateId: string,
  reviewedBy: string,
  reason: string
): Promise<{ candidate: EvidenceCandidate }> {
  const response = await fetch(
    `${API_BASE}/evidence/${tenantId}/candidate/${candidateId}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewedBy, reason }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to reject candidate: ${response.statusText}`);
  }
  return response.json();
}
