/**
 * Labour Assumptions Workflow Page
 *
 * PURPOSE:
 * - Create draft labour plan
 * - Enter roles, hours, rates (raw inputs)
 * - View versions
 * - Confirm labour plan
 * - Show status clearly
 *
 * CONSTRAINTS:
 * - Human-in-the-loop only
 * - No optimisation
 * - No comparisons to budget or cash
 * - No recommendations
 * - No automation
 * - Neutral tone
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getLabourPlans,
  getLabourPlanVersions,
  createLabourPlan,
  confirmLabourPlan,
} from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type {
  LabourPlan,
  LabourPlanVersion,
  LabourPlanPayload,
  LabourPlanStatus,
  LabourRole,
} from "../types";

interface LabourWorkflowPageProps {
  tenantId: string;
}

// Placeholder user ID - in production this would come from auth
const CURRENT_USER_ID = "operator-user";

export function LabourWorkflowPage({ tenantId }: LabourWorkflowPageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";

  const [labourPlans, setLabourPlans] = useState<LabourPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<LabourPlan | null>(null);
  const [versions, setVersions] = useState<LabourPlanVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LabourPlanStatus | "all">("all");

  // Form state for creating new labour plan
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<LabourPlanPayload>({
    name: "",
    description: "",
    periodStart: "",
    periodEnd: "",
    roles: [],
    totalHours: 0,
    totalCost: 0,
    headcount: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Load labour plans when venue changes
  useEffect(() => {
    async function loadLabourPlans() {
      if (!venueId) {
        setLabourPlans([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        const data = await getLabourPlans(tenantId, venueId, status);
        setLabourPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load labour plans");
      } finally {
        setLoading(false);
      }
    }

    loadLabourPlans();
  }, [tenantId, venueId, statusFilter]);

  // Load versions when a plan is selected
  useEffect(() => {
    async function loadVersions() {
      if (!selectedPlan) {
        setVersions([]);
        return;
      }

      try {
        const data = await getLabourPlanVersions(tenantId, selectedPlan.id);
        setVersions(data);
      } catch (err) {
        console.error("Failed to load versions:", err);
      }
    }

    loadVersions();
  }, [tenantId, selectedPlan]);

  const handleAddRole = () => {
    setFormData({
      ...formData,
      roles: [...(formData.roles || []), { role: "", hours: 0, rate: 0 }],
    });
  };

  const handleRemoveRole = (index: number) => {
    const newRoles = [...(formData.roles || [])];
    newRoles.splice(index, 1);
    setFormData({ ...formData, roles: newRoles });
  };

  const handleRoleChange = (
    index: number,
    field: keyof LabourRole,
    value: string | number
  ) => {
    const newRoles = [...(formData.roles || [])];
    newRoles[index] = { ...newRoles[index], [field]: value };
    setFormData({ ...formData, roles: newRoles });
  };

  const handleCreateLabourPlan = async () => {
    if (!venueId) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createLabourPlan(
        tenantId,
        venueId,
        formData,
        CURRENT_USER_ID
      );
      setLabourPlans([result.labourPlan, ...labourPlans]);
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        periodStart: "",
        periodEnd: "",
        roles: [],
        totalHours: 0,
        totalCost: 0,
        headcount: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create labour plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmLabourPlan = async (plan: LabourPlan) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await confirmLabourPlan(
        tenantId,
        plan.id,
        plan.payload,
        CURRENT_USER_ID
      );
      // Refresh the plans list
      const status = statusFilter === "all" ? undefined : statusFilter;
      const data = await getLabourPlans(tenantId, venueId, status);
      setLabourPlans(data);
      setSelectedPlan(result.labourPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm labour plan");
    } finally {
      setSubmitting(false);
    }
  };

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to manage labour assumptions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Labour Assumptions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create, view, and confirm labour plans for the selected venue
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
          disabled={showCreateForm}
        >
          Create Draft Plan
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Create Draft Labour Plan
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Plan name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Period Start (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={formData.periodStart || ""}
                onChange={(e) =>
                  setFormData({ ...formData, periodStart: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Period End (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={formData.periodEnd || ""}
                onChange={(e) =>
                  setFormData({ ...formData, periodEnd: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Total Hours
              </label>
              <input
                type="number"
                value={formData.totalHours || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalHours: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Total Cost (£)
              </label>
              <input
                type="number"
                value={formData.totalCost || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalCost: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Headcount
              </label>
              <input
                type="number"
                value={formData.headcount || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    headcount: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Roles Section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-500">Roles</label>
              <button
                type="button"
                onClick={handleAddRole}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                + Add Role
              </button>
            </div>
            {(formData.roles || []).length === 0 ? (
              <div className="text-xs text-gray-400 py-2">
                No roles added. Click "Add Role" to add labour roles.
              </div>
            ) : (
              <div className="space-y-2">
                {(formData.roles || []).map((role, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={role.role}
                      onChange={(e) =>
                        handleRoleChange(index, "role", e.target.value)
                      }
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Role name"
                    />
                    <input
                      type="number"
                      value={role.hours}
                      onChange={(e) =>
                        handleRoleChange(index, "hours", Number(e.target.value))
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Hours"
                    />
                    <input
                      type="number"
                      value={role.rate}
                      onChange={(e) =>
                        handleRoleChange(index, "rate", Number(e.target.value))
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Rate (£)"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(index)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateLabourPlan}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Draft"}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as LabourPlanStatus | "all")
          }
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="superseded">Superseded</option>
        </select>
      </div>

      {/* Labour Plans List */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading labour plans...</div>
      ) : labourPlans.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No labour plans found for the selected venue.
        </div>
      ) : (
        <div className="space-y-3">
          {labourPlans.map((plan) => (
            <LabourPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan?.id === plan.id}
              onSelect={() => setSelectedPlan(plan)}
              onConfirm={() => handleConfirmLabourPlan(plan)}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {/* Version History */}
      {selectedPlan && versions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Version History
          </h3>
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="border-b border-gray-100 pb-2 last:border-0"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Version {version.version}</span>
                  <span className="text-gray-500">
                    {formatDateTime(version.createdAt)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created by: {version.createdBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface LabourPlanCardProps {
  plan: LabourPlan;
  isSelected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

function LabourPlanCard({
  plan,
  isSelected,
  onSelect,
  onConfirm,
  submitting,
}: LabourPlanCardProps) {
  const statusStyles: Record<LabourPlanStatus, string> = {
    draft: "bg-gray-100 text-gray-700",
    confirmed: "bg-gray-200 text-gray-800",
    superseded: "bg-gray-50 text-gray-500",
  };

  return (
    <div
      className={`bg-white border rounded p-4 cursor-pointer ${
        isSelected ? "border-gray-400" : "border-gray-200"
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {plan.payload?.name || "Unnamed Plan"}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${statusStyles[plan.status]}`}
            >
              {plan.status}
            </span>
          </div>
          {plan.payload?.description && (
            <p className="text-xs text-gray-500 mt-1">
              {plan.payload.description}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {plan.payload?.periodStart && plan.payload?.periodEnd && (
              <span>
                Period: {formatDate(plan.payload.periodStart)} to {formatDate(plan.payload.periodEnd)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {plan.status === "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              disabled={submitting}
              className="px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Confirm Plan
            </button>
          )}
        </div>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500">Total Hours</div>
          <div className="text-sm text-gray-900">
            {plan.payload?.totalHours?.toLocaleString("en-GB") ?? "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Total Cost</div>
          <div className="text-sm text-gray-900">
            {plan.payload?.totalCost != null ? formatCurrency(plan.payload.totalCost) : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Headcount</div>
          <div className="text-sm text-gray-900">
            {plan.payload?.headcount?.toLocaleString("en-GB") ?? "-"}
          </div>
        </div>
      </div>

      {/* Roles */}
      {plan.payload?.roles && plan.payload.roles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs text-gray-500 mb-2">Roles</h4>
          <div className="space-y-1">
            {plan.payload.roles.map((role, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-800">{role.role}</span>
                <span className="text-gray-600">
                  {role.hours} hours @ {formatCurrency(role.rate)}/hr
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 mt-3">
        Created: {formatDateTime(plan.createdAt)}
        {plan.confirmedAt && (
          <span className="ml-4">
            Confirmed: {formatDateTime(plan.confirmedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
