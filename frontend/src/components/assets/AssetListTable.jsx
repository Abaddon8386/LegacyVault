import { useState, useEffect, useRef } from 'react'
import {
  Home,
  Landmark,
  Car,
  TrendingUp,
  Gem,
  Package,
  FileText,
  Calendar,
  MoreVertical,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import './AssetListTable.css'

/**
 * AssetListTable — PS-5: List (view) assets only.
 * Supports sorting, pagination, and a detail view modal.
 * Edit and Delete actions are NOT in scope for PS-5.
 */
export function AssetListTable({ assets, t }) {
  const [assetDetail, setAssetDetail] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Sorting state
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const menuRef = useRef(null)

  // Close context menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // TODO(mock): Client-side sorting is temporary; backend will provide pre-sorted data via query params
  const sortedAssets = [...assets].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (sortField === 'estimatedValue') {
      aVal = Number(aVal) || 0
      bVal = Number(bVal) || 0
    } else if (sortField === 'name') {
      aVal = (aVal || '').toLowerCase()
      bVal = (bVal || '').toLowerCase()
    } else if (sortField === 'createdAt') {
      aVal = new Date(aVal || 0).getTime()
      bVal = new Date(bVal || 0).getTime()
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // TODO(mock): Pagination slicing is temporary; backend will provide paginated result set (page, size, totalElements)
  const totalItems = sortedAssets.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedAssets = sortedAssets.slice(startIndex, startIndex + pageSize)

  function getCategoryMeta(category) {
    switch (category) {
      case 'REAL_ESTATE':
        return { icon: <Home size={15} />, label: t.assets.types.REAL_ESTATE, badgeClass: 'lv-badge--forest' }
      case 'BANK_ACCOUNT':
        return { icon: <Landmark size={15} />, label: t.assets.types.BANK_ACCOUNT, badgeClass: 'lv-badge--gold' }
      case 'VEHICLE':
        return { icon: <Car size={15} />, label: t.assets.types.VEHICLE, badgeClass: 'lv-badge--sand' }
      case 'SECURITIES':
        return { icon: <TrendingUp size={15} />, label: t.assets.types.SECURITIES, badgeClass: 'lv-badge--blue' }
      case 'PRECIOUS_ITEM':
        return { icon: <Gem size={15} />, label: t.assets.types.PRECIOUS_ITEM, badgeClass: 'lv-badge--gold' }
      default:
        return { icon: <Package size={15} />, label: t.assets.types.OTHER, badgeClass: 'lv-badge--neutral' }
    }
  }

  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '—'
    const formatted = new Intl.NumberFormat('vi-VN').format(amount)
    return `${formatted} đ`
  }

  function formatDate(isoString) {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  function renderSortIcon(field) {
    if (sortField !== field) return <ArrowUpDown size={13} className="lv-sort-icon lv-sort-icon--idle" />
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} className="lv-sort-icon lv-sort-icon--active" />
    ) : (
      <ArrowDown size={13} className="lv-sort-icon lv-sort-icon--active" />
    )
  }

  return (
    <>
      <div className="lv-table-wrapper" ref={menuRef}>
        {/* Desktop & Tablet Table View */}
        <div className="lv-table-container">
          <table className="lv-table" aria-label={t.assets.title}>
            <thead>
              <tr>
                <th scope="col" className="lv-th-sortable" onClick={() => handleSort('name')}>
                  <div className="lv-th-content">
                    <span>{t.assets.colName}</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                <th scope="col">{t.assets.colCategory}</th>

                <th
                  scope="col"
                  className="lv-th-right lv-th-sortable"
                  onClick={() => handleSort('estimatedValue')}
                >
                  <div className="lv-th-content lv-th-content--right">
                    <span>{t.assets.colEstimatedValue}</span>
                    {renderSortIcon('estimatedValue')}
                  </div>
                </th>

                <th scope="col" className="lv-col-tablet-hide">
                  {t.assets.colDocumentRef}
                </th>

                <th
                  scope="col"
                  className="lv-col-tablet-hide lv-th-sortable"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="lv-th-content">
                    <span>{t.assets.colDate}</span>
                    {renderSortIcon('createdAt')}
                  </div>
                </th>

                <th scope="col" className="lv-th-center">
                  {t.assets.colActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssets.map((asset) => {
                const meta = getCategoryMeta(asset.category)
                const isMenuOpen = openMenuId === asset.id

                return (
                  <tr
                    key={asset.id}
                    className="lv-table-row lv-table-row--fixed"
                    onClick={() => setAssetDetail(asset)}
                  >
                    <td className="lv-td-asset-name">
                      <span className="lv-asset-primary-title" title={asset.name}>
                        {asset.name}
                      </span>
                      {asset.description && (
                        <span className="lv-asset-subtext" title={asset.description}>
                          {asset.description}
                        </span>
                      )}

                      <div className="lv-tablet-meta-subline">
                        {asset.documentRef && (
                          <span className="lv-tablet-subitem">
                            <FileText size={12} />
                            <code>{asset.documentRef}</code>
                          </span>
                        )}
                        <span className="lv-tablet-subitem">
                          <Calendar size={12} />
                          {formatDate(asset.createdAt)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`lv-category-badge ${meta.badgeClass}`}>
                        {meta.icon}
                        <span>{meta.label}</span>
                      </span>
                    </td>

                    <td className="lv-td-right lv-asset-value lv-tabular-num">
                      {formatCurrency(asset.estimatedValue)}
                    </td>

                    <td className="lv-col-tablet-hide">
                      {asset.documentRef ? (
                        <span className="lv-doc-badge">
                          <FileText size={13} />
                          <code>{asset.documentRef}</code>
                        </span>
                      ) : (
                        <span className="lv-text-muted">—</span>
                      )}
                    </td>

                    <td className="lv-col-tablet-hide">
                      <span className="lv-date-cell">
                        <Calendar size={13} />
                        {formatDate(asset.createdAt)}
                      </span>
                    </td>

                    {/* Action dropdown — View Detail only (PS-5 scope) */}
                    <td
                      className="lv-td-center lv-td-action"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="lv-action-dropdown-wrap">
                        <button
                          type="button"
                          className={`lv-action-more-btn ${isMenuOpen ? 'lv-action-more-btn--active' : ''}`}
                          onClick={() =>
                            setOpenMenuId((prev) => (prev === asset.id ? null : asset.id))
                          }
                          aria-label={t.assets.actionMenuAria}
                          title={t.assets.actionMenuAria}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div className="lv-action-menu" role="menu">
                            <button
                              type="button"
                              className="lv-action-menu-item"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null)
                                setAssetDetail(asset)
                              }}
                            >
                              <Eye size={14} />
                              <span>{t.assets.actions.viewDetail}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lv-mobile-card-list">
          {paginatedAssets.map((asset) => {
            const meta = getCategoryMeta(asset.category)
            const isMenuOpen = openMenuId === asset.id

            return (
              <div
                key={asset.id}
                className="lv-mobile-card"
                onClick={() => setAssetDetail(asset)}
              >
                <div className="lv-mobile-card__header">
                  <div className="lv-mobile-card__title-group">
                    <span className={`lv-category-badge ${meta.badgeClass}`}>
                      {meta.icon}
                      <span>{meta.label}</span>
                    </span>
                    <span className="lv-mobile-card__name" title={asset.name}>
                      {asset.name}
                    </span>
                  </div>

                  {/* Action dropdown — View Detail only (PS-5 scope) */}
                  <div
                    className="lv-action-dropdown-wrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={`lv-action-more-btn ${isMenuOpen ? 'lv-action-more-btn--active' : ''}`}
                      onClick={() =>
                        setOpenMenuId((prev) => (prev === asset.id ? null : asset.id))
                      }
                      aria-label={t.assets.actionMenuAria}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {isMenuOpen && (
                      <div className="lv-action-menu" role="menu">
                        <button
                          type="button"
                          className="lv-action-menu-item"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            setAssetDetail(asset)
                          }}
                        >
                          <Eye size={14} />
                          <span>{t.assets.actions.viewDetail}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {asset.description && (
                  <p className="lv-mobile-card__desc" title={asset.description}>
                    {asset.description}
                  </p>
                )}

                <div className="lv-mobile-card__footer">
                  <div className="lv-mobile-card__val-block">
                    <span className="lv-mobile-card__label">{t.assets.colEstimatedValue}</span>
                    <span className="lv-mobile-card__val lv-tabular-num">
                      {formatCurrency(asset.estimatedValue)}
                    </span>
                  </div>

                  {asset.documentRef && (
                    <div className="lv-mobile-card__doc-block">
                      <span className="lv-doc-badge">
                        <FileText size={12} />
                        <code>{asset.documentRef}</code>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Bar */}
        <div className="lv-pagination-bar">
          <div className="lv-pagination-info">
            <span>
              {t.assets.pagination.showing}{' '}
              <strong>
                {totalItems === 0 ? 0 : startIndex + 1}
                {t.assets.pagination.to}
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{' '}
              {t.assets.pagination.of} <strong>{totalItems}</strong>{' '}
              {t.assets.pagination.assets}
            </span>
          </div>

          <div className="lv-pagination-controls">
            <div className="lv-page-size-selector">
              <label htmlFor="page-size-select">{t.assets.pagination.rowsPerPage}</label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="lv-page-nav-btns">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={15} />
                <span>{t.assets.pagination.prev}</span>
              </Button>
              <span className="lv-current-page-num">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>{t.assets.pagination.next}</span>
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Detail View Modal */}
      <Modal
        isOpen={!!assetDetail}
        onClose={() => setAssetDetail(null)}
        title={t.assets.detailModalTitle}
      >
        {assetDetail && (
          <div className="lv-detail-container">
            <div className="lv-detail-group">
              <span className="lv-detail-label">{t.assets.colName}</span>
              <h3 className="lv-detail-title">{assetDetail.name}</h3>
            </div>

            <div className="lv-detail-grid">
              <div className="lv-detail-group">
                <span className="lv-detail-label">{t.assets.colCategory}</span>
                <span className={`lv-category-badge ${getCategoryMeta(assetDetail.category).badgeClass}`}>
                  {getCategoryMeta(assetDetail.category).icon}
                  <span>{getCategoryMeta(assetDetail.category).label}</span>
                </span>
              </div>

              <div className="lv-detail-group">
                <span className="lv-detail-label">{t.assets.colEstimatedValue}</span>
                <span className="lv-detail-value lv-tabular-num">
                  {formatCurrency(assetDetail.estimatedValue)}
                </span>
              </div>

              <div className="lv-detail-group">
                <span className="lv-detail-label">{t.assets.colDocumentRef}</span>
                <span className="lv-detail-text">
                  {assetDetail.documentRef ? (
                    <code>{assetDetail.documentRef}</code>
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              <div className="lv-detail-group">
                <span className="lv-detail-label">{t.assets.colDate}</span>
                <span className="lv-detail-text">{formatDate(assetDetail.createdAt)}</span>
              </div>
            </div>

            <div className="lv-detail-group">
              <span className="lv-detail-label">{t.assets.colDescription}</span>
              <p className="lv-detail-desc">
                {assetDetail.description || t.assets.noDescription}
              </p>
            </div>

            <div className="lv-modal-actions-right">
              <Button variant="primary" onClick={() => setAssetDetail(null)}>
                {t.assets.closeBtn}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
