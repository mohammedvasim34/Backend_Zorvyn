import { useEffect, useState } from 'react'
import { dashboardAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import StatsCard from '../components/StatsCard'
import { CategoryDoughnut, IncomeExpenseBar } from '../components/Charts'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const res = await dashboardAPI.summary(10)
      setSummary(res.data)
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back, <strong>{user?.email}</strong>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stagger-children">
        <StatsCard
          title="Total Income"
          value={summary?.total_income || 0}
          icon={TrendingUp}
          type="income"
          prefix="$"
        />
        <StatsCard
          title="Total Expenses"
          value={summary?.total_expenses || 0}
          icon={TrendingDown}
          type="expense"
          prefix="$"
        />
        <StatsCard
          title="Net Balance"
          value={summary?.net_balance || 0}
          icon={Wallet}
          type="balance"
          prefix="$"
        />
      </div>

      {/* Charts */}
      <div className="content-grid">
        <div className="glass-card chart-card slide-up">
          <h3 className="chart-card__title">Spending by Category</h3>
          <CategoryDoughnut categoryTotals={summary?.category_totals || []} />
        </div>
        <div className="glass-card chart-card slide-up">
          <h3 className="chart-card__title">Income vs Expenses</h3>
          <IncomeExpenseBar
            totalIncome={summary?.total_income || 0}
            totalExpenses={summary?.total_expenses || 0}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card recent-card slide-up">
        <h3 className="chart-card__title" style={{ marginBottom: '20px' }}>
          Recent Transactions
        </h3>
        {summary?.recent_transactions?.length ? (
          <div className="recent-list">
            {summary.recent_transactions.map((tx) => (
              <div key={tx.id} className="recent-item">
                <div className="recent-item__left">
                  <div
                    className={`recent-item__icon ${
                      tx.type === 'income' ? 'icon-income' : 'icon-expense'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                  </div>
                  <div>
                    <div className="recent-item__category">{tx.category}</div>
                    <div className="recent-item__date">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {tx.notes && ` · ${tx.notes}`}
                    </div>
                  </div>
                </div>
                <div
                  className={`recent-item__amount ${
                    tx.type === 'income' ? 'amount-income' : 'amount-expense'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}$
                  {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet. Add your first record!</p>
          </div>
        )}
      </div>
    </div>
  )
}
