export default function LoginLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 26px" }}>
      <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skel style={{ width: "120px", height: "32px", borderRadius: "10px", marginBottom: "8px" }} />
        <Skel style={{ height: "48px", borderRadius: "12px" }} />
        <Skel style={{ height: "48px", borderRadius: "12px" }} />
        <Skel style={{ height: "48px", borderRadius: "9999px" }} />
        <Skel style={{ height: "16px", width: "180px", margin: "0 auto" }} />
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
