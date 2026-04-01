import { Pencil, Trash2, FileText } from 'lucide-react'

export default function RecordTable({ records = [], onEdit, onDelete, isAdmin = false }) {
  if (!records.length) {
    return (
      <div className="empty-state">
        <FileText size={48} />
        <p>No records found</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" id="records-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th>Notes</th>
            {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {new Date(r.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td>
                <span className={`badge badge-${r.type}`}>
                  {r.type === 'income' ? '↑' : '↓'} {r.type}
                </span>
              </td>
              <td>{r.category}</td>
              <td
                style={{
                  textAlign: 'right',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: r.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
                }}
              >
                {r.type === 'income' ? '+' : '-'}$
                {r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.notes || '—'}
              </td>
              {isAdmin && (
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      className="btn btn-icon btn-secondary btn-sm"
                      onClick={() => onEdit(r)}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-icon btn-danger btn-sm"
                      onClick={() => onDelete(r.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
