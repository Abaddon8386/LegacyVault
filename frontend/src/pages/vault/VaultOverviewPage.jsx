import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchVault,
  createVault,
  VAULT_SCENARIOS,
} from '../../utils/vaultService.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import CreateVaultModal from '../../components/vault/CreateVaultModal.jsx';
import LivingHeritageWave from '../../components/vault/LivingHeritageWave.jsx';
import './VaultOverviewPage.css';

const formatVaultId = (rawId) => {
  if (!rawId) return '#VLT-0001';
  const cleanId = String(rawId).replace(/^vlt-/, '').toUpperCase();
  return cleanId.startsWith('#') ? cleanId : `#VLT-${cleanId}`;
};

export default function VaultOverviewPage({
  lang = 'vi',
  showDevToolbar = false,
  onNavigateToLogin,
  onRefreshTrigger,
}) {
  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('exists');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedId, setCopiedId] = useState(false);
  const heroCardRef = useRef(null);

  const handleCopyId = useCallback(async (idToCopy) => {
    if (!idToCopy) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(String(idToCopy));
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = String(idToCopy);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Graceful fallback
    }
  }, []);

  // Hero Card background cursor spotlight handler — purely decorative background layer
  const handleHeroMouseMove = useCallback((e) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = heroCardRef.current;
    if (!el) return;

    // Detect if cursor is over the artwork column to cleanly separate hover scopes
    const artworkCol = el.querySelector('.lv-hero-artwork-col');
    if (artworkCol) {
      const artRect = artworkCol.getBoundingClientRect();
      if (
        e.clientX >= artRect.left &&
        e.clientX <= artRect.right &&
        e.clientY >= artRect.top &&
        e.clientY <= artRect.bottom
      ) {
        // Cursor is inside artwork panel -> fade out hero card spotlight so no overlap occurs
        el.style.setProperty('--spotlight-opacity', '0');
        return;
      }
    }

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
    el.style.setProperty('--spotlight-opacity', '1');
  }, []);

  const handleHeroMouseEnter = useCallback((e) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const el = heroCardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    el.style.setProperty('--spotlight-opacity', '1');
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    const el = heroCardRef.current;
    if (!el) return;
    el.style.setProperty('--spotlight-opacity', '0');
  }, []);

  useEffect(() => {
    let ignore = false;
    const scenario = (import.meta.env.DEV && showDevToolbar) ? selectedScenario : 'exists';

    fetchVault({ scenario, isDevPreview: showDevToolbar, lang })
      .then((data) => {
        if (!ignore) {
          setVault(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setVault(null);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showDevToolbar, selectedScenario, lang, onRefreshTrigger, refreshKey]);

  const handleManualRetry = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCreateVaultSubmit = async (formData) => {
    setIsModalOpen(false);
    const created = await createVault(formData, {
      isDevPreview: showDevToolbar,
      scenario: 'success',
      lang,
    });
    setVault(created);
    setSelectedScenario('exists');
    setNotification(
      lang === 'en'
        ? 'Heritage vault initialized successfully (Status ACTIVE).'
        : 'Kho di sản số đã được khởi tạo thành công (Trạng thái ACTIVE).'
    );
    setTimeout(() => setNotification(''), 4000);
  };

  const handleScenarioChange = (e) => {
    const sc = e.target.value;
    setSelectedScenario(sc);
    if (sc === 'create_modal' || sc === 'validation_error') {
      setIsModalOpen(true);
      setLoading(false);
    } else {
      setIsModalOpen(false);
      setLoading(true);
    }
  };

  const content = {
    vi: {
      overviewEyebrow: 'KHO DI SẢN SỐ',
      vaultIdLabel: 'Mã định danh kho:',
      createdLabel: 'Khởi tạo:',
      ownerRoleLabel: 'Chủ sở hữu:',
      ownerRoleVal: 'Chủ sở hữu cá nhân',
      securityLabel: 'Bảo vệ dữ liệu:',
      overviewHeading: 'Tổng quan Kho di sản',
      statusHeading: 'Trạng thái vận hành:',
      createAnotherNotice:
        'Chính sách hệ thống: Mỗi tài khoản chỉ sở hữu duy nhất 01 kho di sản số cá nhân.',
      scenarioSelectLabel: 'Kịch bản kiểm thử giao diện:',
      scenarioNotice:
        'Công cụ hỗ trợ kiểm thử các trạng thái giao diện trong môi trường phát triển (?preview=true).',
    },
    en: {
      overviewEyebrow: 'HERITAGE VAULT',
      vaultIdLabel: 'Vault ID:',
      createdLabel: 'Initialized:',
      ownerRoleLabel: 'Ownership:',
      ownerRoleVal: 'Personal Vault Owner',
      securityLabel: 'Data Protection:',
      overviewHeading: 'Heritage Sanctuary Overview',
      statusHeading: 'Operational Status:',
      createAnotherNotice:
        'System policy: Each account is permitted strictly one personal digital heritage vault.',
      scenarioSelectLabel: 'UI Test Scenario:',
      scenarioNotice:
        'Development utility for reviewing interface states (?preview=true).',
    },
  };

  const t = content[lang] || content.vi;

  return (
    <div className="lv-vault-page">
      {/* Dev Simulation Toolbar — Chỉ hiển thị khi DEV và có tham số ?preview=true */}
      {Boolean(import.meta.env.DEV && showDevToolbar) && (
        <aside className="lv-dev-toolbar" aria-label="Bộ điều khiển kịch bản thử nghiệm">
          <div className="lv-dev-toolbar-inner">
            <label htmlFor="lv-scenario-picker" className="lv-dev-label">
              <span className="lv-dev-icon" aria-hidden="true">⚙</span>
              <span>{t.scenarioSelectLabel}</span>
            </label>
            <select
              id="lv-scenario-picker"
              className="lv-dev-select"
              value={selectedScenario}
              onChange={handleScenarioChange}
            >
              {VAULT_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {lang === 'vi' ? sc.labelVi : sc.labelEn}
                </option>
              ))}
            </select>
            <span className="lv-dev-subnote">{t.scenarioNotice}</span>
          </div>
        </aside>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="lv-toast-alert" role="status" aria-live="polite">
          <span className="lv-toast-check" aria-hidden="true">✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Dynamic View States */}
      {loading ? (
        <LoadingState lang={lang} />
      ) : error ? (
        <ErrorState
          error={error}
          lang={lang}
          onRetry={handleManualRetry}
          onNavigateToLogin={onNavigateToLogin}
          onCreateVault={() => {
            setSelectedScenario('create_modal');
            setIsModalOpen(true);
          }}
        />
      ) : !vault ? (
        <EmptyState
          lang={lang}
          onCreateVault={() => {
            setSelectedScenario('create_modal');
            setIsModalOpen(true);
          }}
        />
      ) : (
        /* Vault Exists: Rich Editorial Sanctuary Centerpiece */
        <div className="lv-vault-view">
          {/* Main Heritage Sanctuary Hero Banner */}
          <section
            ref={heroCardRef}
            className="lv-vault-hero-card"
            aria-label="Thông tin kho di sản"
            onMouseMove={handleHeroMouseMove}
            onMouseEnter={handleHeroMouseEnter}
            onMouseLeave={handleHeroMouseLeave}
          >
            {/* Background Decorative Spotlight Layer — strictly background (z-index: 0, pointer-events: none) */}
            <div className="lv-hero-spotlight-layer" aria-hidden="true" />

            {/* Left Column: Core Editorial Metadata (z-index: 2, crisp text and badges) */}
            <div className="lv-hero-content-col">
              <div className="lv-hero-top-row">
                <div className="lv-hero-eyebrow-wrap">
                  <span className="lv-hero-eyebrow">{t.overviewEyebrow}</span>
                  {vault.isSimulation && (
                    <span className="lv-sim-tag">
                      {lang === 'en' ? 'Simulated Data' : 'Dữ liệu mô phỏng'}
                    </span>
                  )}
                </div>
                <div className="lv-hero-status-wrap">
                  <StatusBadge status={vault.status || 'ACTIVE'} lang={lang} />
                </div>
              </div>

              <h1 className="lv-vault-name">{vault.vault_name || vault.name}</h1>
              {vault.description && (
                <p className="lv-vault-description">{vault.description}</p>
              )}

              {/* Metadata Badges Bar */}
              <div className="lv-vault-meta-grid">
                <div className="lv-meta-item">
                  <span className="lv-meta-label">{t.vaultIdLabel}</span>
                  <div className="lv-meta-id-wrap">
                    <span
                      className="lv-meta-value lv-mono"
                      title={lang === 'en' ? `Full Vault ID: ${vault.id}` : `Mã kho đầy đủ: ${vault.id}`}
                    >
                      {formatVaultId(vault.id)}
                    </span>
                    <button
                      type="button"
                      className="lv-id-copy-btn"
                      onClick={() => handleCopyId(vault.id)}
                      title={
                        copiedId
                          ? (lang === 'en' ? 'Copied full ID!' : 'Đã sao chép mã đầy đủ!')
                          : (lang === 'en' ? `Copy full ID: ${vault.id}` : `Sao chép mã đầy đủ: ${vault.id}`)
                      }
                      aria-label={lang === 'en' ? 'Copy full Vault ID' : 'Sao chép mã kho đầy đủ'}
                    >
                      {copiedId ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="lv-meta-item">
                  <span className="lv-meta-label">{t.createdLabel}</span>
                  <span className="lv-meta-value">
                    {new Date(vault.created_at || '2026-10-10T08:00:00Z').toLocaleDateString(
                      lang === 'vi' ? 'vi-VN' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </span>
                </div>
                <div className="lv-meta-item">
                  <span className="lv-meta-label">{t.ownerRoleLabel}</span>
                  <span className="lv-meta-value">{t.ownerRoleVal}</span>
                </div>
                <div className="lv-meta-item">
                  <span className="lv-meta-label">{t.securityLabel}</span>
                  <span className="lv-meta-value">
                    {vault.isSimulation
                      ? (lang === 'en' ? 'Simulation (Pending PS-74 API)' : 'Mô phỏng (Chờ API PS-74)')
                      : (lang === 'en' ? 'Owner Access Policy (RBAC)' : 'Kiểm soát quyền chủ sở hữu (RBAC)')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Living Heritage Wave Artwork Panel (Scoped interactive physics) */}
            <div className="lv-hero-artwork-col">
              <LivingHeritageWave status={vault.status || 'ACTIVE'} lang={lang} />
            </div>
          </section>

          {/* 1:1 Ownership Policy Footnote — Quiet, balanced editorial policy */}
          <footer className="lv-vault-policy-footer">
            <p className="lv-policy-text">{t.createAnotherNotice}</p>
          </footer>
        </div>
      )}

      {/* Create Vault Dialog Modal */}
      <CreateVaultModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (selectedScenario === 'create_modal' || selectedScenario === 'validation_error') {
            setSelectedScenario(vault ? 'exists' : 'empty');
          }
        }}
        onSubmitVault={handleCreateVaultSubmit}
        lang={lang}
        initialShowErrors={selectedScenario === 'validation_error'}
      />
    </div>
  );
}
