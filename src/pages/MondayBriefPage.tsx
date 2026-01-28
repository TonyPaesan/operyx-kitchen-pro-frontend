/**
 * Monday Brief Page
 *
 * PURPOSE:
 * - Render stored brief payload verbatim
 * - No reinterpretation or regeneration
 *
 * CONSTRAINTS:
 * - READ-ONLY
 * - Neutral tone
 * - Factual language
 * - No alerts
 * - No call-to-action buttons
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getMondayBrief } from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type { MondayBrief } from "../types";

interface MondayBriefPageProps {
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

// Helper to format percentage
function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(1)}%`;
}

// Helper to format currency values
function formatMoney(num: number | null | undefined): string {
  if (num === null || num === undefined) return "-";
  return formatCurrency(num);
}

export function MondayBriefPage({ tenantId }: MondayBriefPageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";
  const weekStartDate = searchParams.get("week") || "";

  const [brief, setBrief] = useState<MondayBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrief() {
      if (!venueId || !weekStartDate) {
        setBrief(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getMondayBrief(tenantId, venueId, weekStartDate);
        setBrief(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load brief");
      } finally {
        setLoading(false);
      }
    }

    loadBrief();
  }, [tenantId, venueId, weekStartDate]);

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to view the Monday Operating Brief.
      </div>
    );
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading brief...</div>;
  }

  if (error) {
    return <div className="text-gray-500 text-sm">Unable to load brief data.</div>;
  }

  if (!brief) {
    return (
      <div className="text-gray-500 text-sm">
        No Monday Brief available for the selected venue and week.
      </div>
    );
  }

  // The payload structure from the backend
  const { payload } = brief;
  const metadata = payload.metadata as {
    generatedAt: string;
    weekStartDate: string;
    weekEndDate: string;
    dataSourceIds: {
      cashSnapshotIds: string[];
      budgetVersionId: string | null;
      labourPlanVersionId: string | null;
      varianceIds: string[];
    };
  };
  const revenueSummary = payload.revenueSummary as {
    planned: number | null;
    actual: number;
    delta: number | null;
    deltaPercent: number | null;
    snapshotCount: number;
  };
  const costSummary = payload.costSummary as {
    planned: number | null;
    actual: number;
    delta: number | null;
    deltaPercent: number | null;
  };
  const labourSummary = payload.labourSummary as {
    plannedCost: number | null;
    plannedHours: number | null;
    actualCost: number;
    delta: number | null;
    deltaPercent: number | null;
  };
  const highlights = payload.highlights as string[];
  const deltas = payload.deltas as Array<{
    metric: string;
    planned: number | null;
    actual: number;
    delta: number | null;
    deltaPercent: number | null;
  }>;
  const summary = payload.summary as string;

  // Format dates using UK format
  const weekStart = metadata?.weekStartDate
    ? formatDate(metadata.weekStartDate)
    : brief.weekStartDate
    ? formatDate(brief.weekStartDate)
    : "-";
  const weekEnd = metadata?.weekEndDate
    ? formatDate(metadata.weekEndDate)
    : "-";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Monday Operating Brief
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Week of {weekStart} to {weekEnd}
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
          <p className="text-sm text-gray-600">{summary}</p>
        </section>
      )}

      {/* Revenue */}
      {revenueSummary && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Revenue</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Planned</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(revenueSummary.planned)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Actual</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(revenueSummary.actual)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Delta</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(revenueSummary.delta)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Delta %</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatPercent(revenueSummary.deltaPercent)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">
            Based on {revenueSummary.snapshotCount} cash snapshot(s)
          </p>
        </section>
      )}

      {/* Costs */}
      {costSummary && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Costs</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Planned</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(costSummary.planned)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Actual</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(costSummary.actual)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Delta</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(costSummary.delta)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Delta %</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatPercent(costSummary.deltaPercent)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Labour */}
      {labourSummary && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Labour</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Planned Cost</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(labourSummary.plannedCost)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Planned Hours</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatNumber(labourSummary.plannedHours)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Actual Cost</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(labourSummary.actualCost)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Delta</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatMoney(labourSummary.delta)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Delta %</td>
                <td className="py-2 text-gray-900 text-right">
                  {formatPercent(labourSummary.deltaPercent)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Highlights</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            {highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Deltas Table */}
      {deltas && deltas.length > 0 && (
        <section className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Key Deltas vs Plan
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-2">Metric</th>
                <th className="pb-2 text-right">Planned</th>
                <th className="pb-2 text-right">Actual</th>
                <th className="pb-2 text-right">Delta</th>
                <th className="pb-2 text-right">Delta %</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((delta, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 text-gray-900">{delta.metric}</td>
                  <td className="py-2 text-gray-600 text-right">
                    {formatMoney(delta.planned)}
                  </td>
                  <td className="py-2 text-gray-600 text-right">
                    {formatMoney(delta.actual)}
                  </td>
                  <td className="py-2 text-gray-600 text-right">
                    {formatMoney(delta.delta)}
                  </td>
                  <td className="py-2 text-gray-600 text-right">
                    {formatPercent(delta.deltaPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400">
        Generated: {formatDateTime(brief.createdAt)}
      </div>
    </div>
  );
}
