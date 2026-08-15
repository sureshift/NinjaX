import { useState } from "react";
import { api, SeoAudit } from "./lib/ipc";

const DEMO_PROJECT_ID = "demo-project";

export default function App() {
  const [url, setUrl] = useState("https://example.com");
  const [audits, setAudits] = useState<SeoAudit[]>([]);
  const [loading, setLoading] = useState(false);

  async function runAudit() {
    setLoading(true);
    try {
      await api().seo.runAudit(DEMO_PROJECT_ID, url);
      const list = await api().seo.listAudits(DEMO_PROJECT_ID);
      setAudits(list);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>NinjaX</h1>
      <p style={{ color: "#666" }}>SEO · GEO · AEO · Social media management</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>SEO audit (demo)</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1, padding: "0.5rem" }}
          />
          <button onClick={runAudit} disabled={loading}>
            {loading ? "Auditing..." : "Run audit"}
          </button>
        </div>

        <ul style={{ marginTop: "1rem" }}>
          {audits.map((a) => (
            <li key={a.id}>
              <strong>{a.url}</strong> — score {a.score} ({a.crawledAt})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
