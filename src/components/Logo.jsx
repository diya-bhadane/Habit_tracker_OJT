export default function Logo({ size = 40 }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-[10px] bg-[#6558f5]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="w-4/5 h-4/5 text-white"
      >
        {/* Hexagon outline */}
        <path
          d="M16 3 L25 8 L25 18 L16 23 L7 18 L7 8 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Inner chevron */}
        <path
          d="M11 11 L16 14 L21 11 L21 15 L16 18 L11 15 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
