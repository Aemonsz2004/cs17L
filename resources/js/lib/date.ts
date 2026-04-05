const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export function formatDateDisplay(value?: string | null, fallback = "-"): string {
  if (!value) {
    return fallback
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return fallback
  }

  const normalized = DATE_ONLY_PATTERN.test(trimmed) ? `${trimmed}T00:00:00` : trimmed
  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return dateFormatter.format(parsed)
}
