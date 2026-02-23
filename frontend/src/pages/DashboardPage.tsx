import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/useAuth";
import type { Campaign, Lead, User } from "../types";

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersResult, campaignsResult, statsResult, leadsResult] = await Promise.all([
          api.get<User[]>("/admin/users", token),
          api.get<{ data: Campaign[] }>("/campaigns?page=1&limit=5", token),
          api.get<CampaignStat[]>("/campaigns/stats", token),
          api.get<Lead[]>("/leads", token),
        ]);

        setUsers(usersResult);
        setCampaigns(campaignsResult.data);
        setCampaignStats(statsResult);
        setLeads(leadsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    };

    load();
  }, [token]);

  const activeUsers = users.filter((user) => user.is_active).length;
  const retentionRate = users.length ? ((activeUsers / users.length) * 100).toFixed(1) : "0.0";

  const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));
  const topLeads = leads.slice(0, 4);

  const totalLeadCount = campaignStats.reduce((sum, item) => sum + Number(item.total_leads || 0), 0);
  const chartValues = campaignStats.slice(0, 6).map((item) => Number(item.total_leads || 0));
  const chartMax = Math.max(...chartValues, 1);

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Sales Overview</h2>
          <p>Welcome back. Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="range-tabs">
          <button type="button" className="active">Today</button>
          <button type="button">Week</button>
          <button type="button">Month</button>
        </div>
      </div>

      <div className="stats-grid dashboard-stats">
        <article className="card kpi-card">
          <div className="kpi-label">Total Leads</div>
          <div className="kpi-badge">+12.5%</div>
          <p className="stat-number">{totalLeadCount.toLocaleString()}</p>
          <div className="kpi-bar"><span style={{ width: "68%" }} /></div>
        </article>
        <article className="card kpi-card">
          <div className="kpi-label">Active Opportunities</div>
          <div className="kpi-badge">+5.2%</div>
          <p className="stat-number">{activeUsers}</p>
          <div className="kpi-bar"><span style={{ width: "42%" }} /></div>
        </article>
        <article className="card kpi-card">
          <div className="kpi-label">Retention Rate</div>
          <div className="kpi-badge">+0.4%</div>
          <p className="stat-number">{retentionRate}%</p>
          <div className="kpi-bar"><span style={{ width: `${Math.min(Number(retentionRate), 100)}%` }} /></div>
        </article>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card lead-card">
        <div className="section-head">
          <h3>Lead Management</h3>
          <button type="button" className="link-btn">View All Leads</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Status</th>
                <th>Campaign</th>
                <th>Source</th>
                <th>Last Contacted</th>
              </tr>
            </thead>
            <tbody>
              {topLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="lead-name-cell">{lead.farmer_name}</td>
                  <td>
                    <span className={`status-dot ${lead.status === "NEW" ? "pending" : "active"}`} />
                    {lead.status === "NEW" ? "Pending" : "Active"}
                  </td>
                  <td>{lead.campaign_name || "-"}</td>
                  <td>{lead.state || "Direct"}</td>
                  <td>{formatTimestamp(lead.created_at)}</td>
                </tr>
              ))}
              {topLeads.length === 0 && (
                <tr>
                  <td colSpan={5}>No lead data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="card">
          <div className="section-head">
            <h3>Revenue Forecast</h3>
            <select>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="bar-chart">
            {chartValues.map((value, index) => (
              <div key={`${value}-${index}`} className="bar-item">
                <div className="bar-fill" style={{ height: `${(value / chartMax) * 100}%` }} />
              </div>
            ))}
            {chartValues.length === 0 && (
              <div className="empty-chart">No data</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {topLeads.slice(0, 3).map((lead) => (
              <div key={`activity-${lead.id}`} className="activity-item">
                <div className="activity-dot" />
                <div>
                  <p className="activity-title">Lead updated: {lead.farmer_name}</p>
                  <p className="activity-sub">{lead.status} • {formatTimestamp(lead.created_at)}</p>
                </div>
              </div>
            ))}
            {topLeads.length === 0 && <p className="activity-sub">No recent activity</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
