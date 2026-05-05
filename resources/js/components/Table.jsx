// src/components/ui/Table.jsx
const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};
// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ cols }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-5 py-3">
                    <div
                        className="h-4 animate-pulse rounded bg-[#EDE5D8]/80"
                        style={{ width: `${55 + (i % 4) * 12}%` }}
                    />
                </td>
            ))}
        </tr>
    );
}
// ── Table ─────────────────────────────────────────────────────────────────────
export default function Table({
    columns,
    data,
    keyField,
    loading = false,
    emptyText = 'No records found.',
    onRowClick,
    className = '',
}) {
    return (
        <div className={['w-full overflow-x-auto', className].join(' ')}>
            <table className="w-full border-collapse text-sm">
                {/* Head */}
                <thead>
                    <tr className="border-b border-[#1B2B4B]/8 bg-[#F5F0E8]/50">
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                style={
                                    col.width ? { width: col.width } : undefined
                                }
                                className={[
                                    'px-5 py-2.5',
                                    'text-[11px] font-semibold tracking-wider text-[#5C6B88] uppercase',
                                    alignClass[col.align ?? 'left'],
                                ].join(' ')}
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
                                onClick={
                                    onRowClick
                                        ? () => onRowClick(row)
                                        : undefined
                                }
                                className={[
                                    'transition-colors duration-100',
                                    onRowClick
                                        ? 'cursor-pointer hover:bg-[#FAF8F4]'
                                        : 'hover:bg-[#FAF8F4]/60',
                                ].join(' ')}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className={[
                                            'px-5 py-3 text-[#1B2B4B]',
                                            alignClass[col.align ?? 'left'],
                                        ].join(' ')}
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : (row[col.key] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
