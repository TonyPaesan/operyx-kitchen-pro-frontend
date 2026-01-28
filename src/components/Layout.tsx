/**
 * Layout Component
 *
 * PURPOSE:
 * - Provide consistent layout structure
 * - Venue and week selection
 * - Navigation for both read-only views and workflow UIs
 *
 * CONSTRAINTS:
 * - Phase 11A: READ-ONLY navigation for views
 * - Phase 12: Human-in-the-loop workflow navigation
 * - Neutral tone
 * - No alerts or call-to-action buttons
 */

import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getVenues } from "../api/client";
import type { Venue } from "../types";

interface LayoutProps {
  children: ReactNode;
  tenantId: string;
}

// Generate week options for the past 12 weeks plus historical data weeks
function getWeekOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const today = new Date();

  // Recent weeks (past 12 weeks)
  for (let i = 0; i < 12; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - date.getDay() - i * 7); // Go to Monday
    const weekStart = date.toISOString().split("T")[0];
    const weekEnd = new Date(date);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    options.push({
      value: weekStart,
      label: `${weekStart} to ${weekEndStr}`,
    });
  }

  // Add historical week with data (January 2024)
  // This week has Monday Brief, Variance, and Guardian data
  options.push({
    value: "2024-01-01",
    label: "2024-01-01 to 2024-01-07 (historical)",
  });

  // Add week with Guardian findings (January 2025)
  options.push({
    value: "2025-01-20",
    label: "2025-01-20 to 2025-01-26 (historical)",
  });

  return options;
}

export function Layout({ children, tenantId }: LayoutProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedVenueId = searchParams.get("venueId") || "";
  const selectedWeek = searchParams.get("week") || getWeekOptions()[0]?.value || "";

  useEffect(() => {
    async function loadVenues() {
      try {
        const data = await getVenues(tenantId);
        setVenues(data.filter((v) => v.status === "active"));
      } catch (error) {
        console.error("Failed to load venues:", error);
      } finally {
        setLoading(false);
      }
    }
    loadVenues();
  }, [tenantId]);

  const handleVenueChange = (venueId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("venueId", venueId);
    setSearchParams(params);
  };

  const handleWeekChange = (week: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("week", week);
    setSearchParams(params);
  };

  const weekOptions = getWeekOptions();

  // Read-only view navigation items
  const viewNavItems = [
    { path: "/brief", label: "Monday Brief" },
    { path: "/variance", label: "Variance" },
    { path: "/findings", label: "Guardian Findings" },
  ];

  // Workflow navigation items
  const workflowNavItems = [
    { path: "/workflow/budget", label: "Budget" },
    { path: "/workflow/labour", label: "Labour" },
    { path: "/workflow/cash", label: "Cash" },
    { path: "/workflow/evidence", label: "Evidence" },
  ];

  const isWorkflowPath = location.pathname.startsWith("/workflow");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-medium text-gray-900">
            Operyx Kitchen Pro
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isWorkflowPath ? "Workflow Control Panel" : "Read-only data view"}
          </p>
        </div>
      </header>

      {/* Selectors */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-4 items-center">
            {/* Venue Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="venue" className="text-sm text-gray-600">
                Venue:
              </label>
              <select
                id="venue"
                value={selectedVenueId}
                onChange={(e) => handleVenueChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
                disabled={loading}
              >
                <option value="">Select venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="week" className="text-sm text-gray-600">
                Week:
              </label>
              <select
                id="week"
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
              >
                {weekOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Views Section */}
            <div className="flex gap-6">
              <span className="py-3 text-xs text-gray-400 uppercase tracking-wide">
                Views
              </span>
              {viewNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={`${item.path}?${searchParams.toString()}`}
                    className={`py-3 text-sm border-b-2 ${
                      isActive
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Separator */}
            <div className="border-l border-gray-200"></div>

            {/* Workflows Section */}
            <div className="flex gap-6">
              <span className="py-3 text-xs text-gray-400 uppercase tracking-wide">
                Workflows
              </span>
              {workflowNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={`${item.path}?${searchParams.toString()}`}
                    className={`py-3 text-sm border-b-2 ${
                      isActive
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
