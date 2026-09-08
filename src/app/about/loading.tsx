export default function AboutLoading() {
  return (
    <div>
      <Skel style={{ height: "240px" }} />
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "60px 26px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", marginBottom: "72px" }}>
          <div>
            <Skel style={{ width: "120px", height: "12px", marginBottom: "14px" }} />
            <Skel style={{ width: "280px", height: "40px", marginBottom: "20px" }} />
            <Skel style={{ height: "18px", marginBottom: "10px" }} />
            <Skel style={{ height: "18px", marginBottom: "10px" }} />
            <Skel style={{ height: "18px", width: "70%" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} style={{ height: "80px", borderRadius: "18px" }} />
            ))}
          </div>
        </div>
        <Skel style={{ width: "140px", height: "12px", marginBottom: "14px" }} />
        <Skel style={{ width: "300px", height: "36px", marginBottom: "32px" }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skel key={i} style={{ height: "44px", marginBottom: "20px", borderRadius: "10px", width: `${70 + i * 5}%` }} />
        ))}
        <div style={{ marginTop: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skel key={i} style={{ height: "200px", borderRadius: "20px" }} />
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
