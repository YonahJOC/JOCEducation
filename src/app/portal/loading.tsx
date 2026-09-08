export default function PortalLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 26px 72px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <Skel style={{ width: "220px", height: "14px", marginBottom: "8px" }} />
          <Skel style={{ width: "300px", height: "38px" }} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Skel style={{ width: "130px", height: "42px", borderRadius: "9999px" }} />
          <Skel style={{ width: "130px", height: "42px", borderRadius: "9999px" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "36px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} style={{ height: "120px", borderRadius: "18px" }} />
        ))}
      </div>
      <Skel style={{ width: "360px", height: "52px", borderRadius: "14px", marginBottom: "28px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        <Skel style={{ height: "340px", borderRadius: "18px" }} />
        <Skel style={{ height: "340px", borderRadius: "18px" }} />
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
