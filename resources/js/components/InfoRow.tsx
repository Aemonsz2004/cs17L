// src/components/ui/InfoRow.tsx
// Horizontal label → value pair used in detail panels, invoices, lease cards.

interface InfoRowProps {
  label:      string
  value:      React.ReactNode
  border?:    boolean
  className?: string
}

export default function InfoRow({
  label,
  value,
  border    = true,
  className = "",
}: InfoRowProps) {
  return (
    <div
      className={[
        "flex items-center justify-between py-2.5 text-sm",
        border ? "border-b border-[#1B2B4B]/5 last:border-0" : "",
        className,
      ].join(" ")}
    >
      <span className="text-[#5C6B88]">{label}</span>
      <span className="font-medium text-[#1B2B4B] text-right">{value}</span>
    </div>
  )
}