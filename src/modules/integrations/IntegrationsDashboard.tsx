import { useState } from "react";
import { api } from "../../lib/ipc";

const DEMO_PROJECT_ID = "demo-project";

type Service = "search_console" | "analytics" | "business_profile";

export default function IntegrationsDashboard() {
  const [service, setService] = useState<Service>("search_console");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<unknown>(null);

  async function run(action: () => Promise<unknown>) {
    setLoading(true);
    setOutput(null);
    try {
      setOutput(await action());
    } catch (err) {
      setOutput({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p style={{ color: "#666" }}>
        Connect Google Search Console, Google Analytics (GA4), and Google Business Profile. Each requires
        your own OAuth Client ID/Secret from Google Cloud Console (Desktop app type) - NinjaX never ships a
        shared one. Tokens are encrypted on disk via your OS keychain.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <select value={service} onChange={(e) => setService(e.target.value as Service)}>
          <option value="search_console">Search Console</option>
          <option value="analytics">Analytics (GA4)</option>
          <option value="business_profile">Business Profile</option>
        </select>
        <input placeholder="OAuth Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ flex: 1, padding: "0.5rem" }} />
        <input placeholder="OAuth Client Secret" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} style={{ flex: 1, padding: "0.5rem" }} />
        <button disabled={loading} onClick={() => run(() => api().google.connect(DEMO_PROJECT_ID, service, clientId, clientSecret))}>
          Connect
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button disabled={loading} onClick={() => run(() => api().google.listConnections(DEMO_PROJECT_ID))}>
          List connections
        </button>
        <button disabled={loading} onClick={() => run(() => api().google.searchConsole.listSites(DEMO_PROJECT_ID))}>
          List Search Console sites
        </button>
        <button disabled={loading} onClick={() => run(() => api().google.analytics.listProperties(DEMO_PROJECT_ID))}>
          List GA4 properties
        </button>
        <button disabled={loading} onClick={() => run(() => api().google.businessProfile.listLocations(DEMO_PROJECT_ID))}>
          List GBP locations
        </button>
      </div>

      <pre style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem", borderRadius: 6, overflowX: "auto", maxHeight: 400 }}>
        {loading ? "Running..." : output ? JSON.stringify(output, null, 2) : "Results will appear here."}
      </pre>
    </div>
  );
}
