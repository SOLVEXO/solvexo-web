interface AnimatedBellIconProps {
  size?: number;
  className?: string;
}

/** Same visual bell as lucide-react's `Bell` (identical path data), split into
 *  its two real paths — the body and the small clapper hanging at the bottom
 *  — so each can be animated independently on hover (see `.bell-icon-body`/
 *  `.bell-icon-clapper` in index.css). Must be rendered inside an ancestor
 *  carrying Tailwind's `group` class for the hover trigger to fire. */
export function AnimatedBellIcon({ size = 16, className }: AnimatedBellIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path className="bell-icon-clapper" d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path
        className="bell-icon-body"
        d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
      />
    </svg>
  );
}
