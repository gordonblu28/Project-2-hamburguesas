/**
 * Shared SVG gradients for the illustrated food art. Rendered once in the root
 * layout. Must never be display:none, otherwise browsers drop the gradients.
 */
export function ArtDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        <linearGradient id="sh-bun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3B95B" />
          <stop offset="0.5" stopColor="#DB8C36" />
          <stop offset="1" stopColor="#A85E1E" />
        </linearGradient>
        <radialGradient id="sh-bun-hi" cx="0.36" cy="0.28" r="0.5">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFF4D6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sh-bun-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7A650" />
          <stop offset="1" stopColor="#AE6524" />
        </linearGradient>
        <linearGradient id="sh-patty" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A3E1C" />
          <stop offset="0.55" stopColor="#4F250F" />
          <stop offset="1" stopColor="#2E1407" />
        </linearGradient>
        <linearGradient id="sh-cheese" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD56A" />
          <stop offset="1" stopColor="#EFA22E" />
        </linearGradient>
        <linearGradient id="sh-cheddar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB547" />
          <stop offset="1" stopColor="#E07F1F" />
        </linearGradient>
        <linearGradient id="sh-lettuce" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A6D865" />
          <stop offset="1" stopColor="#4A9530" />
        </linearGradient>
        <linearGradient id="sh-tomato" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EE5A45" />
          <stop offset="1" stopColor="#B4281C" />
        </linearGradient>
        <linearGradient id="sh-chicken" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0B653" />
          <stop offset="0.6" stopColor="#D08532" />
          <stop offset="1" stopColor="#9D5618" />
        </linearGradient>
        <linearGradient id="sh-veggie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A6A3A" />
          <stop offset="1" stopColor="#4F3A1C" />
        </linearGradient>
        <linearGradient id="sh-bacon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CC5A3E" />
          <stop offset="1" stopColor="#8A2D1E" />
        </linearGradient>
        <linearGradient id="sh-bbq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E2E1A" />
          <stop offset="1" stopColor="#4E140A" />
        </linearGradient>
        <linearGradient id="sh-fry" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F9D77A" />
          <stop offset="0.5" stopColor="#F3BC4C" />
          <stop offset="1" stopColor="#D9932E" />
        </linearGradient>
        <linearGradient id="sh-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="0.8" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="sh-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#171717" stopOpacity="0.32" />
          <stop offset="1" stopColor="#171717" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sh-cookie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9A15A" />
          <stop offset="1" stopColor="#A86B2C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
