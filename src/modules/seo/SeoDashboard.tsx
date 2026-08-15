import { useState } from "react";
import { api } from "../../lib/ipc";

const DEMO_PROJECT_ID = "demo-project";

type Tab =
  | "technical"
  | "onpage"
  | "performance"
  | "architecture"
  | "content"
  | "keywords"
  | "backlinks"
  | "local";

const TABS: { id: Tab; label: string }[] = [
  { id: "technical", label: "Technical" },
  { id: "onpage", label: "On-page" },
  { id: "performance", label: "Performance" },
  { id: "architecture", label: "Site architecture" },
  { id: "content", label: "Content" },
  { id: "keywords", label: "Keywords" },
  { id: "backlinks", label: "Backlinks" },
  { id: "local", label: "Local SEO" },
];

export default function SeoDashboard() {
  const [tab, setTab] = useState<Tab>("technical");
  const [url, setUrl] = useState("https://example.com");
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
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid #ddd", paddingBottom: "0.75rem" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setOutput(null); }}
            style={{
              padding: "0.4rem 0.8rem",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: tab === t.id ? "#111" : "#fff",
              color: tab === t.id ? "#fff" : "#111",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} style={{ flex: 1, padding: "0.5rem" }} />

        {tab === "technical" && (
          <button disabled={loading} onClick={() => run(() => api().seo.runTechnicalAudit(DEMO_PROJECT_ID, url))}>
            Run technical audit
          </button>
        )}
        {tab === "onpage" && (
          <button disabled={loading} onClick={() => run(() => api().seo.analyzeOnPage(url))}>
            Analyze on-page
          </button>
        )}
        {tab === "performance" && (
          <button disabled={loading} onClick={() => run(() => api().seo.measureCoreWebVitals(DEMO_PROJECT_ID, url))}>
            Measure Core Web Vitals
          </button>
        )}
        {tab === "architecture" && (
          <button disabled={loading} onClick={() => run(() => api().seo.crawlSite(DEMO_PROJECT_ID, url, 25))}>
            Crawl site (25 pages)
          </button>
        )}
        {tab === "content" && (
          <button disabled={loading} onClick={() => run(() => api().seo.runContentAudit(DEMO_PROJECT_ID))}>
            Run content audit
          </button>
        )}
        {tab === "keywords" && (
          <button
            disabled={loading}
            onClick={() => run(() => api().seo.addKeyword(DEMO_PROJECT_ID, url, url, "google"))}
          >
            Add as keyword (demo)
          </button>
        )}
        {tab === "backlinks" && (
          <button disabled={loading} onClick={() => run(() => api().seo.fetchBacklinks(DEMO_PROJECT_ID, url))}>
            Fetch backlinks
          </button>
        )}
        {tab === "local" && (
          <button
            disabled={loading}
            onClick={() =>
              run(() =>
                api().seo.checkNapConsistency(
                  DEMO_PROJECT_ID,
                  { platform: "canonical", businessName: "Demo", address: "1 Main St", phone: "555-0100" },
                  [{ platform: "yelp", businessName: "Demo", address: "1 Main St", phone: "555-0100" }]
                )
              )
            }
          >
            Check NAP consistency (demo)
          </button>
        )}
      </div>

      {tab === "keywords" || tab === "backlinks" || tab === "local" ? (
        <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.5rem" }}>
          {tab === "keywords" && "Rank tracking needs a rank-check provider API key (SerpApi/DataForSEO/Semrush) - see electron/modules/seo/keywords.ts."}
          {tab === "backlinks" && "Backlink data needs a provider API key (Ahrefs/Moz/Semrush) - see electron/modules/seo/backlinks.ts."}
          {tab === "local" && "This demo compares two hardcoded listings - wire real listing sources via electron/modules/seo/local.ts."}
        </p>
      ) : null}

      <pre style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem", borderRadius: 6, overflowX: "auto", maxHeight: 400 }}>
        {loading ? "Running..." : output ? JSON.stringify(output, null, 2) : "Results will appear here."}
      </pre>
    </div>
  );
}
