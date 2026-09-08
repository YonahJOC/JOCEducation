export default function LessonDetailLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 26px 72px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "48px" }}>
      <div>
        <Skel style={{ width: "80px", height: "12px", marginBottom: "12px" }} />
        <Skel style={{ width: "300px", height: "14px", marginBottom: "20px" }} />
        <Skel style={{ width: "90%", height: "52px", marginBottom: "8px" }} />
        <Skel style={{ width: "70%", height: "52px", marginBottom: "24px" }} />
        <Skel style={{ height: "3px", marginBottom: "32px" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skel key={i} style={{ height: "120px", borderRadius: "16px", marginBottom: "16px" }} />
        ))}
      </div>
      <div>
        <Skel style={{ height: "220px", borderRadius: "20px", marginBottom: "20px" }} />
        <Skel style={{ height: "180px", borderRadius: "20px" }} />
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
