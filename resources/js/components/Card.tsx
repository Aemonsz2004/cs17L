// src/components/ui/Card.tsx

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  hover?:     boolean
  padding?:   boolean
  className?: string
  children:   React.ReactNode
}

function Card({ hover = false, padding = false, className = "", children }: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-xl border border-[#1B2B4B]/10",
        "shadow-[0_1px_3px_rgba(27,43,75,0.08),0_1px_2px_rgba(27,43,75,0.04)]",
        hover
          ? "transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(27,43,75,0.12)] cursor-pointer"
          : "",
        padding ? "p-5" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  )
}

// ── Card.Header ───────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title?:     string
  action?:    React.ReactNode
  border?:    boolean
  className?: string
  children?:  React.ReactNode
}

Card.Header = function CardHeader({
  title,
  action,
  border = true,
  className = "",
  children,
}: CardHeaderProps) {
  return (
    <div
      className={[
        "flex items-center justify-between px-5 py-3.5",
        border ? "border-b border-[#1B2B4B]/8" : "",
        className,
      ].join(" ")}
    >
      {title ? (
        <h3 className="text-sm font-semibold text-[#1B2B4B]">{title}</h3>
      ) : (
        children
      )}
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}

// ── Card.Body ─────────────────────────────────────────────────────────────────

interface CardBodyProps {
  flush?:     boolean
  className?: string
  children:   React.ReactNode
}

Card.Body = function CardBody({ flush = false, className = "", children }: CardBodyProps) {
  return (
    <div className={[flush ? "" : "p-5", className].join(" ")}>
      {children}
    </div>
  )
}

// ── Card.Footer ───────────────────────────────────────────────────────────────

interface CardFooterProps {
  className?: string
  children:   React.ReactNode
}

Card.Footer = function CardFooter({ className = "", children }: CardFooterProps) {
  return (
    <div
      className={[
        "px-5 py-3 border-t border-[#1B2B4B]/8",
        "bg-[#FAF8F4]/60 rounded-b-xl text-sm text-[#5C6B88]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  )
}

export default Card