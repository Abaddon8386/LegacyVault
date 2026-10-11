/**
 * LegacyVault — Will Upload Validation (PS-7)
 *
 * Rules:
 * - File is required (non-empty)
 * - Supported MIME types: application/pdf, image/jpeg, image/png
 * - Maximum file size: 10 MB (10 * 1024 * 1024 bytes)
 * - Note is optional, maximum 500 characters
 *
 * Semantic constraints:
 * - Does not perform or assume legal verification/approval.
 * - Does not read or extract plaintext content.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_NOTE_LENGTH = 500;

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export const willValidationMessages = {
  vi: {
    fileRequired: 'Vui lòng chọn tệp bản di chúc cần lưu trữ.',
    fileEmpty: 'Tệp được chọn không có nội dung (kích thước 0 byte).',
    fileTypeInvalid: 'Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp PDF, JPEG hoặc PNG.',
    fileSizeExceeded: 'Kích thước tệp vượt quá giới hạn tối đa cho phép (10 MB).',
    noteTooLong: 'Ghi chú không được vượt quá 500 ký tự.',
  },
  en: {
    fileRequired: 'Please select a digitized will document to upload.',
    fileEmpty: 'The selected file is empty (0 bytes).',
    fileTypeInvalid: 'Unsupported file format. Please select a PDF, JPEG, or PNG file.',
    fileSizeExceeded: 'File size exceeds the maximum allowed limit (10 MB).',
    noteTooLong: 'Note cannot exceed 500 characters.',
  },
};

/**
 * Validate will upload form inputs.
 * @param {Object} params
 * @param {File|null} params.file
 * @param {string} [params.note]
 * @param {string} [lang='vi']
 * @returns {Object} map of field errors, empty object if valid
 */
export function validateWillUpload({ file, note = '' }, lang = 'vi') {
  const msgs = willValidationMessages[lang] || willValidationMessages.vi;
  const errors = {};

  // 1. File presence
  if (!file) {
    errors.file = msgs.fileRequired;
    return errors;
  }

  // 2. Non-empty file
  if (typeof file.size === 'number' && file.size === 0) {
    errors.file = msgs.fileEmpty;
    return errors;
  }

  // 3. File type validation (MIME-first; backend is security authority)
  // Contract accepts: application/pdf, image/jpeg, image/png
  // FE validation is UX-only. If MIME type is present, validate against accepted MIME types.
  // If MIME type is missing/blank, fall back to filename extension as a UX hint.
  const mimeType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();

  if (mimeType) {
    if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
      errors.file = msgs.fileTypeInvalid;
    }
  } else {
    const hasValidExtension = ACCEPTED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      errors.file = msgs.fileTypeInvalid;
    }
  }

  // 4. File size validation (<= 10MB)
  if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
    errors.file = msgs.fileSizeExceeded;
  }

  // 5. Note validation (optional, max 500 characters)
  if (note && note.length > MAX_NOTE_LENGTH) {
    errors.note = msgs.noteTooLong;
  }

  return errors;
}
