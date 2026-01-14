import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: 'cyan' | 'magenta' | 'purple';
  showLabel?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  color = 'cyan',
  showLabel = true,
}: ProgressRingProps) {
  // Make responsive: use CSS clamp for sizing
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Use brand greens only - no purple/blue
  const colorMap = {
    cyan: {
      stroke: 'hsl(var(--primary))',
      glow: 'hsl(84 100% 72% / 0.5)',
    },
    magenta: {
      stroke: 'hsl(var(--secondary))',
      glow: 'hsl(100 64% 59% / 0.5)',
    },
    purple: {
      stroke: 'hsl(var(--accent))',
      glow: 'hsl(151 100% 37% / 0.5)',
    },
  };

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center w-full max-w-[120px] aspect-square mx-auto",
        // CRITICAL: Reset ALL potential square artifacts - no glow/shadow/ring/outline on wrapper
        // The glow is applied via filter:drop-shadow on the SVG circle, not the container
        "outline-none ring-0 border-0 shadow-none",
        // Isolate from parent hover-glow effects
        "[box-shadow:none!important] hover:[box-shadow:none!important]",
        className
      )}
      style={{ maxWidth: size, maxHeight: size, boxShadow: 'none' }}
    >
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full h-full transform -rotate-90"
        aria-label={`Progress: ${Math.round(progress)}%`}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.3)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorMap[color].stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${colorMap[color].glow})`,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg sm:text-xl md:text-2xl font-bold font-display">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
