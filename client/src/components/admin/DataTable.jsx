import Spinner from '../ui/Spinner';

/**
 * Lightweight responsive table.
 * @param columns  [{ key, header, render?(row), className? }]
 * @param data     array of rows
 * @param rowKey   fn(row) → unique key
 */
export default function DataTable({ columns, data, loading, rowKey = (r) => r._id, emptyMessage = 'No records found' }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-textSecondary ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center text-textSecondary">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border transition-colors last:border-0 hover:bg-surface/60"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 text-textPrimary ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
