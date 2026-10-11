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
  const heroCardRef = useRef(null);

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
      overviewEyebrow: 'KHO DI SẢN SỐ ĐANG HOẠT ĐỘNG',
      vaultIdLabel: 'Mã định danh kho:',
      createdLabel: 'Khởi tạo:',
      ownerRoleLabel: 'Chủ sở hữu:',
      ownerRoleVal: 'Vault Owner (Độc quyền cá nhân)',
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
      overviewEyebrow: 'ACTIVE HERITAGE VAULT',
      vaultIdLabel: 'Vault ID:',
      createdLabel: 'Initialized:',
      ownerRoleLabel: 'Ownership:',
      ownerRoleVal: 'Vault Owner (Exclusive Individual)',
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
                <span className="lv-hero-eyebrow">
                  {t.overviewEyebrow}
                  {vault.isSimulation && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(197, 160, 89, 0.15)',
                        border: '1px solid rgba(197, 160, 89, 0.4)',
                        color: 'var(--lv-accent-gold, #c5a059)',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        display: 'inline-block',
                      }}
                    >
                      {lang === 'en' ? 'SIMULATION' : 'DỮ LIỆU MÔ PHỎNG'}
                    </span>
                  )}
                </span>
                <div className="lv-hero-status-wrap">
                  <span className="lv-hero-status-caption">{t.statusHeading}</span>
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
                  <span className="lv-meta-value lv-mono">#VLT-000{vault.id}</span>
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
