import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/useAuth";
import type { Role, User } from "../types";

const roleOptions: Exclude<Role, "ADMIN">[] = ["MANAGER", "TELECALLER", "FIELD_MANAGER", "FIELD_EXEC"];

export function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<Exclude<Role, "ADMIN"> | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    role: "MANAGER" as Exclude<Role, "ADMIN">,
    username: "",
    password: "",
    name: "",
    mobile_number: "",
  });

  const loadUsers = async () => {
    try {
      const endpoint = selectedRole === "ALL" ? "/admin/users" : `/admin/users/${selectedRole}`;
      const result = await api.get<User[]>(endpoint, token);
      setUsers(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users");
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const endpoint = selectedRole === "ALL" ? "/admin/users" : `/admin/users/${selectedRole}`;
        const result = await api.get<User[]>(endpoint, token);
        setUsers(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load users");
      }
    };

    void run();
  }, [selectedRole, token]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post<{ message: string }>("/admin/users", newUser, token);
      setNewUser({ role: "MANAGER", username: "", password: "", name: "", mobile_number: "" });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    }
  };

  const activeCount = useMemo(() => users.filter((user) => user.is_active).length, [users]);

  return (
    <div className="stack">
      <div className="stats-grid">
        <article className="card">
          <h3>Total</h3>
          <p className="stat-number">{users.length}</p>
        </article>
        <article className="card">
          <h3>Active</h3>
          <p className="stat-number">{activeCount}</p>
        </article>
      </div>

      <form className="card form" onSubmit={onCreate}>
        <h3>Create User</h3>
        <div className="grid-2">
          <label>
            Role
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as Exclude<Role, "ADMIN"> }))}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Username
            <input
              value={newUser.username}
              onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </label>
          <label>
            Name
            <input
              value={newUser.name}
              onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Mobile Number
            <input
              value={newUser.mobile_number}
              onChange={(e) => setNewUser((prev) => ({ ...prev, mobile_number: e.target.value }))}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </label>
        </div>
        <button type="submit">Create</button>
      </form>

      <div className="card">
        <div className="toolbar">
          <h3>Users</h3>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as Exclude<Role, "ADMIN"> | "ALL") }>
            <option value="ALL">All</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Mobile</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.mobile_number}</td>
                  <td>{user.is_active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
