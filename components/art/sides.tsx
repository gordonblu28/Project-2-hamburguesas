import { rng } from "./geometry";

type Svg = { className?: string };

const Shadow = ({ cx, cy, rx }: { cx: number; cy: number; rx: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.09} fill="url(#sh-shadow)" />
);

export function Fries({ className, variant = "classic" }: Svg & { variant?: "classic" | "truffle" | "loaded" }) {
  const rand = rng(variant.length * 17);
  const sticks = Array.from({ length: 15 }, (_, i) => ({
    x: 70 + i * 11 + (rand() - 0.5) * 6,
    top: 30 + rand() * 50,
    rot: (i - 7) * 3.2 + (rand() - 0.5) * 6,
  }));
  return (
    <svg viewBox="0 0 300 340" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={150} cy={326} rx={120} />
      {sticks.map((s, i) => (
        <g key={i} transform={`rotate(${s.rot} ${s.x} 200)`}>
          <rect x={s.x - 8} y={s.top} width="16" height={200 - s.top + 40} rx="3" fill="url(#sh-fry)" />
          <rect x={s.x - 8} y={s.top} width="16" height="6" rx="3" fill="#C9822B" opacity="0.6" />
        </g>
      ))}
      {variant === "loaded" && (
        <>
          <path d="M70 128c20-18 40 6 60-6s40 10 60-4 30 4 42 10l-4 34H74Z" fill="#F7B92F" />
          {[95, 130, 168, 205].map((x, i) => (
            <g key={x} transform={`translate(${x} ${120 + (i % 2) * 8})`}>
              <ellipse rx="10" ry="5" fill="#3E7E2A" />
              <ellipse rx="5" ry="2.4" fill="#B9D88A" />
            </g>
          ))}
          {[110, 150, 188].map((x) => (
            <rect key={x} x={x} y="108" width="12" height="7" rx="2" fill="#A53A25" />
          ))}
          <path d="M84 104c30 8 100 8 130 0" stroke="#F28C67" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      )}
      {variant === "truffle" &&
        Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={80 + rand() * 140} cy={40 + rand() * 110} r={1.5 + rand() * 2.5} fill={i % 3 ? "#FFF6DD" : "#4D8A2E"} />
        ))}
      <path d="M60 150h180l-22 176H82Z" fill="#D83B2D" />
      <path d="M60 150h180l-3 22H63Z" fill="#B42E22" />
      <path d="M92 196h116" stroke="#F7F4ED" strokeWidth="10" />
      <text x="150" y="268" textAnchor="middle" fontFamily="var(--font-display), Impact, sans-serif" fontWeight="900" fontSize="52" fill="#F7F4ED" letterSpacing="2">
        SH
      </text>
    </svg>
  );
}

const SHAKE = {
  vanilla: { body: "#F6E4B8", shade: "#E5CC8E", drip: "#F2B544" },
  chocolate: { body: "#6E3B22", shade: "#4A2412", drip: "#2E1407" },
  strawberry: { body: "#F4A3A8", shade: "#E07A84", drip: "#D83B2D" },
} as const;

export function Shake({ className, flavor = "vanilla" }: Svg & { flavor?: keyof typeof SHAKE }) {
  const c = SHAKE[flavor];
  return (
    <svg viewBox="0 0 260 380" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={130} cy={370} rx={90} />
      <g transform="rotate(12 170 60)">
        <rect x="160" y="-6" width="16" height="190" rx="4" fill="#F7F4ED" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M160 ${10 + i * 30}l16 -12v14l-16 12Z`} fill="#D83B2D" />
        ))}
      </g>
      <path d="M58 140h144l-20 214c-1 10-8 16-18 16h-68c-10 0-17-6-18-16Z" fill={c.body} />
      <path d="M58 140h144l-3 30H61Z" fill={c.shade} opacity="0.6" />
      <path d="M150 150l-6 210" stroke={c.drip} strokeWidth="5" opacity="0.35" strokeLinecap="round" />
      <path d="M58 140h144l-20 214c-1 10-8 16-18 16h-68c-10 0-17-6-18-16Z" fill="url(#sh-glass)" />
      <rect x="50" y="128" width="160" height="18" rx="9" fill="#FFFFFF" opacity="0.85" />
      <g fill="#FFFDF7">
        <ellipse cx="130" cy="122" rx="74" ry="22" />
        <ellipse cx="130" cy="98" rx="56" ry="20" />
        <ellipse cx="130" cy="78" rx="38" ry="16" />
        <ellipse cx="130" cy="62" rx="20" ry="11" />
      </g>
      <path d="M86 104c20 8 70 8 90 0M98 84c16 6 48 6 64 0" stroke="#EDE6D6" strokeWidth="3" fill="none" />
      <path d={`M80 126c6 10 4 22 8 26M176 126c-4 12 2 18-2 30`} stroke={c.drip} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="132" cy="40" r="14" fill="#C8241A" />
      <circle cx="127" cy="35" r="4" fill="#FFFFFF" opacity="0.6" />
      <path d="M134 28c4-14 12-20 22-24" stroke="#3E5F1E" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Soda({ className }: Svg) {
  return (
    <svg viewBox="0 0 220 360" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={110} cy={350} rx={80} />
      <rect x="116" y="0" width="12" height="80" rx="3" fill="#171717" />
      <path d="M38 76h144l-4 18H42Z" fill="#E7E4DD" />
      <rect x="32" y="62" width="156" height="18" rx="8" fill="#FFFFFF" />
      <path d="M42 94h136l-18 248c-1 6-6 10-12 10H72c-6 0-11-4-12-10Z" fill="#D83B2D" />
      <path d="M48 160h124l-4 50H52Z" fill="#F7F4ED" />
      <text x="110" y="196" textAnchor="middle" fontFamily="var(--font-display), Impact, sans-serif" fontWeight="900" fontSize="34" fill="#171717">
        STACK
      </text>
      <path d="M58 100l14 240" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="8" />
    </svg>
  );
}

export function Lemonade({ className }: Svg) {
  return (
    <svg viewBox="0 0 220 340" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={110} cy={330} rx={80} />
      <rect x="120" y="8" width="10" height="150" rx="3" fill="#F2B544" transform="rotate(10 125 80)" />
      <path d="M40 80h140l-14 236c-1 8-7 14-15 14H69c-8 0-14-6-15-14Z" fill="#F8DD7A" />
      {[
        [80, 140, 10],
        [124, 170, -12],
        [96, 210, 20],
      ].map(([x, y, r]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="34" height="34" rx="6" fill="#FFFFFF" opacity="0.55" transform={`rotate(${r} ${x! + 17} ${y! + 17})`} />
      ))}
      <path d="M40 80h140l-14 236c-1 8-7 14-15 14H69c-8 0-14-6-15-14Z" fill="url(#sh-glass)" />
      <g transform="translate(166 82)">
        <circle r="34" fill="#F2B544" />
        <circle r="28" fill="#FCEBA4" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} d="M0 0L0 -26" stroke="#F2B544" strokeWidth="2" transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  );
}

export function SauceCup({ className }: Svg) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={120} cy={190} rx={96} />
      <path d="M30 70h180l-16 104c-2 10-8 14-18 14H64c-10 0-16-4-18-14Z" fill="#FFFFFF" />
      <path d="M44 120h152M48 150h144" stroke="#E7E4DD" strokeWidth="3" />
      <ellipse cx="120" cy="70" rx="92" ry="22" fill="#F7F4ED" />
      <ellipse cx="120" cy="72" rx="80" ry="16" fill="#F28C67" />
      <path d="M86 70c14-10 50-10 64 2" stroke="#F9B79C" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Cookie({ className }: Svg) {
  const rand = rng(91);
  return (
    <svg viewBox="0 0 300 300" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={150} cy={262} rx={120} />
      <circle cx="150" cy="140" r="112" fill="url(#sh-cookie)" />
      <circle cx="150" cy="140" r="96" fill="#D9A15A" opacity="0.5" />
      {Array.from({ length: 13 }, (_, i) => {
        const a = rand() * Math.PI * 2;
        const d = rand() * 84;
        return (
          <path
            key={i}
            d={`M${150 + Math.cos(a) * d} ${140 + Math.sin(a) * d}l12 -4 4 12 -12 6Z`}
            fill="#3A1C0D"
            transform={`rotate(${rand() * 90} ${150 + Math.cos(a) * d} ${140 + Math.sin(a) * d})`}
          />
        );
      })}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={`s${i}`} x={70 + rand() * 160} y={60 + rand() * 160} width="4" height="4" fill="#FFFFFF" opacity="0.9" />
      ))}
    </svg>
  );
}

export function Sundae({ className }: Svg) {
  return (
    <svg viewBox="0 0 260 340" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={130} cy={330} rx={84} />
      <path d="M40 170h180c0 60-36 96-90 96s-90-36-90-96Z" fill="#F7F4ED" stroke="#E7E4DD" strokeWidth="4" />
      <path d="M118 264h24v44h-24Z" fill="#E7E4DD" />
      <ellipse cx="130" cy="316" rx="60" ry="12" fill="#E7E4DD" />
      <g fill="#FFFDF7">
        <ellipse cx="130" cy="164" rx="86" ry="26" />
        <ellipse cx="130" cy="134" rx="66" ry="24" />
        <ellipse cx="130" cy="108" rx="44" ry="20" />
        <ellipse cx="130" cy="88" rx="22" ry="12" />
      </g>
      <path d="M62 150c10 14 6 30 14 34M190 146c-6 16 2 22-4 36M100 120c-4 10 2 18 0 26M164 116c4 8-2 18 2 26M70 160c40 14 80 14 120 0" stroke="#3A1C0D" strokeWidth="9" strokeLinecap="round" fill="none" />
      {[96, 120, 150, 172].map((x, i) => (
        <ellipse key={x} cx={x} cy={102 + (i % 2) * 14} rx="7" ry="4" fill="#B2742F" />
      ))}
      <circle cx="130" cy="66" r="14" fill="#C8241A" />
      <circle cx="125" cy="61" r="4" fill="#FFFFFF" opacity="0.6" />
      <path d="M132 54c4-14 12-20 22-24" stroke="#3E5F1E" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function OnionRings({ className }: Svg) {
  const rings = [
    [150, 250, 92],
    [118, 200, 80],
    [180, 168, 76],
    [140, 118, 70],
  ] as const;
  return (
    <svg viewBox="0 0 300 320" className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <Shadow cx={150} cy={300} rx={120} />
      {rings.map(([cx, cy, r], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.42} fill="none" stroke="#A9601F" strokeWidth="30" />
          <ellipse cx={cx} cy={cy - 2} rx={r} ry={r * 0.42} fill="none" stroke="url(#sh-chicken)" strokeWidth="26" />
          <ellipse cx={cx} cy={cy - 6} rx={r - 6} ry={r * 0.42 - 6} fill="none" stroke="#F7CC74" strokeWidth="4" strokeDasharray="6 10" />
        </g>
      ))}
    </svg>
  );
}
