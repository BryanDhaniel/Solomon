export default function BrandMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" className="fill-ink-deep" />
      <circle cx="21" cy="9" r="3" className="fill-ink-paper opacity-70" />
      <path
        d="M5 24 L12 13 L15.5 17.5 L19 11 L27 24 Z"
        className="fill-ink-paper"
      />
    </svg>
  );
}
