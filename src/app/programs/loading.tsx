export default function ProgramsLoading() {
  return (
    <div>
      <Skel style={{ height: "220px" }} />
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "52px 26px 0" }}>
        <Skel style={{ width: "200px", height: "14px", marginBottom: "18px" }} />
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skel key={i} style={{ width: "120px", height: "46px", borderRadius: "9999px" }} />
          ))}
        </div>
        <Skel style={{ height: "280px", borderRadius: "26px", marginBottom: "64px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skel key={i} style={{ height: "240px", borderRadius: "22px" }} />
          ))}
        </div>
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
