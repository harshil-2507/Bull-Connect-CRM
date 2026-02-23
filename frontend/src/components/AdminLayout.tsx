import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import notificationsIcon from "../assets/notificationsIconCutout.png";

const menuItems = [
  { to: "/", label: "Dashboard" },
  { to: "/leads", label: "Leads" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/users", label: "Users" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Bull Connect CRM</div>

          <div className="menu-section-title">Main Menu</div>
          <nav className="menu-group">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="menu-section-title">System</div>
          <div className="menu-group">
            <button type="button" className="nav-link ghost-button" onClick={() => navigate("/users")}>Settings</button>
            <button type="button" className="nav-link ghost-button">Help Center</button>
          </div>
        </div>

        <div className="user-profile">
          <div className="avatar">{user?.name?.charAt(0) || "A"}</div>
          <div>
            <div className="user-name">{user?.name || "Admin"}</div>
            <div className="user-role">ADMIN</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="top-search">
            <input placeholder="Search leads, campaigns, or users..." />
          </div>
          <div className="top-actions">
            <button type="button" className="icon-btn" aria-label="Notifications">
              <img src={notificationsIcon} alt="Notifications" />
            </button>
            <button type="button" className="quick-action" onClick={() => navigate("/campaigns")}>+ Quick Action</button>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
