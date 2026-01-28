import type { Budget, BudgetStatus } from "../types";

interface SimpleBudgetCardProps {
  budget: Budget;
}

export function SimpleBudgetCard({ budget }: SimpleBudgetCardProps) {
  const statusStyles: Record<BudgetStatus, string> = {
    draft: "bg-gray-100 text-gray-700",
    confirmed: "bg-gray-200 text-gray-800",
    superseded: "bg-gray-50 text-gray-500",
  };

  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {budget.id}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${statusStyles[budget.status]}`}
            >
              {budget.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
