import { C } from "@/lib/joc-tokens";
export default function HomeLoading() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.paper }}>
      <Skeleton style={{ height: "88vh", marginBottom: "0" }} />
    </div>
  );
}

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: C.hairline,
        borderRadius: "4px",
        animation: "shimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    >
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: .55; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
