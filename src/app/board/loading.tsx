export default function BoardLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "36px" }}>
        <div style={{ flex: 1, maxWidth: "480px" }}>
          <Skel style={{ width: "130px", height: "12px", marginBottom: "12px" }} />
          <Skel style={{ width: "100%", height: "48px", marginBottom: "12px" }} />
          <Skel style={{ width: "80%", height: "20px" }} />
        </div>
        <Skel style={{ width: "140px", height: "46px", borderRadius: "9999px" }} />
      </div>
      <Skel style={{ height: "64px", borderRadius: "20px", marginBottom: "24px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} style={{ height: "210px", borderRadius: "20px" }} />
        ))}
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
