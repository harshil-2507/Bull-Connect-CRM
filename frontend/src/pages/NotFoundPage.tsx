import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="card">
      <h2>Page not found</h2>
      <p>The requested page does not exist.</p>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}
