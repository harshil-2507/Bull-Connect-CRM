import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/useAuth";
import type { Lead } from "../types";

export function LeadsPage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const result = await api.get<Lead[]>("/leads", token);
        setLeads(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load leads");
      }
    };

    void loadLeads();
  }, [token]);

  return (
    <div className="card">
      <h3>All Leads</h3>
      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>District</th>
              <th>Taluka</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.farmer_name}</td>
                <td>{lead.phone_number}</td>
                <td>{lead.status}</td>
                <td>{lead.district || "-"}</td>
                <td>{lead.taluka || "-"}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5}>No leads found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
