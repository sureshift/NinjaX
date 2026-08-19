import { useState } from "react";
import { api } from "../../lib/ipc";

const DEMO_PROJECT_ID = "demo-project";

type AiTab = "provider" | "content" | "analysis" | "reports" | "fixes";

const TABS: { id: AiTab; label: string }[] = [
  { id: "provider", label: "AI provider" },
  { id: "content", label: "Content writer" },
  { id: "analysis", label: "Analysis" },
  { id: "reports", label: "Reports" },
  { id: "fixes", label: "Suggested fixes" },
];

export default function AiDashboard() {
  const [tab, setTab] = useState<AiTab>("provider");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<unknown>(null);

  // Provider config form state
  const [providerKind, setProviderKind] = useState<"openai_compatible" | "anthropic" | "offline_ollama">(
    "offline_ollama"
  );
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("llama3");
  const [baseUrl, setBaseUrl] = useState("");

  // Content writer form state
  const [topic, setTopic] = useState("Benefits of local SEO for small businesses");
  const [contentType, setContentType] = useState("blog_post");

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

      {tab === "provider" && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 480 }}>
          <label>
            Provider type
            <select value={providerKind} onChange={(e) => setProviderKind(e.target.value as typeof providerKind)} style={{ width: "100%", padding: "0.4rem" }}>
              <option value="offline_ollama">Offline (local model, e.g. Ollama)</option>
              <option value="openai_compatible">Online - OpenAI-compatible API key</option>
              <option value="anthropic">Online - Anthropic API key</option>
            </select>
          </label>
          {providerKind !== "offline_ollama" && (
            <label>
              API key
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} style={{ width: "100%", padding: "0.4rem" }} />
            </label>
          )}
          <label>
            Model
            <input value={model} onChange={(e) => setModel(e.target.value)} style={{ width: "100%", padding: "0.4rem" }} />
          </label>
          <label>
            Base URL (optional - for offline server address or a custom online endpoint)
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} style={{ width: "100%", padding: "0.4rem" }} />
          </label>
          <button
            disabled={loading}
            onClick={() =>
              run(() =>
                api().ai.saveProviderConfig(
                  providerKind === "offline_ollama"
                    ? { kind: "offline_ollama", model, baseUrl: baseUrl || undefined }
                    : providerKind === "anthropic"
                    ? { kind: "anthropic", apiKey, model: model || undefined }
                    : { kind: "openai_compatible", apiKey, model, baseUrl: baseUrl || undefined }
                )
              )
            }
          >
            Save provider
          </button>
        </div>
      )}

      {tab === "content" && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} style={{ flex: 1, padding: "0.5rem" }} />
          <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
            <option value="blog_post">Blog post</option>
            <option value="meta_description">Meta description</option>
            <option value="title_tag">Title tag</option>
            <option value="product_description">Product description</option>
            <option value="faq_answer">FAQ answer</option>
          </select>
          <button
            disabled={loading}
            onClick={() => run(() => api().ai.generateContent(DEMO_PROJECT_ID, { topic, contentType }))}
          >
            Generate
          </button>
        </div>
      )}

      {tab === "analysis" && (
        <div style={{ marginTop: "1rem" }}>
          <button disabled={loading} onClick={() => run(() => api().ai.analyzeSite(DEMO_PROJECT_ID))}>
            Analyze site (prioritized fixes)
          </button>
        </div>
      )}

      {tab === "reports" && (
        <div style={{ marginTop: "1rem" }}>
          <button
            disabled={loading}
            onClick={() => run(() => api().ai.generateReport(DEMO_PROJECT_ID, "Demo Project", "https://example.com"))}
          >
            Generate full report
          </button>
        </div>
      )}

      {tab === "fixes" && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          <button disabled={loading} onClick={() => run(() => api().ai.draftFixesForContentIssues(DEMO_PROJECT_ID))}>
            Draft fixes for content issues
          </button>
          <button disabled={loading} onClick={() => run(() => api().ai.listSuggestedFixes(DEMO_PROJECT_ID))}>
            List suggested fixes
          </button>
        </div>
      )}

      <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" }}>
        {tab === "provider" && "Bring your own API key (online) or point at a local model server like Ollama (offline, nothing leaves this machine)."}
        {tab === "fixes" && "NinjaX drafts the fix text/instructions for review - it does not push changes to a live site automatically. Mark a fix as applied once you've made the change yourself."}
      </p>

      <pre style={{ marginTop: "1rem", background: "#f4f4f4", padding: "1rem", borderRadius: 6, overflowX: "auto", maxHeight: 400, whiteSpace: "pre-wrap" }}>
        {loading ? "Running..." : output ? (typeof output === "string" ? output : JSON.stringify(output, null, 2)) : "Results will appear here."}
      </pre>
    </div>
  );
}
