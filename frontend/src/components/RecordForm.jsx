import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Food', 'Transport',
  'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping',
  'Education', 'Savings', 'Other',
]

export default function RecordForm({ record = null, onSubmit, onClose }) {
  const isEdit = !!record

  const [form, setForm] = useState({
    amount: '',
    type: 'income',
    category: 'Salary',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    if (record) {
      setForm({
        amount: String(record.amount),
        type: record.type,
        category: record.category,
        date: record.date,
        notes: record.notes || '',
      })
    }
  }, [record])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      notes: form.notes || null,
    }
    onSubmit(payload)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Record' : 'New Record'}</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label htmlFor="record-amount">Amount ($)</label>
            <input
              id="record-amount"
              className="input-field"
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="record-type">Type</label>
            <select
              id="record-type"
              className="input-field"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="record-category">Category</label>
            <select
              id="record-category"
              className="input-field"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="record-date">Date</label>
            <input
              id="record-date"
              className="input-field"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="record-notes">Notes (optional)</label>
            <input
              id="record-notes"
              className="input-field"
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add a note..."
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} id="record-submit-btn">
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
