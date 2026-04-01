import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const CHART_COLORS = [
  '#6c5ce7',
  '#4e8cff',
  '#00e09e',
  '#ff6b8a',
  '#ffbe0b',
  '#a78bfa',
  '#f97316',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export function CategoryDoughnut({ categoryTotals = [] }) {
  if (!categoryTotals.length) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <p>No category data yet</p>
      </div>
    )
  }

  const data = {
    labels: categoryTotals.map((c) => c.category),
    datasets: [
      {
        data: categoryTotals.map((c) => c.total),
        backgroundColor: categoryTotals.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: 'rgba(6, 6, 15, 0.8)',
        borderWidth: 3,
        hoverBorderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#8888aa',
          font: { family: 'Inter', size: 12, weight: 500 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(14, 14, 35, 0.95)',
        titleColor: '#eaeaff',
        bodyColor: '#8888aa',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'Inter', weight: 600 },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: (ctx) => ` $${ctx.parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      },
    },
  }

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Doughnut data={data} options={options} />
    </div>
  )
}

export function IncomeExpenseBar({ totalIncome = 0, totalExpenses = 0 }) {
  const data = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['rgba(0, 224, 158, 0.7)', 'rgba(255, 107, 138, 0.7)'],
        borderColor: ['#00e09e', '#ff6b8a'],
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 48,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(14, 14, 35, 0.95)',
        titleColor: '#eaeaff',
        bodyColor: '#8888aa',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'Inter', weight: 600 },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: (ctx) => ` $${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8888aa', font: { family: 'Inter', weight: 600, size: 12 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#555570',
          font: { family: 'Inter', size: 11 },
          callback: (v) => `$${v.toLocaleString()}`,
        },
        border: { display: false },
      },
    },
  }

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  )
}
