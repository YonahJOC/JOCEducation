export default function PricingLoading() {
  return (
    <div>
      <Skel style={{ height: "200px" }} />
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "52px 26px 72px" }}>
        <Skel style={{ height: "52px", borderRadius: "14px", marginBottom: "28px", maxWidth: "360px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "48px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skel key={i} style={{ height: "380px", borderRadius: "24px" }} />
          ))}
        </div>
        <Skel style={{ height: "120px", borderRadius: "20px" }} />
      </div>
    </div>
  );
}

function Skel({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ backgroundColor: "#F0EDE8", animation: "shimmer 1.6s ease-in-out infinite", ...style }}>
      <style>{`@keyframes shimmer{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}`}</style>
    </div>
  );
}
