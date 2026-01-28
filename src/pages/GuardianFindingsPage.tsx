/**
 * Guardian Findings Page
 *
 * PURPOSE:
 * - List findings for venue + week
 * - Show type, severity, description
 * - Link to evidence IDs (read-only)
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
import { getGuardianFindings } from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type { GuardianFinding } from "../types";

interface GuardianFindingsPageProps {
  tenantId: string;
}

export function GuardianFindingsPage({ tenantId }: GuardianFindingsPageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";
  const weekStartDate = searchParams.get("week") || "";

  const [findings, setFindings] = useState<GuardianFinding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFindings() {
      if (!venueId) {
        setFindings([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getGuardianFindings(
          tenantId,
          venueId,
          weekStartDate || undefined
        );
        setFindings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load findings");
      } finally {
        setLoading(false);
      }
    }

    loadFindings();
  }, [tenantId, venueId, weekStartDate]);

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to view Guardian findings.
      </div>
    );
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading findings...</div>;
  }

  if (error) {
    return <div className="text-gray-500 text-sm">Unable to load findings data.</div>;
  }

  if (findings.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No Guardian findings for the selected venue and week.
      </div>
    );
  }

  // Group findings by severity for display
  const groupedFindings = {
    high: findings.filter((f) => f.severity === "high"),
    medium: findings.filter((f) => f.severity === "medium"),
    low: findings.filter((f) => f.severity === "low"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900">Guardian Findings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Observations for the selected venue and week
        </p>
      </div>

      {/* Summary */}
      <section className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">High</dt>
            <dd className="text-gray-900">{groupedFindings.high.length}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Medium</dt>
            <dd className="text-gray-900">{groupedFindings.medium.length}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Low</dt>
            <dd className="text-gray-900">{groupedFindings.low.length}</dd>
          </div>
        </dl>
      </section>

      {/* Findings List */}
      <section className="space-y-3">
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </section>
    </div>
  );
}

function FindingCard({ finding }: { finding: GuardianFinding }) {
  const { payload } = finding;

  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-sm font-medium text-gray-900">
            {formatFindingType(finding.type)}
          </span>
          <span className="ml-2 text-xs text-gray-500">
            Severity: {finding.severity}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(finding.weekStartDate)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3">{payload.description}</p>

      {/* Details */}
      {payload.details && Object.keys(payload.details).length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Details</h4>
          <dl className="text-xs text-gray-600 space-y-1">
            {Object.entries(payload.details).map(([key, value]) => (
              <div key={key} className="flex">
                <dt className="text-gray-500 w-32">{formatDetailKey(key)}:</dt>
                <dd className="text-gray-700">{formatDetailValue(key, value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Evidence IDs (read-only reference) */}
      {payload.evidenceIds && payload.evidenceIds.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h4 className="text-xs font-medium text-gray-500 mb-2">
            Related Evidence
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {payload.evidenceIds.map((id) => (
              <li key={id} className="font-mono">
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 mt-3">
        Computed: {formatDateTime(finding.createdAt)}
      </div>
    </div>
  );
}

function formatFindingType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetailKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  // Format currency values
  if (typeof value === "number" && (key.toLowerCase().includes("cost") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("price"))) {
    return formatCurrency(value);
  }
  // Format date values
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
