/**
 * LegacyVault — Will Service & Mock Implementation (PS-7)
 *
 * SPECIFICATION & SAFETY BOUNDARIES:
 * - Contract: POST /api/v1/vaults/{vaultId}/wills (multipart/form-data)
 * - Returns 201 Created + WillResponse
 * - Status: 'UPLOADED'
 * - CurrentVersion: { version: 1, fileName, contentType, sizeBytes, sha256, uploadedAt }
 *
 * CRITICAL SEMANTICS:
 * 1. Upload does NOT mean legally approved. Status is strictly UPLOADED.
 * 2. Do not display LEGAL_APPROVED or claim legal validity.
 * 3. SHA-256 only denotes cryptographic integrity metadata, not legal authenticity.
 * 4. Raw file contents are NEVER rendered, logged, or unnecessarily persisted.
 * 5. Mock mode simulates upload latency and computes metadata safely.
 */

export const DEFAULT_MOCK_VAULT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Compute the REAL SHA-256 hex digest of file bytes.
 * Uses browser crypto.subtle.digest('SHA-256', bytes) when available.
 * In Node test environment, falls back to node:crypto createHash('sha256').
 * If environment cannot compute SHA-256, fails clearly rather than fabricating a fake digest.
 *
 * Requirements:
 * - sha256 = lowercase 64-character hex digest of actual file content
 * - same bytes -> same hash
 * - different bytes -> different hash
 * - NO random/fake fallback
 *
 * @param {File|Blob|{arrayBuffer: Function}|Buffer|Uint8Array} file
 * @returns {Promise<string>} lowercase 64-character hex string
 */
export async function computeFileSha256(file) {
  if (!file) {
    throw new Error('FILE_REQUIRED_FOR_HASH');
  }

  let buffer;

  // 1. Extract raw byte ArrayBuffer or Buffer
  const isNodeBuffer = typeof globalThis.Buffer !== 'undefined' && globalThis.Buffer.isBuffer(file);

  if (typeof file.arrayBuffer === 'function') {
    buffer = await file.arrayBuffer();
  } else if (isNodeBuffer) {
    buffer = file;
  } else if (file instanceof Uint8Array) {
    buffer = file.buffer;
  } else if (typeof FileReader !== 'undefined' && file instanceof Blob) {
    buffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  } else if (file.buffer instanceof ArrayBuffer) {
    buffer = file.buffer;
  } else if (typeof file === 'string') {
    buffer = new TextEncoder().encode(file).buffer;
  } else {
    throw new Error('CANNOT_READ_FILE_BYTES: Unable to extract arrayBuffer from file object');
  }

  // 2. Compute real SHA-256 digest using SubtleCrypto
  const subtleCrypto =
    (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) ||
    (typeof window !== 'undefined' && window.crypto?.subtle);

  if (subtleCrypto && typeof subtleCrypto.digest === 'function') {
    const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : buffer.buffer || buffer;
    const digestBuffer = await subtleCrypto.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(digestBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  }

  // 3. Fallback for Node.js test environment (node:crypto)
  const nodeProcess = typeof globalThis.process !== 'undefined' ? globalThis.process : null;
  if (nodeProcess && nodeProcess.versions?.node) {
    try {
      const nodeCryptoModule = 'node:crypto';
      const { createHash } = await import(/* @vite-ignore */ nodeCryptoModule);
      const hash = createHash('sha256');
      if (typeof globalThis.Buffer !== 'undefined' && globalThis.Buffer.isBuffer(buffer)) {
        hash.update(buffer);
      } else {
        hash.update(new Uint8Array(buffer));
      }
      return hash.digest('hex').toLowerCase();
    } catch {
      throw new Error('CRYPTO_UNAVAILABLE: Node crypto unavailable for SHA-256 calculation');
    }
  }

  throw new Error('CRYPTO_UNAVAILABLE: Environment does not support SHA-256 cryptographic calculation');
}

export const willStatusMessages = {
  vi: {
    UPLOADED: 'Đã tải lên hệ thống (Chờ các bước kế tiếp)',
    INTEGRITY_VERIFIED: 'Đã tạo mã băm toàn vẹn SHA-256',
    NOTICE_TITLE: 'Lưu ý pháp lý quan trọng',
    NOTICE_CONTENT:
      'Hành động tải lên bản di chúc số hóa chỉ mang tính chất lưu trữ hồ sơ và xác thực tính toàn vẹn kỹ thuật (SHA-256). Việc này KHÔNG đồng nghĩa với việc di chúc đã được chứng thực, công chứng, hoặc có hiệu lực pháp lý chính thức theo quy định pháp luật hiện hành.',
    UPLOAD_SUCCESS: 'Tải lên bản di chúc số hóa thành công.',
    UPLOAD_FAILED: 'Không thể tải lên bản di chúc. Vui lòng kiểm tra lại kết nối và thử lại.',
    FILE_LABEL: 'Tệp tài liệu di chúc',
    NOTE_LABEL: 'Ghi chú bổ sung (Tùy chọn)',
    NOTE_PLACEHOLDER: 'Ví dụ: Bản chụp có chữ ký xác nhận của người làm chứng...',
    UPLOAD_BTN: 'Tải lên bản di chúc số hóa',
    UPLOADING_BTN: 'Đang tải lên và tính toán mã băm...',
    STATUS_LABEL: 'Trạng thái tài liệu',
    VERSION_LABEL: 'Phiên bản lưu trữ',
    FILE_NAME_LABEL: 'Tên tệp gốc',
    FILE_SIZE_LABEL: 'Dung lượng tệp',
    MIME_TYPE_LABEL: 'Định dạng tệp',
    SHA256_LABEL: 'Mã băm toàn vẹn (SHA-256)',
    UPLOADED_AT_LABEL: 'Thời gian tải lên',
    CREATED_AT_LABEL: 'Thời gian khởi tạo hồ sơ',
    SHA256_HINT: 'Mã băm chỉ dùng để đối soát tính toàn vẹn của tệp, không mang giá trị chứng thực pháp lý.',
  },
  en: {
    UPLOADED: 'Uploaded to System (Pending further steps)',
    INTEGRITY_VERIFIED: 'SHA-256 Integrity Hash Generated',
    NOTICE_TITLE: 'Important Legal Advisory',
    NOTICE_CONTENT:
      'Uploading a digitized will document is strictly for secure inventory retention and technical integrity verification (SHA-256). It does NOT constitute notarization, legal approval, or formal validity under applicable succession laws.',
    UPLOAD_SUCCESS: 'Digitized will document uploaded successfully.',
    UPLOAD_FAILED: 'Failed to upload digitized will. Please check your connection and try again.',
    FILE_LABEL: 'Digitized Will Document',
    NOTE_LABEL: 'Additional Notes (Optional)',
    NOTE_PLACEHOLDER: 'e.g., Scanned copy signed before witness...',
    UPLOAD_BTN: 'Upload Digitized Will',
    UPLOADING_BTN: 'Uploading & generating integrity hash...',
    STATUS_LABEL: 'Document Status',
    VERSION_LABEL: 'Storage Version',
    FILE_NAME_LABEL: 'Original File Name',
    FILE_SIZE_LABEL: 'File Size',
    MIME_TYPE_LABEL: 'MIME Type',
    SHA256_LABEL: 'Integrity Checksum (SHA-256)',
    UPLOADED_AT_LABEL: 'Uploaded At',
    CREATED_AT_LABEL: 'Record Created At',
    SHA256_HINT: 'The hash serves only for file integrity verification, not legal certification.',
  },
};

/**
 * Format file size into human-readable representation.
 * @param {number} bytes
 * @returns {string} e.g. "2.4 MB" or "840 KB"
 */
export function formatFileSize(bytes = 0) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format ISO datetime string in a localized format.
 * @param {string} isoString
 * @param {string} lang
 * @returns {string}
 */
export function formatDateTime(isoString, lang = 'vi') {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return date.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Will Service API interface & Mock execution.
 */
export const willService = {
  /**
   * Upload digitized will document.
   * @param {string} vaultId - Vault UUID
   * @param {File} file - Validated document file
   * @param {string} [note=''] - Optional note <= 500 chars
   * @param {Object} [options]
   * @param {boolean} [options.isMock=true]
   * @returns {Promise<Object>} WillResponse schema
   */
  async uploadWill(vaultId = DEFAULT_MOCK_VAULT_ID, file, note = '', options = {}) {
    const isMock = options.isMock !== false;

    if (!file) {
      throw new Error('FILE_REQUIRED');
    }

    if (isMock) {
      // Simulate realistic upload and hashing latency
      await new Promise((resolve) => setTimeout(resolve, 600));

      const now = new Date().toISOString();
      const sha256 = await computeFileSha256(file);

      // Return strictly aligned WillResponse schema
      const response = {
        id: 'w1111111-2222-3333-4444-555555555555',
        vaultId: vaultId || DEFAULT_MOCK_VAULT_ID,
        status: 'UPLOADED', // NEVER LEGAL_APPROVED
        note: (note || '').trim() || null,
        currentVersion: {
          version: 1,
          fileName: file.name,
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
          sha256,
          uploadedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };

      return response;
    }

    // Real API integration when backend is available
    const formData = new FormData();
    formData.append('file', file);
    if (note && note.trim()) {
      formData.append('note', note.trim());
    }

    const res = await fetch(`/api/v1/vaults/${vaultId}/wills`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const error = new Error(errBody.message || 'UPLOAD_FAILED');
      error.status = res.status;
      error.code = errBody.code || 'UNKNOWN_ERROR';
      throw error;
    }

    return res.json();
  },
};
