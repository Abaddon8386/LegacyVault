import {
  Coins,
  Layers,
  Home,
  Landmark,
  Car,
  TrendingUp,
  Gem,
  Package,
} from 'lucide-react'
import './AssetSummaryCards.css'

export function AssetSummaryCards({ assets, t }) {
  // TODO(mock): Total valuation aggregate will be computed by backend summary API
  const totalValue = assets.reduce(
    (sum, a) => sum + (Number(a.estimatedValue) || 0),
    0
  )

  // TODO(mock): Category distribution counts will be provided by backend summary API
  const countsByCategory = assets.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1
    return acc
  }, {})

  function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('vi-VN').format(amount)
    return `${formatted} đ`
  }

  const categoryIcons = {
    REAL_ESTATE: <Home size={14} />,
    BANK_ACCOUNT: <Landmark size={14} />,
    VEHICLE: <Car size={14} />,
    SECURITIES: <TrendingUp size={14} />,
    PRECIOUS_ITEM: <Gem size={14} />,
    OTHER: <Package size={14} />,
  }

  const totalAssets = assets.length

  return (
    <div className="lv-summary-cards-grid">
      {/* Card 1: Total Value */}
      <div className="lv-stat-card">
        <div className="lv-stat-card__icon lv-stat-card__icon--gold">
          <Coins size={20} />
        </div>
        <div className="lv-stat-card__content">
          <span className="lv-stat-card__label">{t.assets.stats.totalValue}</span>
          <span className="lv-stat-card__value lv-tabular-num">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Card 2: Total Count */}
      <div className="lv-stat-card">
        <div className="lv-stat-card__icon lv-stat-card__icon--forest">
          <Layers size={20} />
        </div>
        <div className="lv-stat-card__content">
          <span className="lv-stat-card__label">{t.assets.stats.totalCount}</span>
          <div className="lv-stat-card__count-row">
            <span className="lv-stat-card__value lv-tabular-num">{totalAssets}</span>
            <span className="lv-stat-card__unit">{t.assets.stats.items}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Distribution by Category */}
      <div className="lv-stat-card lv-stat-card--distribution">
        <div className="lv-stat-card__content lv-distribution-content">
          <span className="lv-stat-card__label">{t.assets.stats.distribution}</span>

          {totalAssets === 0 ? (
            <span className="lv-dist-empty">—</span>
          ) : (
            <div className="lv-dist-pills-row">
              {Object.entries(countsByCategory).map(([cat, count]) => {
                const label = t.assets.types[cat] || cat
                const icon = categoryIcons[cat] || <Package size={14} />
                const percent = Math.round((count / totalAssets) * 100)
                return (
                  <div key={cat} className="lv-dist-pill" title={`${label}: ${count} (${percent}%)`}>
                    <span className="lv-dist-pill__icon">{icon}</span>
                    <span className="lv-dist-pill__name">{label}</span>
                    <span className="lv-dist-pill__count lv-tabular-num">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
