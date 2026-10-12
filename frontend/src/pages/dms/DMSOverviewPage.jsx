import { useState, useEffect, useCallback } from 'react';
import {
  fetchDmsConfig,
  saveDmsConfig,
  checkInDms,
  DMS_SCENARIOS,
  INTERVAL_PRESETS,
  DEFAULT_INTERVAL_DAYS,
  formatDmsDate,
  validateDmsInterval,
} from '../../utils/dmsService.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import MagneticButton from '../../components/common/MagneticButton.jsx';
import './DMSOverviewPage.css';

export default function DMSOverviewPage({
  lang = 'vi',
  showDevToolbar = false,
  onNavigateToLogin,
  onRefreshTrigger,
}) {
  const [dmsData, setDmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('monitoring');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form states
  const [intervalInput, setIntervalInput] = useState(DEFAULT_INTERVAL_DAYS);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isConfiguringNew, setIsConfiguringNew] = useState(false);

  // Check-in action states
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInNotice, setCheckInNotice] = useState('');
  const [checkInError, setCheckInError] = useState('');

  // Data fetching
  useEffect(() => {
    let ignore = false;
    const isDevPreviewActive = Boolean(import.meta.env.DEV && showDevToolbar);
    const scenario = isDevPreviewActive ? selectedScenario : undefined;

    fetchDmsConfig({ scenario, isDevPreview: isDevPreviewActive, lang })
      .then((data) => {
        if (!ignore) {
          setDmsData(data);
          if (data && data.checkIntervalDays) {
            setIntervalInput(data.checkIntervalDays);
          }
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err);
          setDmsData(null);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [showDevToolbar, selectedScenario, lang, onRefreshTrigger, refreshKey]);

  const handleManualRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleScenarioChange = (e) => {
    const sc = e.target.value;
    setSelectedScenario(sc);
    setLoading(true);
    setSaveSuccess('');
    setSaveError('');
    setCheckInNotice('');
    setCheckInError('');
    setIsConfiguringNew(false);
  };

  const handlePresetSelect = (days) => {
    setIntervalInput(days);
    setFieldErrors({});
    setSaveError('');
  };

  const handleIntervalInputChange = (e) => {
    const val = e.target.value;
    setIntervalInput(val);
    if (fieldErrors.check_interval_days) {
      const errs = validateDmsInterval(val, lang);
      setFieldErrors(errs);
    }
  };

  const handleSaveInterval = async (e) => {
    e.preventDefault();
    const errors = validateDmsInterval(intervalInput, lang);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    const isDevPreviewActive = Boolean(import.meta.env.DEV && showDevToolbar);
    const scenario = isDevPreviewActive ? selectedScenario : undefined;

    try {
      const updated = await saveDmsConfig(
        { check_interval_days: intervalInput },
        {
          isDevPreview: isDevPreviewActive,
          scenario,
          lang,
        }
      );
      setDmsData(updated);
      setIsConfiguringNew(false);
      setSaveSuccess(
        updated.message ||
          (lang === 'en'
            ? 'Check-in interval saved successfully. Next deadline updated.'
            : 'Cấu hình chu kỳ kiểm tra đã được lưu thành công. Thời hạn tiếp theo đã được thiết lập.')
      );
      setTimeout(() => setSaveSuccess(''), 4500);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckIn = async () => {
    if (isCheckingIn) return;
    setIsCheckingIn(true);
    setCheckInNotice('');
    setCheckInError('');

    const isDevPreviewActive = Boolean(import.meta.env.DEV && showDevToolbar);
    const scenario = isDevPreviewActive ? selectedScenario : undefined;

    try {
      const result = await checkInDms({
        isDevPreview: isDevPreviewActive,
        scenario,
        lang,
      });
      setDmsData(result);
      setCheckInNotice(
        result.message ||
          (lang === 'en'
            ? 'Vitality confirmed successfully. Next countdown refreshed.'
            : 'Xác nhận hoạt động thành công. Bộ đếm chu kỳ tiếp theo đã được làm mới.')
      );
      setTimeout(() => setCheckInNotice(''), 5000);
    } catch (err) {
      setCheckInError(err.message);
      setTimeout(() => setCheckInError(''), 6000);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleResetForm = () => {
    if (dmsData && dmsData.checkIntervalDays) {
      setIntervalInput(dmsData.checkIntervalDays);
    } else {
      setIntervalInput(DEFAULT_INTERVAL_DAYS);
    }
    setFieldErrors({});
    setSaveError('');
  };

  const content = {
    vi: {
      eyebrow: 'GIÁM SÁT HOẠT ĐỘNG ĐỊNH KỲ',
      pageTitle: "Giám sát hoạt động (Dead Man's Switch)",
      pageSubtitle:
        'Thiết lập chu kỳ kiểm tra hoạt động để hệ thống định kỳ theo dõi tín hiệu hiện diện của bạn.',
      safetyTitle: 'Quy chuẩn an toàn LV-DEATH-001',
      safetyText:
        'Việc bỏ lỡ lịch kiểm tra hoạt động không đồng nghĩa với việc xác nhận chủ sở hữu đã qua đời. Kho di sản tuyệt đối không tự động mở khóa, không giải mã dữ liệu và không bàn giao tài sản khi quá hạn check-in.',
      statusCardTitle: 'Trạng thái giám sát hiện hành',
      statusCardSub: 'Thông tin chu kỳ và các mốc thời gian kiểm tra sự sống',
      metricNextCheck: 'Hạn kiểm tra tiếp theo',
      metricNextCheckSub: 'Thời điểm cần gửi xác nhận hoạt động',
      metricInterval: 'Chu kỳ kiểm tra hiện hành',
      metricIntervalSub: 'Tần suất giữa các kỳ kiểm tra',
      metricCheckInAction: 'Xác nhận sự sống',
      metricCheckInActionSub: 'Gửi tín hiệu trực tuyến để làm mới bộ đếm chu kỳ',
      checkInBtn: 'Xác nhận còn hoạt động',
      checkingInBtn: 'Đang xác nhận…',
      checkInDisabledTriggered: 'Không khả dụng khi đang ở trạng thái kích hoạt quá hạn (DMS_NOT_MONITORING).',
      metricLastCheck: 'Xác nhận gần nhất',
      metricLastCheckSub: 'Ghi nhận tín hiệu kiểm tra trước đó',
      daysUnit: 'ngày',
      triggeredAlertTitle: 'Cảnh báo: Đã quá hạn kiểm tra hoạt động (TRIGGERED)',
      triggeredAlertDesc:
        'Bạn đã bỏ lỡ thời hạn kiểm tra hoạt động định kỳ. Hệ thống đang kích hoạt quy trình theo dõi và chờ bạn phản hồi. Kho di sản của bạn vẫn được niêm phong an toàn và không tự động mở khóa cho bất kỳ ai.',
      triggeredDeadlinePrefix: 'Hạn chót thời gian ân hạn:',
      configCardTitle: 'Cấu hình chu kỳ kiểm tra',
      configCardSub:
        'Lựa chọn khoảng thời gian giữa các lần hệ thống yêu cầu bạn xác nhận hoạt động.',
      presetsLabel: 'Lựa chọn nhanh đề xuất:',
      inputLabel: 'Chu kỳ kiểm tra định kỳ:',
      inputHelper: 'Chu kỳ tính theo số ngày (số nguyên dương lớn hơn 0) giữa các lần kiểm tra hoạt động.',
      saveBtn: 'Lưu cấu hình chu kỳ',
      savingBtn: 'Đang lưu cấu hình…',
      resetBtn: 'Đặt lại',
      emptyBadge: 'CHƯA CẤU HÌNH',
      emptyTitle: 'Chưa cấu hình chu kỳ kiểm tra',
      emptyDesc:
        'Kho di sản chưa được thiết lập lịch kiểm tra hoạt động định kỳ. Hãy cấu hình chu kỳ để hệ thống bắt đầu theo dõi các mốc check-in của bạn.',
      emptyAction: 'Thiết lập chu kỳ ngay',
      devToolbarLabel: 'Kịch bản kiểm thử giao diện:',
      devToolbarNotice: 'Công cụ mô phỏng dành riêng cho môi trường kiểm thử (?preview=true).',
    },
    en: {
      eyebrow: 'PERIODIC ACTIVITY MONITORING',
      pageTitle: "Dead Man's Switch (Activity Monitor)",
      pageSubtitle:
        'Configure check-in intervals so the system can track scheduled presence confirmations according to your settings.',
      safetyTitle: 'Safety Standard LV-DEATH-001',
      safetyText:
        'Missing a scheduled check-in deadline does not confirm that the owner has passed away. Heritage vaults are never automatically unlocked, decrypted, or transferred solely due to missed check-ins.',
      statusCardTitle: 'Current Vitality Status',
      statusCardSub: 'Monitoring schedule and countdown threshold parameters',
      metricNextCheck: 'Next Check-in Deadline',
      metricNextCheckSub: 'Scheduled time for vitality confirmation prompt',
      metricInterval: 'Current Check-in Interval',
      metricIntervalSub: 'Countdown frequency between periodic checks',
      metricCheckInAction: 'Vitality Confirmation',
      metricCheckInActionSub: 'Transmit presence signal to refresh check-in timer',
      checkInBtn: "Confirm Vitality (I'm active)",
      checkingInBtn: 'Confirming…',
      checkInDisabledTriggered: 'Unavailable while in triggered state (DMS_NOT_MONITORING).',
      metricLastCheck: 'Last Activity Confirmed',
      metricLastCheckSub: 'Previous successful presence verification',
      daysUnit: 'days',
      triggeredAlertTitle: 'Alert: Check-in Deadline Expired (TRIGGERED)',
      triggeredAlertDesc:
        'You have missed the scheduled vitality check-in deadline. The system has initiated the grace monitoring protocol. Your heritage vault remains securely sealed and is never automatically unlocked.',
      triggeredDeadlinePrefix: 'Grace period deadline:',
      configCardTitle: 'Configure Check-in Interval',
      configCardSub:
        'Select the duration between required activity check-ins.',
      presetsLabel: 'Suggested Presets:',
      inputLabel: 'Check-in Interval:',
      inputHelper: 'Interval measured in positive integer days (> 0) between scheduled check-ins.',
      saveBtn: 'Save Interval Settings',
      savingBtn: 'Saving Settings…',
      resetBtn: 'Reset',
      emptyBadge: 'NOT CONFIGURED',
      emptyTitle: 'Check-in Interval Not Configured',
      emptyDesc:
        'Your heritage vault currently has no active check-in schedule. Configure an interval to begin tracking your scheduled check-ins.',
      emptyAction: 'Configure Interval Now',
      devToolbarLabel: 'UI Test Scenario:',
      devToolbarNotice: 'Development utility for interface verification (?preview=true).',
    },
  };

  const t = content[lang] || content.vi;

  // Render Loading State
  if (loading) {
    return (
      <div className="lv-dms-page">
        <LoadingState
          message={
            lang === 'en'
              ? 'Loading vitality monitoring records…'
              : 'Đang tải dữ liệu giám sát hoạt động…'
          }
        />
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="lv-dms-page">
        <ErrorState
          error={error}
          onRetry={handleManualRetry}
          onNavigateToLogin={onNavigateToLogin}
          lang={lang}
        />
      </div>
    );
  }

  const isTriggered = dmsData && dmsData.status === 'TRIGGERED';
  const isNotConfigured = !dmsData || dmsData.status === 'DISABLED' || dmsData.status === 'NOT_CONFIGURED';

  return (
    <div className="lv-dms-page">
      {/* Dev Simulation Toolbar — Strictly gated for DEV environment with ?preview=true */}
      {Boolean(import.meta.env.DEV && showDevToolbar) && (
        <aside className="lv-dms-dev-toolbar" aria-label="Bộ điều khiển kịch bản thử nghiệm">
          <div className="lv-dms-dev-toolbar-inner">
            <label htmlFor="dms-scenario-select" className="lv-dms-dev-label">
              <span className="lv-dms-dev-icon" aria-hidden="true">⚙</span>
              <span>{t.devToolbarLabel}</span>
            </label>
            <select
              id="dms-scenario-select"
              className="lv-dms-dev-select"
              value={selectedScenario}
              onChange={handleScenarioChange}
            >
              {DMS_SCENARIOS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {lang === 'vi' ? sc.labelVi : sc.labelEn}
                </option>
              ))}
            </select>
            <span className="lv-dms-dev-subnote">{t.devToolbarNotice}</span>
          </div>
        </aside>
      )}

      {/* Toast / Action Notice */}
      {checkInNotice && (
        <div className="lv-dms-toast-notice" role="status" aria-live="polite">
          <span className="lv-dms-toast-icon" aria-hidden="true">✓</span>
          <span>{checkInNotice}</span>
        </div>
      )}

      {checkInError && (
        <div className="lv-dms-toast-error" role="alert" aria-live="polite">
          <span className="lv-dms-toast-icon" aria-hidden="true">!</span>
          <span>{checkInError}</span>
        </div>
      )}

      {/* Page Header */}
      <header className="lv-dms-header">
        <div className="lv-dms-header-titles">
          <span className="lv-dms-eyebrow">{t.eyebrow}</span>
          <h1 className="lv-dms-title">{t.pageTitle}</h1>
          <p className="lv-dms-subtitle">{t.pageSubtitle}</p>
        </div>

        {/* Important Safety Standard Callout (LV-DEATH-001) */}
        <aside className="lv-dms-safety-card" aria-label={t.safetyTitle}>
          <div className="lv-dms-safety-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="lv-dms-safety-text">
            <strong>{t.safetyTitle}: </strong>
            <span>{t.safetyText}</span>
          </div>
        </aside>
      </header>

      {/* TRIGGERED / GRACE PERIOD Alert Banner */}
      {isTriggered && (
        <section className="lv-dms-triggered-banner" role="alert" aria-live="polite">
          <div className="lv-dms-triggered-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="lv-dms-triggered-content">
            <h2 className="lv-dms-triggered-title">{t.triggeredAlertTitle}</h2>
            <p className="lv-dms-triggered-desc">{t.triggeredAlertDesc}</p>
            {dmsData.graceDeadline && (
              <span className="lv-dms-triggered-deadline-tag">
                {t.triggeredDeadlinePrefix} {formatDmsDate(dmsData.graceDeadline, lang)}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      {isNotConfigured && !isConfiguringNew ? (
        <section className="lv-dms-empty-panel" aria-label={t.emptyTitle}>
          <div className="lv-dms-empty-icon-wrap" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="lv-dms-empty-badge">{t.emptyBadge}</span>
          <h2 className="lv-dms-empty-heading">{t.emptyTitle}</h2>
          <p className="lv-dms-empty-desc">{t.emptyDesc}</p>
          <MagneticButton
            type="button"
            className="lv-dms-empty-cta"
            onClick={() => setIsConfiguringNew(true)}
            maxOffset={4}
          >
            <span>{t.emptyAction}</span>
            <span aria-hidden="true">→</span>
          </MagneticButton>
        </section>
      ) : (
        <>
          {/* Status Overview Card */}
          {dmsData && (
            <section className="lv-dms-card" aria-labelledby="dms-overview-heading">
              <div className="lv-dms-card-header">
                <div className="lv-dms-card-heading-group">
                  <div className="lv-dms-card-icon-wrap" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="dms-overview-heading" className="lv-dms-card-title">
                      {t.statusCardTitle}
                    </h2>
                    <p className="lv-dms-card-subtitle">{t.statusCardSub}</p>
                  </div>
                </div>
                <div className="lv-dms-badge-group">
                  <StatusBadge status={dmsData.status} lang={lang} />
                  {dmsData.isSimulation && (
                    <span className="lv-dms-simulation-tag">MÔ PHỎNG (DEV)</span>
                  )}
                </div>
              </div>

              {/* 4-Metric Grid */}
              <div className="lv-dms-metrics-grid">
                {/* Metric 1: Next Check-in Deadline */}
                <div className="lv-dms-metric-item">
                  <span className="lv-dms-metric-label">{t.metricNextCheck}</span>
                  <span className="lv-dms-metric-value">
                    {formatDmsDate(dmsData.nextCheckAt, lang)}
                  </span>
                  <span className="lv-dms-metric-sub">{t.metricNextCheckSub}</span>
                </div>

                {/* Metric 2: Current Interval */}
                <div className="lv-dms-metric-item">
                  <span className="lv-dms-metric-label">{t.metricInterval}</span>
                  <span className="lv-dms-metric-value">
                    {dmsData.checkIntervalDays
                      ? `${dmsData.checkIntervalDays} ${t.daysUnit}`
                      : '—'}
                  </span>
                  <span className="lv-dms-metric-sub">{t.metricIntervalSub}</span>
                </div>

                {/* Metric 3: Vitality Check-in Action */}
                <div className="lv-dms-metric-item lv-dms-metric-action-cell">
                  <span className="lv-dms-metric-label">{t.metricCheckInAction}</span>
                  <div className="lv-dms-action-wrap">
                    <MagneticButton
                      type="button"
                      className={`lv-dms-checkin-btn ${isTriggered ? 'is-disabled' : ''}`}
                      onClick={handleCheckIn}
                      disabled={isCheckingIn || isTriggered}
                      maxOffset={3}
                      aria-label={t.checkInBtn}
                    >
                      {isCheckingIn && <span className="lv-btn-spinner" aria-hidden="true" />}
                      <span>{isCheckingIn ? t.checkingInBtn : t.checkInBtn}</span>
                    </MagneticButton>
                  </div>
                  <span className="lv-dms-metric-sub">
                    {isTriggered ? t.checkInDisabledTriggered : t.metricCheckInActionSub}
                  </span>
                </div>

                {/* Metric 4: Last Check-in Time */}
                <div className="lv-dms-metric-item">
                  <span className="lv-dms-metric-label">{t.metricLastCheck}</span>
                  <span className="lv-dms-metric-value">
                    {formatDmsDate(dmsData.lastCheckInAt, lang)}
                  </span>
                  <span className="lv-dms-metric-sub">{t.metricLastCheckSub}</span>
                </div>
              </div>
            </section>
          )}

          {/* Configure Interval Form Card */}
          <section className="lv-dms-card" aria-labelledby="dms-config-heading">
            <div className="lv-dms-card-header">
              <div className="lv-dms-card-heading-group">
                <div className="lv-dms-card-icon-wrap" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div>
                  <h2 id="dms-config-heading" className="lv-dms-card-title">
                    {t.configCardTitle}
                  </h2>
                  <p className="lv-dms-card-subtitle">{t.configCardSub}</p>
                </div>
              </div>
            </div>

            {/* Notification Banners */}
            {saveSuccess && (
              <div className="lv-dms-banner-success" role="status" aria-live="polite">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="lv-dms-banner-error" role="alert" aria-live="polite">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{saveError}</span>
              </div>
            )}

            <form className="lv-dms-form-group" onSubmit={handleSaveInterval} noValidate>
              {/* Recommended Presets */}
              <div className="lv-dms-presets-section">
                <span className="lv-dms-presets-label">{t.presetsLabel}</span>
                <div className="lv-dms-presets-grid" role="group" aria-label={t.presetsLabel}>
                  {INTERVAL_PRESETS.map((preset) => {
                    const isActive = Number(intervalInput) === preset.days;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        className={`lv-dms-preset-pill ${isActive ? 'is-active' : ''}`}
                        onClick={() => handlePresetSelect(preset.days)}
                        aria-pressed={isActive}
                      >
                        {lang === 'vi' ? preset.labelVi : preset.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input */}
              <div className="lv-dms-input-section">
                <div className="lv-dms-input-label-row">
                  <label htmlFor="dms-interval-input" className="lv-dms-input-label">
                    {t.inputLabel}
                  </label>
                </div>
                <div className="lv-dms-input-wrap">
                  <input
                    id="dms-interval-input"
                    name="check_interval_days"
                    type="number"
                    min="1"
                    step="1"
                    className={`lv-dms-input ${fieldErrors.check_interval_days ? 'is-invalid' : ''}`}
                    value={intervalInput}
                    onChange={handleIntervalInputChange}
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldErrors.check_interval_days)}
                    aria-describedby={
                      fieldErrors.check_interval_days
                        ? 'dms-interval-error'
                        : 'dms-interval-helper'
                    }
                  />
                  <span className="lv-dms-input-unit">{t.daysUnit}</span>
                </div>

                {fieldErrors.check_interval_days ? (
                  <span id="dms-interval-error" className="lv-dms-field-error" role="alert">
                    {fieldErrors.check_interval_days}
                  </span>
                ) : (
                  <span id="dms-interval-helper" className="lv-dms-input-helper">
                    {t.inputHelper}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="lv-dms-form-actions">
                <MagneticButton
                  type="submit"
                  className="lv-dms-submit-btn"
                  disabled={isSaving}
                  maxOffset={3}
                >
                  {isSaving && <span className="lv-btn-spinner" aria-hidden="true" />}
                  <span>{isSaving ? t.savingBtn : t.saveBtn}</span>
                </MagneticButton>
                <button
                  type="button"
                  className="lv-dms-reset-btn"
                  onClick={handleResetForm}
                  disabled={isSaving}
                >
                  {t.resetBtn}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
