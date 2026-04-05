// src/components/ui/MetricCard.tsx

type Trend = "up" | "down" | "neutral"

interface MetricCardProps {
  label:      string
  value:      string | number
  sub?:       string
  trend?:     Trend
  icon?:      React.ReactNode
  iconBg?:    string
  className?: string
}

const trendStyles: Record<Trend, string> = {
  up:      "text-[#1D7B6E]",
  down:    "text-red-500",
  neutral: "text-[#5C6B88]",
}

export default function MetricCard({
  label,
  value,
  sub,
  trend     = "neutral",
  icon,
  iconBg    = "bg-[#1D7B6E]/10 text-[#1D7B6E]",
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={[
        "bg-[#F5F0E8]/70 rounded-xl p-4 flex flex-col gap-1",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5C6B88]">
          {label}
        </p>
        {icon && (
          <span
            className={[
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              iconBg,
            ].join(" ")}
          >
            {icon}
          </span>
        )}
      </div>

      <p className="text-2xl font-bold text-[#1B2B4B] leading-tight">{value}</p>

      {sub && (
        <p className={["text-xs font-medium", trendStyles[trend]].join(" ")}>
          {sub}
        </p>
      )}
    </div>
  )
}