/**
 * Variance Page
 *
 * PURPOSE:
 * - Display computed variances
 * - Show planned vs actual vs delta only
 *
 * CONSTRAINTS:
 * - READ-ONLY
 * - Neutral tone
 * - Factual language
 * - No alerts
 * - No call-to-action buttons
 * - No colour-coded judgement
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getVariances } from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type { Variance } from "../types";

interface VariancePageProps {
  tenantId: string;
}

// Helper to format numbers (non-currency)
function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  return num.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Helper to format currency values
function formatMoney(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  return formatCurrency(num);
}
// Helper to format metric names
function formatMetricName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function VariancePage({ tenantId }: VariancePageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";

  const [variances, setVariances] = useState<Variance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVariances() {
      if (!venueId) {
        setVariances([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getVariances(tenantId, venueId);
        setVariances(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load variances");
      } finally {
        setLoading(false);
      }
    }

    loadVariances();
  }, [tenantId, venueId]);

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to view variance data.
      </div>
    );
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading variances...</div>;
  }

  if (error) {
    return <div className="text-gray-500 text-sm">Unable to load variance data.</div>;
  }

  if (variances.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No variance data available for the selected venue.
      </div>
    );
  }

  // Group variances by type
  const budgetVariances = variances.filter((v) => v.type === "budget_vs_actual");
  const labourVariances = variances.filter((v) => v.type === "labour_vs_actual");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Variance View</h2>
        <p className="text-sm text-gray-500 mt-1">
          Planned vs actual comparison
        </p>
      </div>

      {/* Budget vs Actual */}
      {budgetVariances.length > 0 && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Budget vs Actual
          </h3>
          <div className="space-y-4">
            {budgetVariances.map((variance) => (
              <BudgetVarianceCard key={variance.id} variance={variance} />
            ))}
          </div>
        </section>
      )}

      {/* Labour vs Actual */}
      {labourVariances.length > 0 && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Labour vs Actual
          </h3>
          <div className="space-y-4">
            {labourVariances.map((variance) => (
              <LabourVarianceCard key={variance.id} variance={variance} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BudgetVarianceCard({ variance }: { variance: Variance }) {
  // The actual payload structure from the backend
  const payload = variance.payload as {
    planned: { costs: number; labour: number; revenue: number };
    actual: { costs: number; revenue: number; snapshotCount: number };
    delta: { costs: number; revenue: number };
    percentageDelta?: { costs: number; revenue: number };
    metadata?: {
      budgetId: string;
      computedAt: string;
      budgetVersionId: string;
      cashSnapshotIds: string[];
    };
  };

  const periodStart = variance.periodStartDate
    ? formatDate(variance.periodStartDate)
    : "-";
  const periodEnd = variance.periodEndDate
    ? formatDate(variance.periodEndDate)
    : "-";

  return (
    <div className="border border-gray-100 rounded p-3">
      <div className="text-xs text-gray-500 mb-3">
        Period: {periodStart} to {periodEnd}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="pb-2">Metric</th>
            <th className="pb-2 text-right">Planned</th>
            <th className="pb-2 text-right">Actual</th>
            <th className="pb-2 text-right">Delta</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Costs</td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.planned?.costs)}
            </td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.actual?.costs)}
            </td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.delta?.costs)}
            </td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Labour</td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.planned?.labour)}
            </td>
            <td className="py-2 text-right text-gray-600">-</td>
            <td className="py-2 text-right text-gray-600">-</td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Revenue</td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.planned?.revenue)}
            </td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.actual?.revenue)}
            </td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.delta?.revenue)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="text-xs text-gray-400 mt-3">
        Computed: {formatDateTime(variance.createdAt)}
      </div>
    </div>
  );
}

function LabourVarianceCard({ variance }: { variance: Variance }) {
  // The actual payload structure from the backend
  const payload = variance.payload as {
    planned: { cost: number; hours: number; roles: unknown[]; headcount: number };
    actual: {
      note: string;
      labourCost: number;
      snapshotCount: number;
    };
    delta: { labourCost: number };
    percentageDelta?: { labourCost: number };
    metadata?: {
      computedAt: string;
      labourPlanId: string;
      cashSnapshotIds: string[];
      labourPlanVersionId: string;
    };
  };

  const periodStart = variance.periodStartDate
    ? formatDate(variance.periodStartDate)
    : "-";
  const periodEnd = variance.periodEndDate
    ? formatDate(variance.periodEndDate)
    : "-";

  return (
    <div className="border border-gray-100 rounded p-3">
      <div className="text-xs text-gray-500 mb-3">
        Period: {periodStart} to {periodEnd}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="pb-2">Metric</th>
            <th className="pb-2 text-right">Planned</th>
            <th className="pb-2 text-right">Actual</th>
            <th className="pb-2 text-right">Delta</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Cost</td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.planned?.cost)}
            </td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.actual?.labourCost)}
            </td>
            <td className="py-2 text-right text-gray-600">
              {formatMoney(payload.delta?.labourCost)}
            </td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Hours</td>
            <td className="py-2 text-right text-gray-600">
              {formatNumber(payload.planned?.hours)}
            </td>
            <td className="py-2 text-right text-gray-600">-</td>
            <td className="py-2 text-right text-gray-600">-</td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Roles</td>
            <td className="py-2 text-right text-gray-600">
              {payload.planned?.roles?.length ?? "-"}
            </td>
            <td className="py-2 text-right text-gray-600">-</td>
            <td className="py-2 text-right text-gray-600">-</td>
          </tr>
          <tr className="border-b border-gray-50">
            <td className="py-2 text-gray-900">Headcount</td>
            <td className="py-2 text-right text-gray-600">
              {formatNumber(payload.planned?.headcount)}
            </td>
            <td className="py-2 text-right text-gray-600">-</td>
            <td className="py-2 text-right text-gray-600">-</td>
          </tr>
        </tbody>
      </table>

      <div className="text-xs text-gray-400 mt-3">
        Computed: {formatDateTime(variance.createdAt)}
      </div>
    </div>
  );
}
