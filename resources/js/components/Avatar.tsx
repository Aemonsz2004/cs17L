// src/components/ui/Avatar.tsx

type AvatarSize = "xs" | "sm" | "md" | "lg"

interface AvatarProps {
  initials:   string
  name?:      string
  size?:      AvatarSize
  online?:    boolean
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "w-6  h-6  text-[9px]",
  sm: "w-8  h-8  text-[11px]",
  md: "w-9  h-9  text-xs",
  lg: "w-11 h-11 text-sm",
}

// Deterministic color from name/initials
const COLORS = [
  "bg-[#1D7B6E]",
  "bg-[#1B2B4B]",
  "bg-[#C8963E]",
  "bg-blue-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-emerald-600",
  "bg-indigo-500",
]

function pickColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function Avatar({
  initials,
  name      = "",
  size      = "sm",
  online    = false,
  className = "",
}: AvatarProps) {
  const color = pickColor(name || initials)

  return (
    <div className={["relative flex-shrink-0", className].join(" ")}>
      <div
        className={[
          sizeStyles[size],
          color,
          "rounded-full flex items-center justify-center font-bold text-white select-none",
        ].join(" ")}
      >
        {initials.slice(0, 2).toUpperCase()}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#24A18F] border-2 border-white rounded-full" />
      )}
    </div>
  )
}