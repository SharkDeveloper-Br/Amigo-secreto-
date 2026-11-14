const flakes = [
  { x: 6, y: 12, s: 18 },
  { x: 22, y: 40, s: 12 },
  { x: 48, y: 8, s: 14 },
  { x: 70, y: 30, s: 20 },
  { x: 88, y: 10, s: 12 },
  { x: 94, y: 48, s: 16 },
];

/** Flocos de neve sutis no topo (decoração). */
export function Snowflakes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden text-gold opacity-[0.08]"
    >
      {flakes.map((f, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={f.s}
          height={f.s}
          className="absolute"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1M9 3l3 3 3-3M9 21l3-3 3 3M3 9l3 3-3 3M21 9l-3 3 3 3" />
        </svg>
      ))}
    </div>
  );
}
