export default function ProgramDetailLoading() {
  return (
    <div>
      <Skel style={{ height: "220px" }} />
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "56px 26px 72px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "52px" }}>
        <div>
          <Skel style={{ height: "80px", marginBottom: "44px" }} />
          <Skel style={{ width: "160px", height: "28px", marginBottom: "28px" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skel key={i} style={{ height: "90px", borderRadius: "18px", marginBottom: "6px" }} />
          ))}
        </div>
        <div>
          <Skel style={{ height: "280px", borderRadius: "22px", marginBottom: "18px" }} />
          <Skel style={{ height: "220px", borderRadius: "22px" }} />
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
