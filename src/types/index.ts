/**
 * Types for Operyx Kitchen Pro Read-Only UI
 *
 * PURPOSE:
 * - Define data structures for read-only views
 *
 * CONSTRAINTS:
 * - Types match existing backend responses exactly
 * - No new domain logic
 */

// ============================================================================
// VENUES
// ============================================================================
export interface Venue {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

// ============================================================================
// MONDAY BRIEFS
// ============================================================================
export interface MondayBriefPayload {
  // Allow any structure since the backend payload can vary
  [key: string]: unknown;
}

export interface MondayBrief {
  id: string;
  tenantId: string;
  venueId: string;
  weekStartDate: string;
  payload: MondayBriefPayload;
  generatedBy: string | null;
  createdAt: string;
}

// ============================================================================
// VARIANCE
// ============================================================================
export interface VariancePayload {
  // Allow any structure since the backend payload can vary
  [key: string]: unknown;
}

export interface Variance {
  id: string;
  tenantId: string;
  venueId: string;
  periodStartDate: string;
  periodEndDate: string;
  type: "budget_vs_actual" | "labour_vs_actual";
  payload: VariancePayload;
  computedBy: string | null;
  createdAt: string;
}

// ============================================================================
// GUARDIAN FINDINGS
// ============================================================================
export type GuardianFindingType =
  | "data_gap"
  | "variance_spike"
  | "assumption_mismatch"
  | "missing_budget"
  | "missing_labour_plan"
  | "missing_cash_data";

export type Severity = "low" | "medium" | "high";

export interface GuardianFindingPayload {
  description: string;
  details: Record<string, unknown>;
  evidenceIds?: string[];
}

export interface GuardianFinding {
  id: string;
  tenantId: string;
  venueId: string;
  weekStartDate: string;
  type: GuardianFindingType;
  severity: Severity;
  payload: GuardianFindingPayload;
  computedBy: string | null;
  createdAt: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================
export interface VenuesResponse {
  venues: Venue[];
}

export interface MondayBriefResponse {
  brief: MondayBrief | null;
}

export interface VariancesResponse {
  variances: Variance[];
  count: number;
}

export interface GuardianFindingsResponse {
  findings: GuardianFinding[];
  count: number;
}

// ============================================================================
// BUDGET WORKFLOW
// ============================================================================
export type BudgetStatus = "draft" | "confirmed" | "superseded";

export interface BudgetPayload {
  name?: string;
  description?: string;
  periodStart?: string;
  periodEnd?: string;
  revenue?: number;
  costs?: number;
  labour?: number;
  [key: string]: unknown;
}

export interface Budget {
  id: string;
  tenantId: string;
  venueId: string;
  status: BudgetStatus;
  payload: BudgetPayload;
  createdBy: string;
  confirmedBy: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface BudgetVersion {
  id: string;
  budgetId: string;
  tenantId: string;
  version: number;
  payload: BudgetPayload;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// LABOUR PLAN WORKFLOW
// ============================================================================
export type LabourPlanStatus = "draft" | "confirmed" | "superseded";

export interface LabourRole {
  role: string;
  hours: number;
  rate: number;
}

export interface LabourPlanPayload {
  name?: string;
  description?: string;
  periodStart?: string;
  periodEnd?: string;
  roles?: LabourRole[];
  totalHours?: number;
  totalCost?: number;
  headcount?: number;
  [key: string]: unknown;
}

export interface LabourPlan {
  id: string;
  tenantId: string;
  venueId: string;
  status: LabourPlanStatus;
  payload: LabourPlanPayload;
  createdBy: string;
  confirmedBy: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface LabourPlanVersion {
  id: string;
  labourPlanId: string;
  tenantId: string;
  version: number;
  payload: LabourPlanPayload;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// CASH SNAPSHOT WORKFLOW
// ============================================================================
export interface CashSnapshotPayload {
  revenue?: number;
  costs?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface CashSnapshot {
  id: string;
  tenantId: string;
  venueId: string;
  weekStartDate: string;
  isCorrection: boolean;
  correctsSnapshotId: string | null;
  correctionReason: string | null;
  payload: CashSnapshotPayload;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// EVIDENCE WORKFLOW
// ============================================================================
export type EvidenceType = "image" | "csv";
export type EvidenceSource = "rota" | "pos" | "payroll" | "other";
export type CandidateStatus = "pending" | "confirmed" | "rejected";

export interface Evidence {
  id: string;
  tenantId: string;
  venueId: string;
  type: EvidenceType;
  source: EvidenceSource;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface EvidenceCandidate {
  id: string;
  evidenceId: string;
  tenantId: string;
  status: CandidateStatus;
  payload: Record<string, unknown>;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  canonicalRecordId: string | null;
  createdAt: string;
}
