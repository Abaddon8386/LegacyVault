import { useState, useRef } from 'react';
import {
  validateWillUpload,
  ACCEPTED_FILE_EXTENSIONS,
  MAX_NOTE_LENGTH,
} from '../../utils/willValidation.js';
import {
  willService,
  willStatusMessages,
  formatFileSize,
  formatDateTime,
  DEFAULT_MOCK_VAULT_ID,
} from '../../utils/willService.js';
import './WillUploadPage.css';

/**
 * WillUploadPage — PS-7: [FE][ST-03] Upload Digitized Will
 *
 * SCOPE & CONTRACT SPECIFICATION:
 * - Contract: POST /api/v1/vaults/{vaultId}/wills (multipart/form-data)
 * - File: required (PDF, JPEG, PNG <= 10MB)
 * - Note: optional, max 500 characters
 * - Result display:
 *     status = UPLOADED
 *     currentVersion.version
 *     fileName
 *     contentType
 *     sizeBytes
 *     sha256
 *     uploadedAt
 *     createdAt
 *
 * CRITICAL SEMANTIC INVARIANTS:
 * - Upload does NOT imply legal approval.
 * - Never display LEGAL_APPROVED or claim legal validity.
 * - SHA-256 is technical integrity metadata only, not proof of authenticity.
 * - No file viewing, downloading, previewing, or exposing raw file bytes.
 */
export default function WillUploadPage({
  vaultId = DEFAULT_MOCK_VAULT_ID,
  onNavigateHome,
}) {
  const [lang, setLang] = useState('vi');
  const [selectedFile, setSelectedFile] = useState(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const fileInputRef = useRef(null);
  const t = willStatusMessages[lang] || willStatusMessages.vi;

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
    setSubmitError(null);
  };

  // Clear chosen file
  const handleClearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle note change with length monitoring
  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);
    if (errors.note) {
      setErrors((prev) => ({ ...prev, note: undefined }));
    }
    setSubmitError(null);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    const validationErrors = validateWillUpload({ file: selectedFile, note }, lang);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await willService.uploadWill(vaultId, selectedFile, note);
      setUploadResult(response);
      setErrors({});
    } catch (err) {
      setSubmitError(err.message || t.UPLOAD_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to upload another document or re-try
  const handleReset = () => {
    setSelectedFile(null);
    setNote('');
    setErrors({});
    setSubmitError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="hn-will-page">
      {/* Top Header Navigation Bar */}
      <header className="hn-will-topbar">
        <div className="hn-will-topbar-left">
          <div
            className="hn-will-brand-lockup"
            onClick={onNavigateHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigateHome?.();
            }}
          >
            <div className="hn-will-brand-crest" aria-hidden="true">
              <span className="hn-will-brand-crest-symbol">LV</span>
            </div>
            <div>
              <div className="hn-will-brand-title">LegacyVault</div>
              <div className="hn-will-brand-subtitle">
                {lang === 'vi' ? 'Kho di sản số' : 'Estate Sanctuary'}
              </div>
            </div>
          </div>
        </div>

        <div className="hn-will-topbar-right">
          {/* Language Switch */}
          <div className="hn-will-lang-switch" role="group" aria-label="Language selection">
            <button
              type="button"
              className={`hn-will-lang-btn ${lang === 'vi' ? 'is-active' : ''}`}
              onClick={() => setLang('vi')}
            >
              VI
            </button>
            <button
              type="button"
              className={`hn-will-lang-btn ${lang === 'en' ? 'is-active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>

          {onNavigateHome && (
            <button
              type="button"
              className="hn-will-nav-back"
              onClick={onNavigateHome}
            >
              <span aria-hidden="true">←</span>
              <span>{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="hn-will-container">
        {/* Intro */}
        <section className="hn-will-intro">
          <div className="hn-will-badge-pill">
            <span aria-hidden="true">📜</span>
            <span>{lang === 'vi' ? 'Phân hệ Di chúc số hóa' : 'Digitized Will Module'}</span>
          </div>
          <h1 className="hn-will-page-title">
            {lang === 'vi' ? 'Tải lên Bản Di Chúc Số Hóa' : 'Upload Digitized Will'}
          </h1>
          <p className="hn-will-page-desc">
            {lang === 'vi'
              ? 'Lưu trữ hồ sơ tài liệu di chúc số hóa ban đầu vào kho di sản an toàn với mã băm toàn vẹn SHA-256 độc lập.'
              : 'Secure initial digitized will document inventory with tamper-evident cryptographic SHA-256 integrity metadata.'}
          </p>
        </section>

        {/* Legal Advisory Notice (CRITICAL SEMANTICS) */}
        <aside className="hn-will-legal-banner" role="note" aria-label={t.NOTICE_TITLE}>
          <div className="hn-will-legal-icon" aria-hidden="true">
            ℹ
          </div>
          <div>
            <div className="hn-will-legal-title">{t.NOTICE_TITLE}</div>
            <p className="hn-will-legal-body">{t.NOTICE_CONTENT}</p>
          </div>
        </aside>

        {/* Submission Failure Alert */}
        {submitError && (
          <div className="hn-will-alert hn-will-alert-error" role="alert">
            <span aria-hidden="true">⚠️</span>
            <div>{submitError}</div>
          </div>
        )}

        {/* Upload Form Card (Hidden or disabled after success) */}
        {!uploadResult ? (
          <section className="hn-will-card">
            <div className="hn-will-card-header">
              <h2 className="hn-will-card-title">
                {lang === 'vi' ? 'Hồ sơ bản di chúc số hóa' : 'Digitized Will Document Record'}
              </h2>
              <p className="hn-will-card-subtitle">
                {lang === 'vi'
                  ? 'Hỗ trợ các định dạng tệp PDF, JPEG, PNG có dung lượng tối đa 10 MB.'
                  : 'Supported file formats: PDF, JPEG, PNG up to 10 MB in file size.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* File Input Group */}
              <div className="hn-will-form-group">
                <label htmlFor="will-file-input" className="hn-will-label">
                  <span>
                    {t.FILE_LABEL} <span className="hn-will-label-required">*</span>
                  </span>
                </label>

                <div
                  className={`hn-will-file-box ${errors.file ? 'has-error' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                >
                  <input
                    id="will-file-input"
                    ref={fileInputRef}
                    type="file"
                    className="hn-will-file-input"
                    accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    aria-describedby={errors.file ? 'will-file-error' : undefined}
                  />

                  <div className="hn-will-file-icon" aria-hidden="true">
                    📁
                  </div>
                  <div className="hn-will-file-prompt">
                    {lang === 'vi'
                      ? 'Nhấn để chọn tệp từ thiết bị'
                      : 'Click to browse file from device'}
                  </div>
                  <div className="hn-will-file-subtext">
                    {lang === 'vi'
                      ? 'Dung lượng tệp tối đa: 10 MB'
                      : 'Maximum file size: 10 MB'}
                  </div>
                  <div className="hn-will-file-formats">
                    <span className="hn-will-format-pill">PDF</span>
                    <span className="hn-will-format-pill">JPEG</span>
                    <span className="hn-will-format-pill">PNG</span>
                  </div>
                </div>

                {/* Selected File Feedback */}
                {selectedFile && (
                  <div className="hn-will-selected-strip">
                    <div className="hn-will-selected-left">
                      <span className="hn-will-selected-icon" aria-hidden="true">
                        📄
                      </span>
                      <div className="hn-will-selected-info">
                        <span className="hn-will-selected-name">{selectedFile.name}</span>
                        <span className="hn-will-selected-meta">
                          {formatFileSize(selectedFile.size)} •{' '}
                          {selectedFile.type || 'application/octet-stream'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="hn-will-selected-clear"
                      onClick={handleClearFile}
                      aria-label={lang === 'vi' ? 'Hủy chọn tệp' : 'Clear selected file'}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {errors.file && (
                  <div id="will-file-error" className="hn-will-error-msg" role="alert">
                    <span aria-hidden="true">⚠️</span>
                    <span>{errors.file}</span>
                  </div>
                )}
              </div>

              {/* Optional Note Group */}
              <div className="hn-will-form-group">
                <label htmlFor="will-note-input" className="hn-will-label">
                  <span>{t.NOTE_LABEL}</span>
                  <span className="hn-will-char-counter">
                    {note.length}/{MAX_NOTE_LENGTH}
                  </span>
                </label>

                <textarea
                  id="will-note-input"
                  className={`hn-will-textarea ${errors.note ? 'has-error' : ''}`}
                  placeholder={t.NOTE_PLACEHOLDER}
                  value={note}
                  onChange={handleNoteChange}
                  maxLength={MAX_NOTE_LENGTH}
                  disabled={isSubmitting}
                  aria-describedby={errors.note ? 'will-note-error' : undefined}
                />

                {errors.note && (
                  <div id="will-note-error" className="hn-will-error-msg" role="alert">
                    <span aria-hidden="true">⚠️</span>
                    <span>{errors.note}</span>
                  </div>
                )}
              </div>

              {/* Form Action Row */}
              <div className="hn-will-actions">
                <button
                  type="submit"
                  className="hn-will-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span aria-hidden="true">⏳</span>
                      <span>{t.UPLOADING_BTN}</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">📤</span>
                      <span>{t.UPLOAD_BTN}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* Success Metadata Card */
          <section className="hn-will-success-card" aria-label={t.UPLOAD_SUCCESS}>
            <div className="hn-will-success-header">
              <div className="hn-will-success-crest" aria-hidden="true">
                ✓
              </div>
              <div>
                <h2 className="hn-will-success-title">{t.UPLOAD_SUCCESS}</h2>
                <p className="hn-will-success-desc">
                  {lang === 'vi'
                    ? 'Thông tin siêu dữ liệu toàn vẹn của bản di chúc đã được lưu trữ thành công.'
                    : 'Integrity metadata for the digitized will has been successfully stored.'}
                </p>
              </div>
            </div>

            <div className="hn-will-meta-grid">
              {/* Document Status */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.STATUS_LABEL}</span>
                <span className="hn-will-status-badge">
                  <span aria-hidden="true">🔒</span>
                  <span>{uploadResult.status}</span>
                </span>
              </div>

              {/* Version */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.VERSION_LABEL}</span>
                <span className="hn-will-meta-val">
                  v{uploadResult.currentVersion?.version || 1}
                </span>
              </div>

              {/* Original File Name */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.FILE_NAME_LABEL}</span>
                <span className="hn-will-meta-val">
                  {uploadResult.currentVersion?.fileName}
                </span>
              </div>

              {/* Content Type */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.MIME_TYPE_LABEL}</span>
                <span className="hn-will-meta-val">
                  {uploadResult.currentVersion?.contentType}
                </span>
              </div>

              {/* File Size */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.FILE_SIZE_LABEL}</span>
                <span className="hn-will-meta-val">
                  {formatFileSize(uploadResult.currentVersion?.sizeBytes)} (
                  {uploadResult.currentVersion?.sizeBytes?.toLocaleString()} bytes)
                </span>
              </div>

              {/* Uploaded At */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.UPLOADED_AT_LABEL}</span>
                <span className="hn-will-meta-val">
                  {formatDateTime(uploadResult.currentVersion?.uploadedAt, lang)}
                </span>
              </div>

              {/* Created At */}
              <div className="hn-will-meta-item">
                <span className="hn-will-meta-label">{t.CREATED_AT_LABEL}</span>
                <span className="hn-will-meta-val">
                  {formatDateTime(uploadResult.createdAt, lang)}
                </span>
              </div>
            </div>

            {/* SHA-256 Integrity Hash Detail Box */}
            <div className="hn-will-meta-item" style={{ gridColumn: '1 / -1' }}>
              <span className="hn-will-meta-label">{t.SHA256_LABEL}</span>
              <div className="hn-will-sha-box">
                {uploadResult.currentVersion?.sha256}
              </div>
              <div className="hn-will-sha-hint">{t.SHA256_HINT}</div>
            </div>

            {/* Action to upload new file or view inventory */}
            <div className="hn-will-reupload-row">
              <button
                type="button"
                className="hn-will-reupload-btn"
                onClick={handleReset}
              >
                <span aria-hidden="true">↺</span>
                <span>
                  {lang === 'vi'
                    ? 'Tải lên tệp di chúc khác'
                    : 'Upload another document'}
                </span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
