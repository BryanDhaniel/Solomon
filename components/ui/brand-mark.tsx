export default function BrandMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-ink-deep text-ink-paper flex items-center justify-center font-semibold leading-none select-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden
    >
      S
    </div>
  );
}
