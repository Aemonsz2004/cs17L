// src/components/ui/ProgressBar.tsx

type ProgressBarVariant = "teal" | "navy" | "amber" | "red" | "gold"

interface ProgressBarProps {
  value:      number        // 0–100
  max?:       number        // defaults to 100
  variant?:   ProgressBarVariant
  size?:      "xs" | "sm" | "md"
  label?:     string        // left label
  showValue?: boolean       // show percentage on the right
  animated?:  boolean       // pulse when incomplete
  className?: string
}

const trackHeight = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
}

const fillStyles: Record<ProgressBarVariant, string> = {
  teal:  "bg-[#24A18F]",
  navy:  "bg-[#1B2B4B]",
  amber: "bg-amber-500",
  red:   "bg-red-500",
  gold:  "bg-[#C8963E]",
}

export default function ProgressBar({
  value,
  max       = 100,
  variant   = "teal",
  size      = "sm",
  label,
  showValue = false,
  animated  = false,
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={["w-full", className].join(" ")}>
      {/* Top row: label + value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label    && <span className="text-xs text-[#5C6B88]">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-[#1B2B4B]">{Math.round(pct)}%</span>}
        </div>
      )}

      {/* Track */}
      <div className={["w-full bg-[#EDE5D8] rounded-full overflow-hidden", trackHeight[size]].join(" ")}>
        {/* Fill */}
        <div
          className={[
            "h-full rounded-full transition-all duration-500 ease-out",
            fillStyles[variant],
            animated && pct < 100 ? "animate-pulse" : "",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}