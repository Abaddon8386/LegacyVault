import { useState } from 'react';
import { validateRegistration } from '../../utils/registrationValidation.js';
import './RegisterPageHenedo.css';

const i18nContent = {
  vi: {
    brandName: 'LegacyVault',
    brandTag: 'Hệ thống Quản lý Di sản Số',
    editorialEyebrow: 'LƯU GIỮ HÔM NAY · TRAO GỬI MAI SAU',
    editorialHeading: 'Một nơi gìn giữ\nnhững điều quý giá nhất.',
    editorialDesc:
      'Kho lưu trữ số an toàn, nơi bạn chủ động sắp xếp tài sản, ý nguyện và ký ức để chuyển giao trọn vẹn cho người thân yêu.',
    pillar1: 'Bảo mật nhiều lớp · Kiến trúc mã hóa tiêu chuẩn bảo vệ tài sản số cá nhân.',
    pillar2: 'Chủ động chuyển giao · Tự quyết định người nhận và thời điểm bàn giao.',
    pillar3: 'Quy trình minh bạch · Hỗ trợ thiết lập bàn giao theo đúng ý nguyện.',
    copyright: '© 2026 LegacyVault · Sanctuary of Generations',

    formBadge: 'KHỞI TẠO TÀI KHOẢN DI SẢN',
    title: 'Tạo tài khoản cá nhân',
    subtitle: 'Khởi tạo không gian số an toàn để sắp xếp tài sản cá nhân và chỉ định người thụ hưởng.',

    fullNameLabel: 'Họ và tên',
    fullNamePlaceholder: 'Ví dụ: Nguyễn Văn An',
    emailLabel: 'Địa chỉ Email',
    emailPlaceholder: 'nguyen.van.an@example.com',
    phoneLabel: 'Số điện thoại',
    phoneHint: 'Tùy chọn',
    phonePlaceholder: '0901234567',
    passwordLabel: 'Mật khẩu',
    passwordHint: 'Tối thiểu 8 ký tự',
    confirmPasswordLabel: 'Nhập lại mật khẩu',
    showPassword: 'Hiện mật khẩu',
    hidePassword: 'Ẩn mật khẩu',
    termsText: 'Tôi đồng ý với',
    termsLink: 'Điều khoản dịch vụ',
    andText: 'và',
    privacyLink: 'Chính sách bảo vệ dữ liệu di sản',
    submitButton: 'Tạo tài khoản',
    submittingButton: 'Đang khởi tạo tài khoản…',
    signinPrompt: 'Đã có tài khoản?',
    signinAction: 'Đăng nhập',
    pendingNotice: 'Thông tin đăng ký đã được xác thực hợp lệ. Hệ thống đang tiến hành xử lý yêu cầu tạo tài khoản.',
    successNotice: 'Đăng ký thành công! Bạn có thể đăng nhập để bắt đầu cấu hình kho.',
    failureNotice: 'Không thể đăng ký. Vui lòng kiểm tra lại thông tin.',
    rbacNote: 'Cổng đăng ký mở dành riêng cho cá nhân quản lý tài sản (Vault Owner). Tài khoản nhân viên (Staff) và chuyên viên pháp lý (Legal Verifier) do Quản trị viên cấp quyền.',
  },
  en: {
    brandName: 'LegacyVault',
    brandTag: 'Digital Heritage Sanctuary',
    editorialEyebrow: 'PRESERVE TODAY · PASS ON TOMORROW',
    editorialHeading: 'A peaceful sanctuary\nfor what matters most.',
    editorialDesc:
      'A secure, calm digital haven where your personal assets, heartfelt wishes, and family memories are safeguarded for future generations.',
    pillar1: 'Multi-Layer Security · Standardized encryption architecture safeguarding personal digital assets.',
    pillar2: 'Autonomous Transfer · Full control over designated recipients and delivery schedule.',
    pillar3: 'Transparent Process · Structured workflow honoring your verified instructions.',
    copyright: '© 2026 LegacyVault · Sanctuary of Generations',

    formBadge: 'INITIALIZE PERSONAL SANCTUARY',
    title: 'Create personal account',
    subtitle: 'Set up your secure digital space to organize personal assets and designate beneficiaries.',

    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. Alexander Vance',
    emailLabel: 'Email Address',
    emailPlaceholder: 'alexander@example.com',
    phoneLabel: 'Phone Number',
    phoneHint: 'Optional',
    phonePlaceholder: '0901234567',
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters',
    confirmPasswordLabel: 'Confirm Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    termsText: 'I agree to the',
    termsLink: 'Terms of Service',
    andText: 'and',
    privacyLink: 'Heritage Privacy Policy',
    submitButton: 'Create account',
    submittingButton: 'Creating sanctuary…',
    signinPrompt: 'Already have an account?',
    signinAction: 'Sign in',
    pendingNotice: 'Registration details validated. System is processing your account creation request.',
    successNotice: 'Registration successful! You may now sign in to set up your vault.',
    failureNotice: 'Registration failed. Please check your inputs.',
    rbacNote: 'Public registration is exclusively for personal account holders (Vault Owners). Staff and Legal Verifier accounts are provisioned by an Administrator.',
  },
};

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
};

export default function RegisterPageHenedo({ onRegister, onNavigateToLogin }) {
  const [lang, setLang] = useState('vi');
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const t = i18nContent[lang];

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (typeof onNavigateToLogin === 'function') {
      onNavigateToLogin();
    } else {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleInputChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateRegistration(values, lang);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus('idle');
      return;
    }

    setStatus('submitting');
    try {
      if (typeof onRegister === 'function') {
        const res = await onRegister(values);
        setStatus('success');
        setStatusMessage(res?.message || t.successNotice);
        return;
      }

      // Check if developer explicitly enabled preview simulation in DEV:
      const isPreview = Boolean(
        import.meta.env.DEV &&
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('preview') === 'true'
      );

      if (isPreview) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setStatus('success');
        setStatusMessage(
          lang === 'vi'
            ? 'Chế độ xem trước (Preview): Dữ liệu form hợp lệ. Sẵn sàng tích hợp API.'
            : 'Preview Mode: Form inputs valid. Ready for API integration.'
        );
        return;
      }

      // Normal production route: Attempt actual API call to backend (PS-74 contract: POST /api/v1/auth/register)
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': lang,
        },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone?.trim() || undefined,
        }),
      });

      if (response.status === 201) {
        setStatus('success');
        setStatusMessage(t.successNotice);
      } else if (response.status === 409) {
        setStatus('failure');
        setStatusMessage(
          lang === 'vi'
            ? 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.'
            : 'This email is already registered. Please sign in or use another email.'
        );
      } else if (response.status === 400) {
        const errData = await response.json().catch(() => null);
        setStatus('failure');
        setStatusMessage(
          errData?.message ||
            (lang === 'vi'
              ? 'Dữ liệu đăng ký không hợp lệ theo yêu cầu của máy chủ.'
              : 'Registration data rejected by server validation.')
        );
      } else {
        // Endpoint not implemented yet (404) or server unavailable
        setStatus('failure');
        setStatusMessage(
          lang === 'vi'
            ? 'Dịch vụ đăng ký trực tuyến hiện chưa khả dụng trên máy chủ. Vui lòng thử lại sau.'
            : 'Online registration service is currently unavailable on the server. Please try again later.'
        );
      }
    } catch (err) {
      setStatus('failure');
      setStatusMessage(err?.message || t.failureNotice);
    }
  };

  return (
    <div className="henedo-page">
      {/* ==================================================================
          LEFT REGION: Editorial Sanctuary Story & Calm Organic Art
          Warm deep forest sanctuary backdrop + soft botanical curves
          ================================================================== */}
      <section className="henedo-editorial-region" aria-label="Brand Sanctuary Story">
        <div className="editorial-content-wrapper">
          {/* Top Brand Header */}
          <header className="henedo-brand-header">
            <div className="henedo-brand-lockup">
              <div className="henedo-brand-crest" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L4 6.5V12C4 17 7.5 20.8 12 22C16.5 20.8 20 17 20 12V6.5L12 2Z"
                    stroke="#c5a059"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="11" r="2" fill="#c5a059" />
                  <path d="M12 13V16" stroke="#c5a059" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="henedo-brand-titles">
                <span className="henedo-brand-name">{t.brandName}</span>
                <span className="henedo-brand-tag">{t.brandTag}</span>
              </div>
            </div>
          </header>

          {/* Main Story Body */}
          <div className="editorial-story-body">
            <div className="henedo-eyebrow-pill">{t.editorialEyebrow}</div>
            <h1 className="editorial-heading">{t.editorialHeading}</h1>
            <p className="editorial-description">{t.editorialDesc}</p>

            {/* Calm Organic Visual: Soft layered watercolor & gold contour curves */}
            <div className="henedo-calm-artwork" aria-hidden="true">
              <svg
                viewBox="0 0 460 220"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                className="calm-svg"
              >
                <defs>
                  <linearGradient id="hnSoftGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1a4c3e" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#245d4d" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#13382d" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="hnCeladon" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#82b5a5" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="#c5e0d6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a3cfc2" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="hnGoldLine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(197, 160, 89, 0.1)" />
                    <stop offset="50%" stopColor="rgba(217, 185, 120, 0.85)" />
                    <stop offset="100%" stopColor="rgba(197, 160, 89, 0.2)" />
                  </linearGradient>
                </defs>

                {/* Soft undulating organic dunes */}
                <path
                  d="M0 160 C 120 110, 240 180, 360 120 C 410 95, 440 130, 460 110 L 460 220 L 0 220 Z"
                  fill="url(#hnSoftGreen)"
                />
                <path
                  d="M0 180 C 100 130, 210 190, 320 140 C 390 105, 430 150, 460 135 L 460 220 L 0 220 Z"
                  fill="url(#hnCeladon)"
                />
                {/* Delicate gold contour filament */}
                <path
                  d="M0 160 C 120 110, 240 180, 360 120 C 410 95, 440 130, 460 110"
                  fill="none"
                  stroke="url(#hnGoldLine)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M20 195 C 130 155, 230 205, 340 160 C 400 135, 440 165, 460 155"
                  fill="none"
                  stroke="rgba(217, 185, 120, 0.45)"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Calm Pillars of Trust */}
            <div className="henedo-pillars">
              <div className="henedo-pillar-item">
                <span className="pillar-leaf-bullet" aria-hidden="true">◆</span>
                <span className="pillar-text">{t.pillar1}</span>
              </div>
              <div className="henedo-pillar-item">
                <span className="pillar-leaf-bullet" aria-hidden="true">◆</span>
                <span className="pillar-text">{t.pillar2}</span>
              </div>
              <div className="henedo-pillar-item">
                <span className="pillar-leaf-bullet" aria-hidden="true">◆</span>
                <span className="pillar-text">{t.pillar3}</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <footer className="editorial-footer">
            <span>{t.copyright}</span>
          </footer>
        </div>
      </section>

      {/* ==================================================================
          RIGHT REGION: Pure Warm-Ivory Registration Form
          Editorial typography, generous breathing room, sand-gold CTA
          ================================================================== */}
      <main className="henedo-form-region" aria-label="Registration Form">
        <div className="henedo-form-container">
          {/* Top Form Header with Language Toggle */}
          <div className="henedo-form-topbar">
            <span className="henedo-form-badge">{t.formBadge}</span>
            <div className="henedo-lang-toggle" role="radiogroup" aria-label="Language selection">
              <button
                type="button"
                className={`hn-lang-btn ${lang === 'vi' ? 'active' : ''}`}
                onClick={() => setLang('vi')}
                role="radio"
                aria-checked={lang === 'vi'}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                className={`hn-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                role="radio"
                aria-checked={lang === 'en'}
              >
                English
              </button>
            </div>
          </div>

          <h2 className="henedo-form-title">{t.title}</h2>
          <p className="henedo-form-sub">{t.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="henedo-form">
            {/* Row 1: Full Name & Phone Number */}
            <div className="henedo-field-row">
              <div className="henedo-field-group">
                <label className="henedo-label" htmlFor="hn-fullName">
                  {t.fullNameLabel} <span className="hn-req">*</span>
                </label>
                <input
                  id="hn-fullName"
                  type="text"
                  className={`henedo-input ${errors.fullName ? 'has-error' : ''}`}
                  placeholder={t.fullNamePlaceholder}
                  value={values.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'hn-fullName-error' : undefined}
                  required
                />
                {errors.fullName && (
                  <span id="hn-fullName-error" className="henedo-error-msg" role="alert">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="henedo-field-group">
                <label className="henedo-label" htmlFor="hn-phone">
                  <span>{t.phoneLabel}</span>
                  <span className="hn-hint">({t.phoneHint})</span>
                </label>
                <input
                  id="hn-phone"
                  type="tel"
                  className={`henedo-input ${errors.phone ? 'has-error' : ''}`}
                  placeholder={t.phonePlaceholder}
                  value={values.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'hn-phone-error' : undefined}
                />
                {errors.phone && (
                  <span id="hn-phone-error" className="henedo-error-msg" role="alert">
                    {errors.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Email Address */}
            <div className="henedo-field-group">
              <label className="henedo-label" htmlFor="hn-email">
                {t.emailLabel} <span className="hn-req">*</span>
              </label>
              <input
                id="hn-email"
                type="email"
                className={`henedo-input ${errors.email ? 'has-error' : ''}`}
                placeholder={t.emailPlaceholder}
                value={values.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'hn-email-error' : undefined}
                required
              />
              {errors.email && (
                <span id="hn-email-error" className="henedo-error-msg" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Row 3: Passwords in 2 columns */}
            <div className="henedo-field-row">
              <div className="henedo-field-group">
                <label className="henedo-label" htmlFor="hn-password">
                  <span>
                    {t.passwordLabel} <span className="hn-req">*</span>
                  </span>
                  <span className="hn-hint">({t.passwordHint})</span>
                </label>
                <div className="henedo-input-wrap">
                  <input
                    id="hn-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`henedo-input ${errors.password ? 'has-error' : ''}`}
                    placeholder="••••••••"
                    value={values.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'hn-password-error' : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="henedo-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    title={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span id="hn-password-error" className="henedo-error-msg" role="alert">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="henedo-field-group">
                <label className="henedo-label" htmlFor="hn-confirmPassword">
                  {t.confirmPasswordLabel} <span className="hn-req">*</span>
                </label>
                <div className="henedo-input-wrap">
                  <input
                    id="hn-confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className={`henedo-input ${errors.confirmPassword ? 'has-error' : ''}`}
                    placeholder="••••••••"
                    value={values.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'hn-confirmPassword-error' : undefined}
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <span id="hn-confirmPassword-error" className="henedo-error-msg" role="alert">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="henedo-checkbox-wrap">
              <label className="henedo-checkbox-label" htmlFor="hn-agreeTerms">
                <input
                  id="hn-agreeTerms"
                  type="checkbox"
                  className="henedo-checkbox-native"
                  checked={values.agreeTerms}
                  onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                  aria-invalid={Boolean(errors.agreeTerms)}
                  aria-describedby={errors.agreeTerms ? 'hn-terms-error' : undefined}
                />
                <span className="henedo-checkbox-custom" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="henedo-checkbox-text">
                  {t.termsText} <a href="#terms">{t.termsLink}</a> {t.andText}{' '}
                  <a href="#privacy">{t.privacyLink}</a>.
                </span>
              </label>
              {errors.agreeTerms && (
                <span id="hn-terms-error" className="henedo-error-msg hn-terms-err" role="alert">
                  {errors.agreeTerms}
                </span>
              )}
            </div>

            {/* Sand Gold Primary Action CTA */}
            <button
              type="submit"
              className="henedo-cta-btn"
              disabled={status === 'submitting'}
            >
              <span>{status === 'submitting' ? t.submittingButton : t.submitButton}</span>
              <span className="hn-arrow" aria-hidden="true">→</span>
            </button>
          </form>

          {/* Status Alert Notification */}
          {status !== 'idle' && status !== 'submitting' && (
            <div className={`henedo-status-box ${status}`} role="status">
              <div className="henedo-status-icon" aria-hidden="true">
                {status === 'pending' && 'ℹ'}
                {status === 'success' && '✓'}
                {status === 'failure' && '!'}
              </div>
              <div className="henedo-status-text">{statusMessage}</div>
            </div>
          )}

          {/* Footer Info & Preview Notice */}
          <footer className="henedo-form-footer">
            {typeof onNavigateToLogin === 'function' && (
              <div className="henedo-signin-prompt">
                {t.signinPrompt}{' '}
                <a href="/login" onClick={handleLoginClick}>
                  {t.signinAction}
                </a>
              </div>
            )}

            <p className="henedo-rbac-note">{t.rbacNote}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
