import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Filter,
  Info,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react'
import { assetService } from '../../services/assetService'
import { DEFAULT_MOCK_VAULT_ID } from '../../mocks/assetMock'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { AssetListTable } from '../../components/assets/AssetListTable'
import { AssetFormModal } from '../../components/assets/AssetFormModal'
import { AssetSummaryCards } from '../../components/assets/AssetSummaryCards'
import './AssetManagementPage.css'

const LEGAL_DISMISSED_KEY = 'legacyvault_legal_notice_dismissed'

/**
 * AssetManagementPage — PS-5: Add asset + view asset list (Contract Aligned).
 * Loads assets on mount, shows loading/error/empty states.
 * Allows adding a new asset via a validated form modal with write-only payload.
 */
export function AssetManagementPage({ t }) {
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssetType, setSelectedAssetType] = useState('ALL')

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Legal Notice collapsible behavior
  const [isLegalDismissed, setIsLegalDismissed] = useState(() => {
    try {
      return localStorage.getItem(LEGAL_DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [showLegalInfoModal, setShowLegalInfoModal] = useState(false)

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }, [])

  const loadAssets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await assetService.getAssets(DEFAULT_MOCK_VAULT_ID)
      setAssets(data)
    } catch {
      setError(t.assets.alerts.loadError)
    } finally {
      setIsLoading(false)
    }
  }, [t.assets.alerts.loadError])

  useEffect(() => {
    let isMounted = true
    async function fetchInitialData() {
      try {
        const data = await assetService.getAssets(DEFAULT_MOCK_VAULT_ID)
        if (isMounted) {
          setAssets(data)
          setIsLoading(false)
        }
      } catch {
        if (isMounted) {
          setError(t.assets.alerts.loadError)
          setIsLoading(false)
        }
      }
    }
    fetchInitialData()
    return () => {
      isMounted = false
    }
  }, [t.assets.alerts.loadError])

  function handleDismissLegalNotice() {
    setIsLegalDismissed(true)
    try {
      localStorage.setItem(LEGAL_DISMISSED_KEY, 'true')
    } catch {
      // Ignore
    }
  }

  async function handleAddAsset(formData) {
    setIsSubmitting(true)
    try {
      const created = await assetService.createAsset(DEFAULT_MOCK_VAULT_ID, formData)
      setAssets((prev) => [created, ...prev])
      setIsAddModalOpen(false)
      showToast(t.assets.alerts.addSuccess, 'success')
    } catch {
      showToast(t.assets.alerts.saveError, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Client-side filtering by assetType and searching by name/description
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesType =
        selectedAssetType === 'ALL' || asset.assetType === selectedAssetType
      const query = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !query ||
        (asset.name && asset.name.toLowerCase().includes(query)) ||
        (asset.description && asset.description.toLowerCase().includes(query))
      return matchesType && matchesQuery
    })
  }, [assets, selectedAssetType, searchQuery])

  const hasAnyAssets = assets.length > 0
  const isSearchNoResults = hasAnyAssets && filteredAssets.length === 0

  return (
    <div className="lv-asset-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`lv-toast lv-toast--${toastMessage.type}`}
          role="status"
          aria-live="polite"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="lv-page-header">
        <div className="lv-page-header__left">
          <div className="lv-page-title-row">
            <h1 className="lv-page-title">{t.assets.title}</h1>
            {isLegalDismissed && (
              <button
                type="button"
                className="lv-info-pill-btn"
                onClick={() => setShowLegalInfoModal(true)}
                title={t.assets.noticeInfoTooltip}
                aria-label={t.assets.noticeInfoTooltip}
              >
                <Info size={16} />
              </button>
            )}
          </div>
          <p className="lv-page-subtitle">{t.assets.subtitle}</p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="lv-add-btn"
        >
          <Plus size={18} />
          <span className="lv-add-btn__text">{t.assets.addNewBtn}</span>
        </Button>
      </div>

      {/* Collapsible Legal Notice */}
      {!isLegalDismissed && (
        <div className="lv-legal-notice-banner">
          <div className="lv-legal-notice-banner__content">
            <Info size={18} className="lv-notice-icon" />
            <p>{t.assets.notice}</p>
          </div>
          <button
            type="button"
            className="lv-legal-dismiss-btn"
            onClick={handleDismissLegalNotice}
          >
            <span>{t.assets.noticeDismiss}</span>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary Cards — reflect filtered data */}
      {!isLoading && !error && hasAnyAssets && (
        <AssetSummaryCards assets={filteredAssets} t={t} />
      )}

      {/* Filter and Search Bar */}
      <div className="lv-filter-bar">
        <div className="lv-search-box">
          <Search size={16} className="lv-search-icon" />
          <input
            type="text"
            className="lv-search-input"
            placeholder={t.assets.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="lv-category-filter">
          <Filter size={15} className="lv-filter-icon" />
          <select
            className="lv-category-select"
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            aria-label={t.assets.filterAria}
          >
            <option value="ALL">{t.assets.filterAll}</option>
            <option value="TEXT">{t.assets.types.TEXT}</option>
            <option value="CREDENTIAL">{t.assets.types.CREDENTIAL}</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="lv-loading-card" role="status" aria-live="polite">
          <div className="lv-skeleton-spinner" />
          <p>{t.assets.loadingText}</p>
        </div>
      ) : error ? (
        <div className="lv-error-card" role="alert">
          <AlertTriangle size={32} className="lv-error-icon" />
          <h3>{t.assets.errorTitle}</h3>
          <p>{error}</p>
          <Button variant="secondary" onClick={loadAssets}>
            <RefreshCw size={14} />
            <span>{t.assets.alerts.retryBtn}</span>
          </Button>
        </div>
      ) : !hasAnyAssets ? (
        <div className="lv-empty-card">
          <div className="lv-empty-icon-wrap">
            <FolderOpen size={36} />
          </div>
          <h2 className="lv-empty-title">{t.assets.emptyTitle}</h2>
          <p className="lv-empty-desc">{t.assets.emptyDesc}</p>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>{t.assets.emptyAction}</span>
          </Button>
        </div>
      ) : isSearchNoResults ? (
        <div className="lv-empty-card">
          <div className="lv-empty-icon-wrap">
            <Search size={32} />
          </div>
          <h2 className="lv-empty-title">{t.assets.noMatchTitle}</h2>
          <p className="lv-empty-desc">{t.assets.noMatchDesc}</p>
          <div className="lv-empty-actions-row">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedAssetType('ALL')
              }}
            >
              {t.assets.clearFilter}
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} />
              <span>{t.assets.emptyAction}</span>
            </Button>
          </div>
        </div>
      ) : (
        <AssetListTable assets={filteredAssets} t={t} />
      )}

      {/* Floating Action Button for mobile */}
      <button
        type="button"
        className="lv-mobile-fab"
        onClick={() => setIsAddModalOpen(true)}
        aria-label={t.assets.addNewBtn}
      >
        <Plus size={24} />
      </button>

      {/* Legal Notice Info Modal */}
      <Modal
        isOpen={showLegalInfoModal}
        onClose={() => setShowLegalInfoModal(false)}
        title={t.assets.legalNoticeModalTitle}
      >
        <div className="lv-legal-modal-body">
          <Info size={28} className="lv-notice-icon" />
          <p>{t.assets.notice}</p>
        </div>
        <div className="lv-modal-actions-right">
          <Button variant="primary" onClick={() => setShowLegalInfoModal(false)}>
            {t.assets.noticeDismiss}
          </Button>
        </div>
      </Modal>

      {/* Add Asset Modal */}
      <AssetFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddAsset}
        t={t}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
