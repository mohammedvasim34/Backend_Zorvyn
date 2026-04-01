import './StatsCard.css'

export default function StatsCard({ title, value, icon: Icon, type = 'default', prefix = '' }) {
  return (
    <div className={`stats-card glass-card slide-up stats-card--${type}`} >
      <div className="stats-card__header">
        <span className="stats-card__title">{title}</span>
        <div className={`stats-card__icon stats-card__icon--${type}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stats-card__value">
        {prefix}
        {typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
      </div>
      <div className={`stats-card__bar stats-card__bar--${type}`} />
    </div>
  )
}
