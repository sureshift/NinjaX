import { useState } from "react";
import SeoDashboard from "./modules/seo/SeoDashboard";
import AiDashboard from "./modules/ai/AiDashboard";
import IntegrationsDashboard from "./modules/integrations/IntegrationsDashboard";

type Section = "seo" | "ai" | "integrations";

export default function App() {
  const [section, setSection] = useState<Section>("seo");

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1>NinjaX</h1>
      <p style={{ color: "#666" }}>SEO · GEO · AEO · Social media management</p>

      <div style={{ display: "flex", gap: "0.5rem", margin: "1rem 0 1.5rem" }}>
        {([
          ["seo", "SEO"],
          ["ai", "AI"],
          ["integrations", "Integrations"],
        ] as [Section, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              borderBottom: section === id ? "2px solid #111" : "2px solid transparent",
              background: "none",
              fontWeight: section === id ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "seo" && <SeoDashboard />}
      {section === "ai" && <AiDashboard />}
      {section === "integrations" && <IntegrationsDashboard />}
    </div>
  );
}
