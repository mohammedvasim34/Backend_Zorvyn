import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarRange,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Users,
  AlertTriangle,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI } from '../api/client'
import {
  AnomalyBar,
  CategoryDoughnut,
  IncomeExpenseBar,
  MonthlyTrendLine,
  TopCategoriesBar,
} from '../components/Charts'
import toast from 'react-hot-toast'
import './AnalystPage.css'

export default function AnalystPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [trends, setTrends] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [insightsRes, trendsRes, categoryBreakdownRes, topCategoriesRes, recentRes] = await Promise.all([
        dashboardAPI.insights(),
        dashboardAPI.trends(),
        dashboardAPI.categoryBreakdown(),
        dashboardAPI.topCategories(),
        dashboardAPI.recent(),
      ])

      setInsights(insightsRes.data)
      setTrends(trendsRes.data)
      setCategoryBreakdown(categoryBreakdownRes.data)
      setTopCategories(topCategoriesRes.data)
      setRecentTransactions(recentRes.data)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load analyst analytics')
    } finally {
      setLoading(false)
    }
  }

  const getLast30DaysRange = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)

    const toIsoDate = (d) => d.toISOString().split('T')[0]
    return {
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
    }
  }

  const goToRecordsWithQuery = (query) => {
    const params = new URLSearchParams(query)
    navigate(`/records?${params.toString()}`)
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
          <h1>Analyst</h1>
          <p>Dedicated operations for analytics and filtered record views</p>
        </div>
      </div>

      <div className="analyst-grid">
        <div className="glass-card analyst-card slide-up">
          <h3>Financial Insights</h3>
          <p>High-level metrics generated from your analytics endpoints.</p>
          <div className="analyst-metrics">
            <div className="metric-item">
              <span className="metric-label"><TrendingUp size={14} /> Income</span>
              <strong>${(insights?.total_income || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="metric-item">
              <span className="metric-label"><TrendingDown size={14} /> Expense</span>
              <strong>${(insights?.total_expense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="metric-item">
              <span className="metric-label"><Wallet size={14} /> Net Balance</span>
              <strong>${(insights?.net_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="metric-item">
              <span className="metric-label">Savings %</span>
              <strong>{(insights?.savings_percentage || 0).toFixed(2)}%</strong>
            </div>
          </div>
          <div className="trend-note">
            Current month expense: <strong>${(insights?.trend_comparison?.current_month_expense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            {' · '}
            Previous month: <strong>${(insights?.trend_comparison?.previous_month_expense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="glass-card analyst-card slide-up">
          <h3>Top Spending Categories</h3>
          <p>Top 5 categories by total expense amount.</p>
          {topCategories.length ? (
            <div className="simple-list">
              {topCategories.map((item) => (
                <div key={item.category} className="simple-list__item">
                  <span>{item.category}</span>
                  <strong>${Number(item.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No category data found.</p></div>
          )}
        </div>

        <div className="glass-card analyst-card slide-up analyst-card--wide">
          <h3>Visual Breakdown</h3>
          <p>Chart view for category distribution and income vs expense comparison.</p>
          <div className="analyst-charts-grid">
            <div className="analyst-chart-box">
              <CategoryDoughnut
                categoryTotals={categoryBreakdown.map((item) => ({
                  category: item.category,
                  total: Number(item.total_amount || 0),
                }))}
              />
            </div>
            <div className="analyst-chart-box">
              <IncomeExpenseBar
                totalIncome={Number(insights?.total_income || 0)}
                totalExpenses={Number(insights?.total_expense || 0)}
              />
            </div>
          </div>
        </div>

        <div className="glass-card analyst-card slide-up analyst-card--wide">
          <h3>Trend Visuals</h3>
          <p>Line and bar views for monthly momentum and highest expense categories.</p>
          <div className="analyst-charts-grid">
            <div className="analyst-chart-box">
              <MonthlyTrendLine trends={trends} />
            </div>
            <div className="analyst-chart-box">
              <TopCategoriesBar categories={topCategories} />
            </div>
          </div>
        </div>

        <div className="glass-card analyst-card slide-up">
          <h3>Monthly Trends</h3>
          <p>Income vs expense grouped by month.</p>
          {trends.length ? (
            <div className="simple-list">
              {trends.map((row) => (
                <div key={row.month} className="simple-list__item simple-list__item--stack">
                  <span>{new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span>
                    Income: <strong>${Number(row.total_income).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                    {' · '}
                    Expense: <strong>${Number(row.total_expense).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No trend data found.</p></div>
          )}
        </div>

        <div className="glass-card analyst-card slide-up">
          <h3><AlertTriangle size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Anomalies</h3>
          <p>Expense transactions where amount is greater than 2x average expense.</p>
          <div style={{ marginBottom: 12 }}>
            <AnomalyBar anomalies={insights?.anomalies || []} />
          </div>
          {insights?.anomalies?.length ? (
            <div className="simple-list">
              {insights.anomalies.map((tx) => (
                <div key={tx.id} className="simple-list__item simple-list__item--stack">
                  <span>{tx.category} · {new Date(tx.date).toLocaleDateString()}</span>
                  <strong>${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No anomalies detected.</p></div>
          )}
        </div>

        <div className="glass-card analyst-card slide-up analyst-card--wide">
          <h3>Recent Transactions</h3>
          <p>Last 10 transactions sorted by date.</p>
          {recentTransactions.length ? (
            <div className="simple-list">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="simple-list__item">
                  <span>{tx.category} · {tx.type} · {new Date(tx.date).toLocaleDateString()}</span>
                  <strong>${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No transactions found.</p></div>
          )}
        </div>

        <div className="glass-card analyst-card slide-up">
          <h3>Time-based Analysis</h3>
          <p>Open records already filtered for recent windows.</p>
          <div className="analyst-card__actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                const { startDate, endDate } = getLast30DaysRange()
                goToRecordsWithQuery({
                  page: '1',
                  start_date: startDate,
                  end_date: endDate,
                })
              }}
            >
              <CalendarRange size={16} />
              Last 30 Days
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const now = new Date()
                const start = new Date(now.getFullYear(), now.getMonth(), 1)
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                goToRecordsWithQuery({
                  page: '1',
                  start_date: start.toISOString().split('T')[0],
                  end_date: end.toISOString().split('T')[0],
                })
              }}
            >
              <Filter size={16} />
              Current Month
            </button>
          </div>
        </div>

        <div className="glass-card analyst-card slide-up">
          <h3>Type-based Analysis</h3>
          <p>Jump directly to income or expense focused datasets.</p>
          <div className="analyst-card__actions">
            <button
              className="btn btn-secondary"
              onClick={() => goToRecordsWithQuery({ page: '1', type: 'income' })}
            >
              <ArrowUpRight size={16} />
              Income Only
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => goToRecordsWithQuery({ page: '1', type: 'expense' })}
            >
              <ArrowDownRight size={16} />
              Expense Only
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => goToRecordsWithQuery({ page: '1' })}
            >
              <Filter size={16} />
              All Records
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="glass-card analyst-card slide-up">
            <h3>Admin Controls</h3>
            <p>Analyst + admin workflow shortcuts.</p>
            <div className="analyst-card__actions">
              <button className="btn btn-primary" onClick={() => navigate('/users')}>
                <Users size={16} />
                Manage Users
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}