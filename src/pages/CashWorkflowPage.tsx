/**
 * Cash Reality Workflow Page
 *
 * PURPOSE:
 * - Enter weekly cash snapshot manually
 * - View historical snapshots
 * - Submit a correction with mandatory reason
 * - Show immutable history
 *
 * CONSTRAINTS:
 * - Human-in-the-loop only
 * - No derived metrics
 * - No forecasting
 * - No recommendations
 * - No automation
 * - Neutral tone
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getCashSnapshots,
  getCashSnapshotHistory,
  createCashSnapshot,
  createCorrectionSnapshot,
} from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type { CashSnapshot, CashSnapshotPayload } from "../types";

interface CashWorkflowPageProps {
  tenantId: string;
}

// Placeholder user ID - in production this would come from auth
const CURRENT_USER_ID = "operator-user";

// Get current week start date (Monday)
function getCurrentWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export function CashWorkflowPage({ tenantId }: CashWorkflowPageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";
  const selectedWeek = searchParams.get("week") || getCurrentWeekStart();

  const [snapshots, setSnapshots] = useState<CashSnapshot[]>([]);
  const [weekHistory, setWeekHistory] = useState<CashSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating new snapshot
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CashSnapshotPayload>({
    revenue: 0,
    costs: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Correction form state
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<CashSnapshot | null>(
    null
  );
  const [correctionData, setCorrectionData] = useState<CashSnapshotPayload>({
    revenue: 0,
    costs: 0,
    notes: "",
  });
  const [correctionReason, setCorrectionReason] = useState("");

  // Load all snapshots when venue changes
  useEffect(() => {
    async function loadSnapshots() {
      if (!venueId) {
        setSnapshots([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getCashSnapshots(tenantId, venueId);
        setSnapshots(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load snapshots");
      } finally {
        setLoading(false);
      }
    }

    loadSnapshots();
  }, [tenantId, venueId]);

  // Load week history when week changes
  useEffect(() => {
    async function loadWeekHistory() {
      if (!venueId || !selectedWeek) {
        setWeekHistory([]);
        return;
      }

      try {
        const data = await getCashSnapshotHistory(tenantId, venueId, selectedWeek);
        setWeekHistory(data);
      } catch (err) {
        console.error("Failed to load week history:", err);
        setWeekHistory([]);
      }
    }

    loadWeekHistory();
  }, [tenantId, venueId, selectedWeek]);

  const handleCreateSnapshot = async () => {
    if (!venueId) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createCashSnapshot(
        tenantId,
        venueId,
        selectedWeek,
        formData,
        CURRENT_USER_ID
      );
      setSnapshots([result.snapshot, ...snapshots]);
      setWeekHistory([result.snapshot, ...weekHistory]);
      setShowCreateForm(false);
      setFormData({ revenue: 0, costs: 0, notes: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCorrection = (snapshot: CashSnapshot) => {
    setCorrectionTarget(snapshot);
    setCorrectionData({
      revenue: snapshot.payload.revenue || 0,
      costs: snapshot.payload.costs || 0,
      notes: snapshot.payload.notes || "",
    });
    setCorrectionReason("");
    setShowCorrectionForm(true);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionTarget || !correctionReason.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createCorrectionSnapshot(
        tenantId,
        correctionTarget.id,
        selectedWeek,
        correctionData,
        CURRENT_USER_ID,
        correctionReason
      );
      setSnapshots([result.snapshot, ...snapshots]);
      setWeekHistory([result.snapshot, ...weekHistory]);
      setShowCorrectionForm(false);
      setCorrectionTarget(null);
      setCorrectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create correction");
    } finally {
      setSubmitting(false);
    }
  };

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to manage cash reality.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Cash Reality</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter and view weekly cash snapshots for the selected venue
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
          disabled={showCreateForm || showCorrectionForm}
        >
          Enter Cash Snapshot
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
            Enter Cash Snapshot for Week of {formatDate(selectedWeek)}
          </h3>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateSnapshot}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Snapshot"}
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

      {/* Correction Form */}
      {showCorrectionForm && correctionTarget && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Submit Correction
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Correcting snapshot from{" "}
            {formatDateTime(correctionTarget.createdAt)}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Revenue (£)</label>
              <input
                type="number"
                value={correctionData.revenue || 0}
                onChange={(e) =>
                  setCorrectionData({
                    ...correctionData,
                    revenue: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costs (£)</label>
              <input
                type="number"
                value={correctionData.costs || 0}
                onChange={(e) =>
                  setCorrectionData({
                    ...correctionData,
                    costs: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                value={correctionData.notes || ""}
                onChange={(e) =>
                  setCorrectionData({ ...correctionData, notes: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Reason for Correction (required)
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
                placeholder="Explain why this correction is being made"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmitCorrection}
              disabled={submitting || !correctionReason.trim()}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Submit Correction"}
            </button>
            <button
              onClick={() => {
                setShowCorrectionForm(false);
                setCorrectionTarget(null);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Week History */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          History for Week of {formatDate(selectedWeek)}
        </h3>
        {weekHistory.length === 0 ? (
          <div className="text-sm text-gray-500">
            No snapshots recorded for this week.
          </div>
        ) : (
          <div className="space-y-3">
            {weekHistory.map((snapshot, index) => (
              <SnapshotCard
                key={snapshot.id}
                snapshot={snapshot}
                isLatest={index === 0}
                onCorrect={() => handleStartCorrection(snapshot)}
                disabled={showCreateForm || showCorrectionForm}
              />
            ))}
          </div>
        )}
      </div>

      {/* All Snapshots */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading snapshots...</div>
      ) : snapshots.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No cash snapshots found for the selected venue.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            All Snapshots (Immutable History)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-normal">
                    Week
                  </th>
                  <th className="text-right py-2 text-gray-500 font-normal">
                    Revenue
                  </th>
                  <th className="text-right py-2 text-gray-500 font-normal">
                    Costs
                  </th>
                  <th className="text-left py-2 text-gray-500 font-normal">
                    Type
                  </th>
                  <th className="text-left py-2 text-gray-500 font-normal">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">
                      {formatDate(snapshot.weekStartDate)}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {snapshot.payload.revenue != null ? formatCurrency(snapshot.payload.revenue) : "-"}
                    </td>
                    <td className="py-2 text-right text-gray-900">
                      {snapshot.payload.costs != null ? formatCurrency(snapshot.payload.costs) : "-"}
                    </td>
                    <td className="py-2">
                      {snapshot.isCorrection ? (
                        <span className="text-gray-500">Correction</span>
                      ) : (
                        <span className="text-gray-700">Original</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500">
                      {formatDateTime(snapshot.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface SnapshotCardProps {
  snapshot: CashSnapshot;
  isLatest: boolean;
  onCorrect: () => void;
  disabled: boolean;
}

function SnapshotCard({
  snapshot,
  isLatest,
  onCorrect,
  disabled,
}: SnapshotCardProps) {
  return (
    <div className="border border-gray-200 rounded p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900">
              {snapshot.isCorrection ? "Correction" : "Original Entry"}
            </span>
            {isLatest && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                Current
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDateTime(snapshot.createdAt)}
          </div>
        </div>
        {isLatest && !snapshot.isCorrection && (
          <button
            onClick={onCorrect}
            disabled={disabled}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Submit Correction
          </button>
        )}
      </div>

      {/* Snapshot Details */}
      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="text-sm text-gray-900">
            {snapshot.payload.revenue != null ? formatCurrency(snapshot.payload.revenue) : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Costs</div>
          <div className="text-sm text-gray-900">
            {snapshot.payload.costs != null ? formatCurrency(snapshot.payload.costs) : "-"}
          </div>
        </div>
        {snapshot.payload.notes && (
          <div className="col-span-2">
            <div className="text-xs text-gray-500">Notes</div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {snapshot.payload.notes}
            </p>
          </div>
        )}
      </div>

      {/* Correction Info */}
      {snapshot.isCorrection && snapshot.correctsSnapshotId && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">Correction Reason</div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {snapshot.correctionReason}
          </p>
        </div>
      )}
    </div>
  );
}
