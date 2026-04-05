// src/components/ui/NotifItem.tsx
// Single notification / activity feed row.

type NotifVariant = "red" | "amber" | "teal" | "gray"

interface NotifItemProps {
  variant?:   NotifVariant
  message:    React.ReactNode
  timestamp?: string
  unread?:    boolean
  className?: string
}

const dotColor: Record<NotifVariant, string> = {
  red:   "bg-red-400",
  amber: "bg-amber-400",
  teal:  "bg-[#24A18F]",
  gray:  "bg-[#5C6B88]",
}

export default function NotifItem({
  variant   = "gray",
  message,
  timestamp,
  unread    = false,
  className = "",
}: NotifItemProps) {
  return (
    <div
      className={[
        "flex gap-3 px-5 py-3.5",
        "border-b border-[#1B2B4B]/5 last:border-0",
        unread ? "bg-[#FAF8F4]" : "",
        className,
      ].join(" ")}
    >
      {/* Dot */}
      <span
        className={[
          "mt-1.5 w-2 h-2 rounded-full flex-shrink-0",
          dotColor[variant],
        ].join(" ")}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1B2B4B] leading-snug">{message}</p>
        {timestamp && (
          <p className="text-[11px] text-[#5C6B88] mt-0.5">{timestamp}</p>
        )}
      </div>
    </div>
  )
}