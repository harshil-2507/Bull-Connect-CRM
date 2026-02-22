import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/useAuth";
import type { Campaign, PaginatedResponse } from "../types";

export function CampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const loadCampaigns = async () => {
    try {
      const result = await api.get<PaginatedResponse<Campaign>>("/campaigns?page=1&limit=50", token);
      setCampaigns(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load campaigns");
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const result = await api.get<PaginatedResponse<Campaign>>("/campaigns?page=1&limit=50", token);
        setCampaigns(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load campaigns");
      }
    };

    void run();
  }, [token]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post<Campaign>("/campaigns", {
        name: newCampaign.name,
        description: newCampaign.description || undefined,
        start_date: newCampaign.start_date || undefined,
        end_date: newCampaign.end_date || undefined,
      }, token);

      setNewCampaign({ name: "", description: "", start_date: "", end_date: "" });
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create campaign");
    }
  };

  const onToggle = async (campaign: Campaign) => {
    try {
      await api.patch<Campaign>(`/campaigns/${campaign.id}/toggle`, { is_active: !campaign.is_active }, token);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to toggle campaign");
    }
  };

  return (
    <div className="stack">
      <form className="card form" onSubmit={onCreate}>
        <h3>Create Campaign</h3>
        <div className="grid-2">
          <label>
            Campaign Name
            <input
              value={newCampaign.name}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Description
            <input
              value={newCampaign.description}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={newCampaign.start_date}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, start_date: e.target.value }))}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={newCampaign.end_date}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, end_date: e.target.value }))}
            />
          </label>
        </div>
        <button type="submit">Create Campaign</button>
      </form>

      <div className="card">
        <h3>Campaigns</h3>
        {error && <div className="error">{error}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Leads</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td>{campaign.name}</td>
                  <td>{campaign.description || "-"}</td>
                  <td>{campaign.total_leads ?? 0}</td>
                  <td>{campaign.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <button type="button" onClick={() => onToggle(campaign)}>
                      {campaign.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5}>No campaigns found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
