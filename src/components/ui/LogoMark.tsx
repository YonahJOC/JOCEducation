export function LogoMark({ size = 40 }: { size?: number }) {
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JOC Education logo"
    >
      {/* Navy disc */}
      <circle cx="20" cy="20" r="20" fill="#10233F" />
      {/* White ring */}
      <circle cx="20" cy="20" r="13" stroke="white" strokeWidth="3.5" fill="none" />
      {/* Orange broken arc — top right gap */}
      <path
        d="M 20 7 A 13 13 0 1 1 7.5 26.5"
        stroke="#F7941D"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
