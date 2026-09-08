export default function ContactLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "60px 26px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "60px" }}>
      <div>
        <Skel style={{ width: "100px", height: "12px", marginBottom: "12px" }} />
        <Skel style={{ width: "320px", height: "52px", marginBottom: "18px" }} />
        <Skel style={{ height: "18px", marginBottom: "8px" }} />
        <Skel style={{ height: "18px", marginBottom: "36px", width: "85%" }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skel key={i} style={{ height: "72px", borderRadius: "16px", marginBottom: "18px" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Skel style={{ height: "48px", borderRadius: "12px" }} />
          <Skel style={{ height: "48px", borderRadius: "12px" }} />
        </div>
        <Skel style={{ height: "48px", borderRadius: "12px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Skel style={{ height: "48px", borderRadius: "12px" }} />
          <Skel style={{ height: "48px", borderRadius: "12px" }} />
        </div>
        <Skel style={{ height: "130px", borderRadius: "12px" }} />
        <Skel style={{ height: "48px", borderRadius: "9999px" }} />
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
