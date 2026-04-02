import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { recordsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import RecordTable from '../components/RecordTable'
import RecordForm from '../components/RecordForm'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RecordsPage() {
  const { user, isAdmin } = useAuth()
  const normalizedRole = String(user?.role || '')
    .toLowerCase()
    .split('.')
    .pop()
  const canManageRecords = isAdmin || normalizedRole === 'viewer'
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // Filters
  const [filterType, setFilterType] = useState(searchParams.get('type') || '')
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '')
  const [filterStartDate, setFilterStartDate] = useState(searchParams.get('start_date') || '')
  const [filterEndDate, setFilterEndDate] = useState(searchParams.get('end_date') || '')

  // Modal
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize }
      if (filterType) params.type = filterType
      if (filterCategory) params.category = filterCategory
      if (filterStartDate) params.start_date = filterStartDate
      if (filterEndDate) params.end_date = filterEndDate

      const res = await recordsAPI.list(params)
      setRecords(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      toast.error('Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterCategory, filterStartDate, filterEndDate])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const totalPages = Math.ceil(total / pageSize)

  const handleCreate = async (payload) => {
    try {
      await recordsAPI.create(payload)
      toast.success('Record created')
      setShowForm(false)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create')
    }
  }

  const handleUpdate = async (payload) => {
    try {
      await recordsAPI.update(editingRecord.id, payload)
      toast.success('Record updated')
      setEditingRecord(null)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await recordsAPI.delete(id)
      toast.success('Record deleted')
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
  }

  const resetFilters = () => {
    setFilterType('')
    setFilterCategory('')
    setFilterStartDate('')
    setFilterEndDate('')
    setPage(1)
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Records</h1>
          <p>{total} transaction{total !== 1 ? 's' : ''} found</p>
        </div>
        {canManageRecords && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            id="add-record-btn"
          >
            <Plus size={18} />
            Add Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar glass-card" style={{ padding: '20px' }}>
        <div className="input-group">
          <label htmlFor="filter-type">Type</label>
          <select
            id="filter-type"
            className="input-field"
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="filter-category">Category</label>
          <input
            id="filter-category"
            className="input-field"
            type="text"
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
            placeholder="e.g. Salary"
          />
        </div>

        <div className="input-group">
          <label htmlFor="filter-start-date">From</label>
          <input
            id="filter-start-date"
            className="input-field"
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(1) }}
          />
        </div>

        <div className="input-group">
          <label htmlFor="filter-end-date">To</label>
          <input
            id="filter-end-date"
            className="input-field"
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(1) }}
          />
        </div>

        <button className="btn btn-secondary" onClick={resetFilters} style={{ alignSelf: 'flex-end' }}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '4px 0' }}>
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : (
          <RecordTable
            records={records}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canManageRecords={canManageRecords}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                className={page === pageNum ? 'active' : ''}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          })}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <RecordForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <RecordForm
          record={editingRecord}
          onSubmit={handleUpdate}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  )
}
