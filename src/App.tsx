import SeoDashboard from "./modules/seo/SeoDashboard";

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>NinjaX</h1>
      <p style={{ color: "#666" }}>SEO · GEO · AEO · Social media management</p>
      <SeoDashboard />
    </div>
  );
}
