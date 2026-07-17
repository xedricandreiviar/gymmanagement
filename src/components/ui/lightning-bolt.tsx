type LightningBoltSize = "small" | "medium" | "large";

interface LightningBoltProps {
  className?: string;
  size?: LightningBoltSize;
  opacity?: number;
}

const sizeStyles: Record<LightningBoltSize, { width: number; height: number }> = {
  small: { width: 80, height: 80 },
  medium: { width: 140, height: 140 },
  large: { width: 200, height: 200 },
};

export function LightningBolt({ className = "", size = "medium", opacity = 0.15 }: LightningBoltProps) {
  const clampedOpacity = Math.min(opacity, 0.15);
  const { width, height } = sizeStyles[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none ${className}`}
      style={{ opacity: clampedOpacity, maxWidth: 200, maxHeight: 200 }}
      aria-hidden="true"
    >
      <path
        d="M38 2L14 34h14l-4 28 24-32H34l4-28z"
        fill="currentColor"
      />
    </svg>
  );
}
