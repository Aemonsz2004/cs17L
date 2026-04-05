// src/components/ui/Table.tsx

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key:       keyof T | string
  label:     string
  width?:    number | string
  align?:    "left" | "center" | "right"
  render?:   (value: unknown, row: T) => React.ReactNode
}

interface TableProps<T> {
  columns:      TableColumn<T>[]
  data:         T[]
  keyField:     keyof T
  loading?:     boolean
  emptyText?:   string
  onRowClick?:  (row: T) => void
  className?:   string
}

const alignClass = {
  left:   "text-left",
  center: "text-center",
  right:  "text-right",
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div
            className="h-4 rounded bg-[#EDE5D8]/80 animate-pulse"
            style={{ width: `${55 + (i % 4) * 12}%` }}
          />
        </td>
      ))}
    </tr>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading    = false,
  emptyText  = "No records found.",
  onRowClick,
  className  = "",
}: TableProps<T>) {
  return (
    <div className={["w-full overflow-x-auto", className].join(" ")}>
      <table className="w-full text-sm border-collapse">

        {/* Head */}
        <thead>
          <tr className="border-b border-[#1B2B4B]/8 bg-[#F5F0E8]/50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={[
                  "px-5 py-2.5",
                  "text-[11px] font-semibold uppercase tracking-wider text-[#5C6B88]",
                  alignClass[col.align ?? "left"],
                ].join(" ")}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-[#1B2B4B]/5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-12 text-center text-sm text-[#5C6B88]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  "transition-colors duration-100",
                  onRowClick
                    ? "cursor-pointer hover:bg-[#FAF8F4]"
                    : "hover:bg-[#FAF8F4]/60",
                ].join(" ")}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={[
                      "px-5 py-3 text-[#1B2B4B]",
                      alignClass[col.align ?? "left"],
                    ].join(" ")}
                  >
                    {col.render
                      ? col.render(row[col.key as keyof T], row)
                      : (row[col.key as keyof T] as React.ReactNode) ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}