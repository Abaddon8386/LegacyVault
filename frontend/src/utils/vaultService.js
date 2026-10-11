/**
 * LegacyVault — Vault Management Service & Validation Adapter (PS-3)
 *
 * ARCHITECTURAL BOUNDARY & SAFETY COMPLIANCE:
 * - Aligned with Jira PS-3 and proposed PS-74 Contract (docs/api-contracts/vaults.md).
 * - Business Rules:
 *   1. Newly created vaults always have status = 'ACTIVE' (PS-12 / D-API-12).
 *   2. Vault Owners only have access to their own vault (1:1 relationship).
 *   3. Ownership validation is enforced by Backend security context.
 *   4. Client validation: Name is required, 2–150 chars. Description is optional, <= 1000 chars.
 *   5. In live mode, communicates with /api/v1/vaults.
 *   6. In DEV mode with ?preview=true, provides simulation scenarios for UI review.
 */

export const VAULT_SCENARIOS = [
  { id: 'exists', labelVi: 'Kho đang hoạt động (ACTIVE)', labelEn: 'Active Vault Exists (ACTIVE)' },
  { id: 'empty', labelVi: 'Chưa có kho (Empty State)', labelEn: 'No Vault (Empty State)' },
  { id: 'create_modal', labelVi: 'Khởi tạo kho (Create Vault)', labelEn: 'Create Vault Modal' },
  { id: 'validation_error', labelVi: 'Lỗi xác thực dữ liệu (Validation Error)', labelEn: 'Form Validation Error' },
  { id: 'loading', labelVi: 'Đang tải dữ liệu (Loading State)', labelEn: 'Loading Records (Loading State)' },
  { id: 'unauthorized', labelVi: 'Lỗi 401: Hết phiên làm việc (Unauthorized)', labelEn: 'HTTP 401: Session Expired' },
  { id: 'forbidden', labelVi: 'Lỗi 403: Không có quyền truy cập (Forbidden)', labelEn: 'HTTP 403: Access Denied' },
  { id: 'not_found', labelVi: 'Lỗi 404: Không tìm thấy kho (Not Found)', labelEn: 'HTTP 404: Vault Not Found' },
  { id: 'network_error', labelVi: 'Lỗi mạng / Mất kết nối (Network Error)', labelEn: 'Network Error / Offline' },
];

export const vaultStatusMessages = {
  vi: {
    nameRequired: 'Vui lòng nhập tên kho di sản.',
    nameMin: 'Tên kho di sản phải có ít nhất 2 ký tự.',
    nameMax: 'Tên kho di sản không được vượt quá 150 ký tự.',
    descMax: 'Mô tả không được vượt quá 1000 ký tự.',
    unauthorized: 'Phiên làm việc đã hết hạn hoặc chưa được xác thực. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền truy cập vào kho di sản này. Quyền truy cập thuộc về chủ sở hữu.',
    notFound: 'Không tìm thấy kho di sản trên hệ thống.',
    networkError: 'Không thể kết nối đến máy chủ LegacyVault. Vui lòng kiểm tra kết nối mạng.',
    serverError: 'Máy chủ gặp sự cố nội bộ (HTTP 500). Vui lòng thử lại sau.',
    limitExceeded: 'Tài khoản đã sở hữu một kho di sản. Mỗi chủ tài khoản chỉ được khởi tạo một kho duy nhất.',
    backendNotReady: 'Dịch vụ lưu trữ Vault hiện đang trong quá trình tích hợp máy chủ. Vui lòng thử lại sau.',
    createdSuccess: 'Kho di sản số đã được khởi tạo thành công (Trạng thái ACTIVE).',
  },
  en: {
    nameRequired: 'Please enter a vault name.',
    nameMin: 'Vault name must be at least 2 characters.',
    nameMax: 'Vault name must not exceed 150 characters.',
    descMax: 'Description must not exceed 1000 characters.',
    unauthorized: 'Session has expired or authentication is required. Please sign in again.',
    forbidden: 'You do not have permission to access this vault. Access is restricted to the owner.',
    notFound: 'Heritage vault not found on the system.',
    networkError: 'Unable to connect to LegacyVault server. Please check your network connection.',
    serverError: 'Internal server error occurred (HTTP 500). Please try again later.',
    limitExceeded: 'Account already owns a vault. Each owner is permitted only one personal vault.',
    backendNotReady: 'Vault service is currently under server integration. Please try again later.',
    createdSuccess: 'Heritage vault initialized successfully (Status ACTIVE).',
  },
};

/**
 * Client-side validation for Vault creation input
 * @param {Object} input - { vault_name, description } or { name, description }
 * @param {'vi'|'en'} lang
 * @returns {Object} validation errors keyed by field
 */
export function validateVaultInput(input = {}, lang = 'vi') {
  const msgs = vaultStatusMessages[lang] || vaultStatusMessages.vi;
  const errors = {};
  const rawName = input.vault_name !== undefined ? input.vault_name : input.name;
  const name = (rawName || '').trim();
  const desc = (input.description || '').trim();

  if (!name) {
    errors.vault_name = msgs.nameRequired;
  } else if (name.length < 2) {
    errors.vault_name = msgs.nameMin;
  } else if (name.length > 150) {
    errors.vault_name = msgs.nameMax;
  }

  if (desc && desc.length > 1000) {
    errors.description = msgs.descMax;
  }

  return errors;
}

/**
 * Fetch Vault details for the authenticated Vault Owner
 * @param {Object} options - { scenario, isDevPreview, lang, fetchFn }
 * @returns {Promise<Object|null>}
 */
export async function fetchVault(options = {}) {
  const lang = options.lang || 'vi';
  const scenario = options.scenario || 'exists';
  const msgs = vaultStatusMessages[lang] || vaultStatusMessages.vi;

  // Simulation mode: only when DEV Preview is explicitly requested or when a scenario is provided without fetchFn
  const isSimulation = Boolean(options.isDevPreview) || (Boolean(options.scenario) && !options.fetchFn);

  if (isSimulation) {
    await new Promise((resolve) => setTimeout(resolve, 350));

    switch (scenario) {
      case 'empty':
        return null;

      case 'loading':
        return new Promise(() => {});

      case 'unauthorized': {
        const err = new Error(msgs.unauthorized);
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
      }

      case 'forbidden': {
        const err = new Error(msgs.forbidden);
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      case 'not_found': {
        const err = new Error(msgs.notFound);
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      case 'network_error': {
        const err = new Error(msgs.networkError);
        err.status = 0;
        err.code = 'NETWORK_ERROR';
        throw err;
      }

      case 'server_error': {
        const err = new Error(msgs.serverError);
        err.status = 500;
        err.code = 'INTERNAL_SERVER_ERROR';
        throw err;
      }

      case 'create_modal':
      case 'validation_error':
      case 'exists':
      default:
        return {
          id: 'vlt-9c1f0b6e-4a2b',
          vault_name:
            lang === 'en'
              ? 'Vance Family Heritage Sanctuary'
              : 'Kho Di Sản Gia Đình Vance',
          name:
            lang === 'en'
              ? 'Vance Family Heritage Sanctuary'
              : 'Kho Di Sản Gia Đình Vance',
          description:
            lang === 'en'
              ? 'A secure sanctuary safeguarding digital assets, family wishes, and heritage directives for future generations.'
              : 'Không gian số an toàn lưu giữ tài sản, ý nguyện gia đình và chỉ dẫn bàn giao cho thế hệ mai sau.',
          status: 'ACTIVE',
          created_at: '2026-10-10T08:00:00Z',
          updated_at: '2026-10-10T08:00:00Z',
          isSimulation: true,
        };
    }
  }

  // Live execution mode: Connect to Backend API
  const activeFetch = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
  if (!activeFetch) {
    const err = new Error(msgs.networkError);
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  try {
    const response = await activeFetch('/api/v1/vaults', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const contentType = response.headers?.get?.('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const err = new Error(msgs.backendNotReady);
      err.status = response.status;
      err.code = 'BACKEND_NOT_READY';
      throw err;
    }

    if (!response.ok) {
      if (response.status === 401) {
        const err = new Error(msgs.unauthorized);
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
      }
      if (response.status === 403) {
        const err = new Error(msgs.forbidden);
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (response.status === 404) {
        // Vault not created yet for this owner -> returns null (Empty State)
        return null;
      }
      const err = new Error(msgs.serverError);
      err.status = response.status;
      err.code = 'SERVER_ERROR';
      throw err;
    }

    const data = await response.json();
    // Handle paginated or single vault response
    const vaultItem = Array.isArray(data?.content) ? data.content[0] : (Array.isArray(data) ? data[0] : data);
    if (!vaultItem) return null;

    return {
      id: vaultItem.id,
      vault_name: vaultItem.name || vaultItem.vault_name,
      name: vaultItem.name || vaultItem.vault_name,
      description: vaultItem.description || '',
      status: vaultItem.status || 'ACTIVE',
      created_at: vaultItem.createdAt || vaultItem.created_at || '2026-10-10T08:00:00Z',
      updated_at: vaultItem.updatedAt || vaultItem.updated_at || '2026-10-10T08:00:00Z',
      isSimulation: false,
    };
  } catch (error) {
    if (error.status !== undefined) throw error;
    const err = new Error(msgs.networkError);
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }
}

/**
 * Create a new Vault for the authenticated Vault Owner
 * @param {Object} input - { vault_name, description } or { name, description }
 * @param {Object} options - { lang, scenario, isDevPreview, fetchFn }
 * @returns {Promise<Object>}
 */
export async function createVault(input = {}, options = {}) {
  const lang = options.lang || 'vi';
  const scenario = options.scenario || 'success';
  const msgs = vaultStatusMessages[lang] || vaultStatusMessages.vi;

  const errors = validateVaultInput(input, lang);
  if (Object.keys(errors).length > 0) {
    const err = new Error(
      lang === 'vi'
        ? 'Dữ liệu khởi tạo kho không hợp lệ. Vui lòng kiểm tra lại.'
        : 'Invalid vault creation data. Please verify your inputs.'
    );
    err.status = 400;
    err.code = 'VALIDATION_FAILED';
    err.fieldErrors = errors;
    throw err;
  }

  const rawName = (input.vault_name !== undefined ? input.vault_name : input.name || '').trim();
  const rawDesc = (input.description || '').trim();

  const isSimulation = Boolean(options.isDevPreview) || (Boolean(options.scenario) && !options.fetchFn);

  // DEV Preview scenario simulation
  if (isSimulation) {
    await new Promise((resolve) => setTimeout(resolve, 450));

    if (scenario === 'network_error') {
      const err = new Error(msgs.networkError);
      err.status = 0;
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    if (scenario === 'forbidden') {
      const err = new Error(msgs.limitExceeded);
      err.status = 403;
      err.code = 'VAULT_LIMIT_EXCEEDED';
      throw err;
    }

    return {
      id: 'vlt-new-' + Date.now().toString(36),
      vault_name: rawName,
      name: rawName,
      description: rawDesc,
      status: 'ACTIVE',
      created_at: '2026-10-10T08:00:00Z',
      updated_at: '2026-10-10T08:00:00Z',
      isSimulation: true,
      message: msgs.createdSuccess,
    };
  }

  // Live execution mode: Connect to Backend API
  const activeFetch = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
  if (!activeFetch) {
    const err = new Error(msgs.networkError);
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  try {
    const response = await activeFetch('/api/v1/vaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: rawName,
        description: rawDesc,
      }),
    });

    const contentType = response.headers?.get?.('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const err = new Error(msgs.backendNotReady);
      err.status = response.status;
      err.code = 'BACKEND_NOT_READY';
      throw err;
    }

    if (!response.ok) {
      if (response.status === 401) {
        const err = new Error(msgs.unauthorized);
        err.status = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
      }
      if (response.status === 403 || response.status === 409) {
        const err = new Error(msgs.limitExceeded);
        err.status = response.status;
        err.code = 'VAULT_LIMIT_EXCEEDED';
        throw err;
      }
      const data = await response.json().catch(() => ({}));
      const err = new Error(data.message || msgs.serverError);
      err.status = response.status;
      err.code = data.code || 'SERVER_ERROR';
      throw err;
    }

    const created = await response.json();
    return {
      id: created.id,
      vault_name: created.name || created.vault_name || rawName,
      name: created.name || created.vault_name || rawName,
      description: created.description || rawDesc,
      status: created.status || 'ACTIVE',
      created_at: created.createdAt || created.created_at || '2026-10-10T08:00:00Z',
      updated_at: created.updatedAt || created.updated_at || '2026-10-10T08:00:00Z',
      isSimulation: false,
      message: msgs.createdSuccess,
    };
  } catch (error) {
    if (error.status !== undefined) throw error;
    const err = new Error(msgs.networkError);
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }
}
