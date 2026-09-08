export default function ResourcesLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 26px 72px" }}>
      <Skel style={{ width: "130px", height: "12px", marginBottom: "14px" }} />
      <Skel style={{ width: "420px", height: "52px", marginBottom: "14px" }} />
      <Skel style={{ width: "320px", height: "22px", marginBottom: "24px" }} />
      <Skel style={{ height: "62px", borderRadius: "14px", marginBottom: "40px" }} />
      <Skel style={{ height: "90px", borderRadius: "18px", marginBottom: "36px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skel key={i} style={{ height: "88px", borderRadius: "22px" }} />
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
