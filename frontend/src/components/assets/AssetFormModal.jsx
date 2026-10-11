import { useState } from 'react'
import { Button } from '../common/Button'
import { AlertCircle } from 'lucide-react'
import './AssetFormModal.css'

/**
 * AssetFormModal — PS-5: Add asset only.
 * Validates required fields before submission. No sensitive data logged.
 */
export function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  t,
  isSubmitting = false,
}) {
  const emptyForm = {
    name: '',
    category: '',
    estimatedValue: '',
    documentRef: '',
    description: '',
  }

  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}
    if (!formData.name.trim()) {
      errs.name = t.assets.validation.nameRequired
    } else if (formData.name.trim().length < 3) {
      errs.name = t.assets.validation.nameMin
    }

    if (!formData.category) {
      errs.category = t.assets.validation.categoryRequired
    }

    if (formData.estimatedValue) {
      const num = Number(formData.estimatedValue)
      if (isNaN(num) || num < 0) {
        errs.estimatedValue = t.assets.validation.valueInvalid
      }
    }

    if (formData.documentRef && /[<>{}]/.test(formData.documentRef)) {
      errs.documentRef = t.assets.validation.documentRefInvalid
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      name: formData.name,
      category: formData.category,
      estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : null,
      documentRef: formData.documentRef,
      description: formData.description,
    })
  }

  function handleResetAndClose() {
    setFormData(emptyForm)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  const categories = [
    { value: 'REAL_ESTATE', label: t.assets.types.REAL_ESTATE },
    { value: 'BANK_ACCOUNT', label: t.assets.types.BANK_ACCOUNT },
    { value: 'VEHICLE', label: t.assets.types.VEHICLE },
    { value: 'SECURITIES', label: t.assets.types.SECURITIES },
    { value: 'PRECIOUS_ITEM', label: t.assets.types.PRECIOUS_ITEM },
    { value: 'OTHER', label: t.assets.types.OTHER },
  ]

  return (
    <div className="lv-modal-backdrop" onClick={handleResetAndClose} role="presentation">
      <div
        className="lv-modal lv-asset-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-modal-title"
      >
        <div className="lv-modal__header">
          <div>
            <h2 id="asset-modal-title" className="lv-modal__title">
              {t.assets.addModal.title}
            </h2>
            <p className="lv-modal__desc">{t.assets.addModal.desc}</p>
          </div>
          <button
            type="button"
            className="lv-modal__close-btn"
            onClick={handleResetAndClose}
            aria-label={t.assets.closeBtn}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="lv-modal__body" noValidate>
          {/* Asset Name */}
          <div className="lv-form-group">
            <label htmlFor="asset-name" className="lv-form-label">
              {t.assets.addModal.nameLabel} <span className="lv-required">*</span>
            </label>
            <input
              id="asset-name"
              type="text"
              className={`lv-form-input ${errors.name ? 'lv-form-input--error' : ''}`}
              placeholder={t.assets.addModal.namePlaceholder}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="lv-form-error" role="alert">
                <AlertCircle size={14} /> {errors.name}
              </p>
            )}
          </div>

          {/* Asset Category */}
          <div className="lv-form-group">
            <label htmlFor="asset-category" className="lv-form-label">
              {t.assets.addModal.categoryLabel} <span className="lv-required">*</span>
            </label>
            <select
              id="asset-category"
              className={`lv-form-select ${errors.category ? 'lv-form-input--error' : ''}`}
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">{t.assets.addModal.categoryPlaceholder}</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="lv-form-error" role="alert">
                <AlertCircle size={14} /> {errors.category}
              </p>
            )}
          </div>

          {/* Two-column layout for value and doc reference */}
          <div className="lv-form-row">
            <div className="lv-form-group">
              <label htmlFor="asset-value" className="lv-form-label">
                {t.assets.addModal.valueLabel}
              </label>
              <input
                id="asset-value"
                type="number"
                min="0"
                step="1000000"
                className={`lv-form-input ${errors.estimatedValue ? 'lv-form-input--error' : ''}`}
                placeholder={t.assets.addModal.valuePlaceholder}
                value={formData.estimatedValue}
                onChange={(e) => handleChange('estimatedValue', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.estimatedValue && (
                <p className="lv-form-error" role="alert">
                  <AlertCircle size={14} /> {errors.estimatedValue}
                </p>
              )}
              <span className="lv-form-hint">{t.assets.addModal.valueHint}</span>
            </div>

            <div className="lv-form-group">
              <label htmlFor="asset-doc" className="lv-form-label">
                {t.assets.addModal.documentRefLabel}
              </label>
              <input
                id="asset-doc"
                type="text"
                className={`lv-form-input ${errors.documentRef ? 'lv-form-input--error' : ''}`}
                placeholder={t.assets.addModal.documentRefPlaceholder}
                value={formData.documentRef}
                onChange={(e) => handleChange('documentRef', e.target.value)}
                disabled={isSubmitting}
              />
              {errors.documentRef && (
                <p className="lv-form-error" role="alert">
                  <AlertCircle size={14} /> {errors.documentRef}
                </p>
              )}
            </div>
          </div>

          {/* Description / Notes */}
          <div className="lv-form-group">
            <label htmlFor="asset-desc" className="lv-form-label">
              {t.assets.addModal.descriptionLabel}
            </label>
            <textarea
              id="asset-desc"
              rows={3}
              className="lv-form-textarea"
              placeholder={t.assets.addModal.descriptionPlaceholder}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="lv-form-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
            >
              {t.assets.cancelBtn}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isSubmitting ? t.assets.addModal.submittingBtn : t.assets.addModal.submitBtn}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
