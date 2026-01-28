/**
 * Budget Workflow Page
 *
 * PURPOSE:
 * - Create draft budget
 * - View budget versions
 * - Confirm a budget
 * - View superseded budgets
 * - Show status clearly (draft / confirmed / superseded)
 *
 * CONSTRAINTS:
 * - Human-in-the-loop only
 * - No calculations
 * - No validation beyond required fields
 * - No recommendations
 * - No automation
 * - Neutral tone
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getBudgets,
  getBudgetVersions,
  createBudget,
  confirmBudget,
} from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type { Budget, BudgetVersion, BudgetPayload, BudgetStatus } from "../types";

interface BudgetWorkflowPageProps {
  tenantId: string;
}

// Placeholder user ID - in production this would come from auth
const CURRENT_USER_ID = "operator-user";

export function BudgetWorkflowPage({ tenantId }: BudgetWorkflowPageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | "all">("all");

  // Form state for creating new budget
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<BudgetPayload>({
    name: "",
    description: "",
    periodStart: "",
    periodEnd: "",
    revenue: 0,
    costs: 0,
    labour: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Load budgets when venue changes
  useEffect(() => {
    async function loadBudgets() {
      if (!venueId) {
        setBudgets([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        const data = await getBudgets(tenantId, venueId, status);
        setBudgets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load budgets");
      } finally {
        setLoading(false);
      }
    }

    loadBudgets();
  }, [tenantId, venueId, statusFilter]);

  // Load versions when a budget is selected
  useEffect(() => {
    async function loadVersions() {
      if (!selectedBudget) {
        setVersions([]);
        return;
      }

      try {
        const data = await getBudgetVersions(tenantId, selectedBudget.id);
        setVersions(data);
      } catch (err) {
        console.error("Failed to load versions:", err);
      }
    }

    loadVersions();
  }, [tenantId, selectedBudget]);

  const handleCreateBudget = async () => {
    if (!venueId) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createBudget(tenantId, venueId, formData, CURRENT_USER_ID);
      setBudgets([result.budget, ...budgets]);
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        periodStart: "",
        periodEnd: "",
        revenue: 0,
        costs: 0,
        labour: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBudget = async (budget: Budget) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await confirmBudget(
        tenantId,
        budget.id,
        budget.payload,
        CURRENT_USER_ID
      );
      // Refresh the budgets list
      const status = statusFilter === "all" ? undefined : statusFilter;
      const data = await getBudgets(tenantId, venueId, status);
      setBudgets(data);
      setSelectedBudget(result.budget);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm budget");
    } finally {
      setSubmitting(false);
    }
  };

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to manage budgets.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Budget Workflow</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create, view, and confirm budgets for the selected venue
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
          disabled={showCreateForm}
        >
          Create Draft Budget
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
            Create Draft Budget
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
                placeholder="Budget name"
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
              <label className="block text-xs text-gray-500 mb-1">Revenue (£)</label>
              <input
                type="number"
                value={formData.revenue || 0}
                onChange={(e) =>
                  setFormData({ ...formData, revenue: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costs (£)</label>
              <input
                type="number"
                value={formData.costs || 0}
                onChange={(e) =>
                  setFormData({ ...formData, costs: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Labour (£)</label>
              <input
                type="number"
                value={formData.labour || 0}
                onChange={(e) =>
                  setFormData({ ...formData, labour: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateBudget}
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
          onChange={(e) => setStatusFilter(e.target.value as BudgetStatus | "all")}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="superseded">Superseded</option>
        </select>
      </div>

      {/* Budgets List */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No budgets found for the selected venue.
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              isSelected={selectedBudget?.id === budget.id}
              onSelect={() => setSelectedBudget(budget)}
              onConfirm={() => handleConfirmBudget(budget)}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {/* Version History */}
      {selectedBudget && versions.length > 0 && (
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

interface BudgetCardProps {
  budget: Budget;
  isSelected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

function BudgetCard({
  budget,
  isSelected,
  onSelect,
  onConfirm,
  submitting,
}: BudgetCardProps) {
  const statusStyles: Record<BudgetStatus, string> = {
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
              {budget.payload?.name || "Unnamed Budget"}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${statusStyles[budget.status]}`}
            >
              {budget.status}
            </span>
          </div>
          {budget.payload?.description && (
            <p className="text-xs text-gray-500 mt-1">
              {budget.payload.description}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {budget.payload?.periodStart && budget.payload?.periodEnd && (
              <span>
                Period: {formatDate(budget.payload.periodStart)} to {formatDate(budget.payload.periodEnd)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {budget.status === "draft" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              disabled={submitting}
              className="px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Confirm Budget
            </button>
          )}
        </div>
      </div>

      {/* Budget Details */}
      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="text-sm text-gray-900">
            {budget.payload?.revenue != null ? formatCurrency(budget.payload.revenue) : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Costs</div>
          <div className="text-sm text-gray-900">
            {budget.payload?.costs != null ? formatCurrency(budget.payload.costs) : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Labour</div>
          <div className="text-sm text-gray-900">
            {budget.payload?.labour != null ? formatCurrency(budget.payload.labour) : "-"}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-400 mt-3">
        Created: {formatDateTime(budget.createdAt)}
        {budget.confirmedAt && (
          <span className="ml-4">
            Confirmed: {formatDateTime(budget.confirmedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
