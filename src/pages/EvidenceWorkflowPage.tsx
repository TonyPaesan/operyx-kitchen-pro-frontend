/**
 * Evidence Ingestion Workflow Page
 *
 * PURPOSE:
 * - Upload screenshot or CSV
 * - View extracted candidate facts
 * - Confirm or reject candidates
 * - Clearly label all extracted data as "unconfirmed" until approved
 * - Show linkage between evidence and resulting canonical records
 *
 * CONSTRAINTS:
 * - Human-in-the-loop only
 * - No auto-confirmation
 * - No recommendations
 * - No automation
 * - Neutral tone
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getEvidenceByVenue,
  uploadEvidence,
  extractFromEvidence,
  getCandidatesByEvidence,
  getPendingCandidates,
  confirmCandidate,
  rejectCandidate,
} from "../api/client";
import { formatDate, formatDateTime, formatCurrency } from "../utils/format";
import type {
  Evidence,
  EvidenceCandidate,
  EvidenceSource,
  CandidateStatus,
} from "../types";

interface EvidenceWorkflowPageProps {
  tenantId: string;
}

// Placeholder user ID - in production this would come from auth
const CURRENT_USER_ID = "operator-user";

export function EvidenceWorkflowPage({ tenantId }: EvidenceWorkflowPageProps) {
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get("venueId") || "";

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [candidates, setCandidates] = useState<EvidenceCandidate[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<EvidenceCandidate[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<EvidenceSource | "all">("all");

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadSource, setUploadSource] = useState<EvidenceSource>("other");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rejection form state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<EvidenceCandidate | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Load evidence when venue changes
  useEffect(() => {
    async function loadEvidence() {
      if (!venueId) {
        setEvidenceList([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const source = sourceFilter === "all" ? undefined : sourceFilter;
        const data = await getEvidenceByVenue(tenantId, venueId, source);
        setEvidenceList(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load evidence");
      } finally {
        setLoading(false);
      }
    }

    loadEvidence();
  }, [tenantId, venueId, sourceFilter]);

  // Load pending candidates
  useEffect(() => {
    async function loadPendingCandidates() {
      try {
        const data = await getPendingCandidates(tenantId);
        setPendingCandidates(data);
      } catch (err) {
        console.error("Failed to load pending candidates:", err);
      }
    }

    loadPendingCandidates();
  }, [tenantId]);

  // Load candidates when evidence is selected
  useEffect(() => {
    async function loadCandidates() {
      if (!selectedEvidence) {
        setCandidates([]);
        return;
      }

      try {
        const data = await getCandidatesByEvidence(tenantId, selectedEvidence.id);
        setCandidates(data);
      } catch (err) {
        console.error("Failed to load candidates:", err);
      }
    }

    loadCandidates();
  }, [tenantId, selectedEvidence]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!venueId || !selectedFile) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await uploadEvidence(
        tenantId,
        venueId,
        selectedFile,
        uploadSource,
        CURRENT_USER_ID
      );
      setEvidenceList([result.evidence, ...evidenceList]);
      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadSource("other");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload evidence");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExtract = async (evidence: Evidence) => {
    console.log("[EXTRACT] Button clicked for evidence:", evidence.id, evidence.fileName);
    setSubmitting(true);
    setError(null);

    try {
      console.log("[EXTRACT] Calling API - tenantId:", tenantId, "evidenceId:", evidence.id);
      const result = await extractFromEvidence(tenantId, evidence.id);
      console.log("[EXTRACT] API response:", result);
      setCandidates(result.candidates);
      // Refresh pending candidates
      const pending = await getPendingCandidates(tenantId);
      console.log("[EXTRACT] Pending candidates refreshed:", pending.length);
      setPendingCandidates(pending);
    } catch (err) {
      console.error("[EXTRACT] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to extract from evidence");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (candidate: EvidenceCandidate) => {
    setSubmitting(true);
    setError(null);

    try {
      await confirmCandidate(tenantId, candidate.id, CURRENT_USER_ID);
      // Refresh candidates
      if (selectedEvidence) {
        const data = await getCandidatesByEvidence(tenantId, selectedEvidence.id);
        setCandidates(data);
      }
      // Refresh pending candidates
      const pending = await getPendingCandidates(tenantId);
      setPendingCandidates(pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm candidate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartReject = (candidate: EvidenceCandidate) => {
    setRejectTarget(candidate);
    setRejectReason("");
    setShowRejectForm(true);
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await rejectCandidate(
        tenantId,
        rejectTarget.id,
        CURRENT_USER_ID,
        rejectReason
      );
      // Refresh candidates
      if (selectedEvidence) {
        const data = await getCandidatesByEvidence(tenantId, selectedEvidence.id);
        setCandidates(data);
      }
      // Refresh pending candidates
      const pending = await getPendingCandidates(tenantId);
      setPendingCandidates(pending);
      setShowRejectForm(false);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject candidate");
    } finally {
      setSubmitting(false);
    }
  };

  // Determine the next required action
  const getNextAction = () => {
    if (evidenceList.length === 0) {
      return { action: "upload", text: "Upload evidence to begin." };
    }
    if (pendingCandidates.length > 0) {
      return { action: "review", text: `${pendingCandidates.length} candidate(s) require review.` };
    }
    // Check if any evidence has not been extracted
    // For now, we assume extraction is needed if no candidates exist for any evidence
    // A more robust check would require tracking extraction status per evidence
    return { action: "extract", text: "Select evidence and extract candidates." };
  };

  const nextAction = getNextAction();

  if (!venueId) {
    return (
      <div className="text-gray-500 text-sm">
        Select a venue to manage evidence.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Evidence Ingestion</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload, extract, and confirm evidence for the selected venue
          </p>
        </div>
        {/* De-emphasize "Upload Evidence" when evidence exists */}
        {evidenceList.length === 0 ? (
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
            disabled={showUploadForm}
          >
            Upload Evidence
          </button>
        ) : (
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            disabled={showUploadForm}
          >
            Add More Evidence
          </button>
        )}
      </div>

      {/* Next Action Indicator */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-1">Next Step</h3>
        <p className="text-sm text-gray-600">{nextAction.text}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {/* Pending Candidates Summary */}
      {pendingCandidates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Pending Review
          </h3>
          <p className="text-sm text-yellow-700">
            {pendingCandidates.length} candidate(s) awaiting confirmation or
            rejection.
          </p>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Upload Evidence
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Source</label>
              <select
                value={uploadSource}
                onChange={(e) => setUploadSource(e.target.value as EvidenceSource)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="rota">Rota</option>
                <option value="pos">POS</option>
                <option value="payroll">Payroll</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.csv"
                onChange={handleFileSelect}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Accepted: Images (PNG, JPG) or CSV files
              </p>
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUpload}
              disabled={submitting || !selectedFile}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={() => {
                setShowUploadForm(false);
                setSelectedFile(null);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rejection Form */}
      {showRejectForm && rejectTarget && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Reject Candidate
          </h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Reason for Rejection (required)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Explain why this candidate is being rejected"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleReject}
              disabled={submitting || !rejectReason.trim()}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Rejecting..." : "Reject"}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false);
                setRejectTarget(null);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Source Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Filter by source:</label>
        <select
          value={sourceFilter}
          onChange={(e) =>
            setSourceFilter(e.target.value as EvidenceSource | "all")
          }
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="all">All</option>
          <option value="rota">Rota</option>
          <option value="pos">POS</option>
          <option value="payroll">Payroll</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Evidence List */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading evidence...</div>
      ) : evidenceList.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No evidence found for the selected venue.
        </div>
      ) : (
        <div className="space-y-3">
          {evidenceList.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
              isSelected={selectedEvidence?.id === evidence.id}
              onSelect={() => setSelectedEvidence(evidence)}
              onExtract={() => handleExtract(evidence)}
              submitting={submitting}
              isPrimaryAction={nextAction.action === "extract"}
            />
          ))}
        </div>
      )}

      {/* Candidates for Selected Evidence */}
      {selectedEvidence && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Extracted Candidates from {selectedEvidence.fileName}
          </h3>
          {candidates.length === 0 ? (
            <div className="text-sm text-gray-500">
              No candidates extracted. Click "Extract" to process this evidence.
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onConfirm={() => handleConfirm(candidate)}
                  onReject={() => handleStartReject(candidate)}
                  submitting={submitting}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EvidenceCardProps {
  evidence: Evidence;
  isSelected: boolean;
  onSelect: () => void;
  onExtract: () => void;
  submitting: boolean;
  isPrimaryAction: boolean;
}

function EvidenceCard({
  evidence,
  isSelected,
  onSelect,
  onExtract,
  submitting,
  isPrimaryAction,
}: EvidenceCardProps) {
  const sourceLabels: Record<EvidenceSource, string> = {
    rota: "Rota",
    pos: "POS",
    payroll: "Payroll",
    other: "Other",
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
              {evidence.fileName}
            </span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {sourceLabels[evidence.source]}
            </span>
            <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-500 rounded">
              {evidence.type}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Uploaded: {formatDateTime(evidence.createdAt)}
          </div>
        </div>
        {/* Highlight "Extract" as primary action when applicable */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log("[EXTRACT BUTTON] Clicked! submitting:", submitting);
            if (!submitting) {
              onExtract();
            }
          }}
          disabled={submitting}
          className={`px-3 py-1 text-xs rounded disabled:opacity-50 ${
            isPrimaryAction
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Extract
        </button>
      </div>
    </div>
  );
}

interface CandidateCardProps {
  candidate: EvidenceCandidate;
  onConfirm: () => void;
  onReject: () => void;
  submitting: boolean;
}

function CandidateCard({
  candidate,
  onConfirm,
  onReject,
  submitting,
}: CandidateCardProps) {
  const statusStyles: Record<CandidateStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  // Format payload values with UK locale
  const formatPayloadValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) {
      return "-";
    }
    // Format currency values
    if (typeof value === "number" && (key.toLowerCase().includes("cost") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("price") || key.toLowerCase().includes("total"))) {
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
  };

  // Render payload with UK formatting
  const renderPayload = (payload: Record<string, unknown>) => {
    return Object.entries(payload).map(([key, value]) => (
      <div key={key} className="flex justify-between text-xs">
        <span className="text-gray-500">{key}:</span>
        <span className="text-gray-700">{formatPayloadValue(key, value)}</span>
      </div>
    ));
  };

  return (
    <div className="border border-gray-200 rounded p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              Candidate: {candidate.id.slice(0, 8)}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${statusStyles[candidate.status]}`}
            >
              {candidate.status}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Source Evidence: {candidate.evidenceId.slice(0, 8)}
          </div>
        </div>
        {candidate.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="px-3 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={onReject}
              disabled={submitting}
              className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
      <div className="bg-gray-50 p-2 mt-2 rounded space-y-1">
        {renderPayload(candidate.payload as Record<string, unknown>)}
      </div>
      {candidate.status === "rejected" && candidate.rejectionReason && (
        <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">
          <strong>Rejection Reason:</strong> {candidate.rejectionReason}
        </div>
      )}
    </div>
  );
}
