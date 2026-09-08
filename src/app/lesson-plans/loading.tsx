export default function LessonPlansLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "66px 26px 20px" }}>
      <Skel style={{ width: "120px", height: "12px", marginBottom: "16px" }} />
      <Skel style={{ width: "360px", height: "44px", marginBottom: "32px" }} />
      <Skel style={{ height: "72px", borderRadius: "20px", marginBottom: "24px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(292px, 1fr))", gap: "18px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} style={{ height: "260px", borderRadius: "20px" }} />
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
