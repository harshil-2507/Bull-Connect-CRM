import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/useAuth";
import type { Campaign, User } from "../types";

interface CampaignStat {
  id: number;
  name: string;
  total_leads: string;
}

export function DashboardPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignStats, setCampaignStats] = useState<CampaignStat[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersResult, campaignsResult, statsResult] = await Promise.all([
          api.get<User[]>("/admin/users", token),
          api.get<{ data: Campaign[] }>("/campaigns?page=1&limit=5", token),
          api.get<CampaignStat[]>("/campaigns/stats", token),
        ]);

        setUsers(usersResult);
        setCampaigns(campaignsResult.data);
        setCampaignStats(statsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    };

    load();
  }, [token]);

  return (
    <div className="stack">
      <div className="stats-grid">
        <article className="card">
          <h3>Total Users</h3>
          <p className="stat-number">{users.length}</p>
        </article>
        <article className="card">
          <h3>Total Campaigns</h3>
          <p className="stat-number">{campaignStats.length}</p>
        </article>
        <article className="card">
          <h3>Recent Campaigns</h3>
          <p className="stat-number">{campaigns.length}</p>
        </article>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Campaign Lead Counts</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Total Leads</th>
              </tr>
            </thead>
            <tbody>
              {campaignStats.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.total_leads}</td>
                </tr>
              ))}
              {campaignStats.length === 0 && (
                <tr>
                  <td colSpan={2}>No campaign data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
