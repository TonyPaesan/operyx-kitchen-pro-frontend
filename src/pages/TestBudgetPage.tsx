import { useState, useEffect } from "react";
import { getBudgets } from "../api/client";
import type { Budget } from "../types";

export function TestBudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBudgets() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBudgets("9801f53f-55be-4a2c-91e4-38870641876f", "3ff1d81b-6927-4133-80f7-20d277be9fe4");
        setBudgets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load budgets");
      } finally {
        setLoading(false);
      }
    }
    loadBudgets();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Test Budget Page</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <pre>{JSON.stringify(budgets, null, 2)}</pre>
    </div>
  );
}
