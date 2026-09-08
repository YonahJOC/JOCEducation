export default function ShopLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 26px 72px" }}>
      <Skel style={{ width: "100px", height: "12px", marginBottom: "14px" }} />
      <Skel style={{ width: "340px", height: "52px", marginBottom: "14px" }} />
      <Skel style={{ width: "280px", height: "20px", marginBottom: "40px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skel key={i} style={{ height: "280px", borderRadius: "22px" }} />
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
