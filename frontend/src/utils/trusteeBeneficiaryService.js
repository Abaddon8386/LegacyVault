/**
 * LegacyVault — Trustee & Beneficiary Service (PS-8 / ST-04-05)
 *
 * SPECIFICATION & SAFETY BOUNDARIES:
 * - Trustee Contract:
 *   POST /api/v1/trustees
 *   GET /api/v1/trustees?vaultId={vaultId}
 * - Beneficiary Contract:
 *   POST /api/v1/vaults/{vaultId}/beneficiaries
 *   GET /api/v1/vaults/{vaultId}/beneficiaries
 *
 * CRITICAL BUSINESS RULES & CONSTRAINTS:
 * 1. Trustee is OPTIONAL (user may skip Trustee in UI; no skip endpoint exists in contract).
 * 2. Trustee status is strictly: APPOINTED | REVOKED.
 * 3. Trustee does NOT need an account (no userId, no login credentials).
 * 4. Trustee has NO unlock/decrypt/view-secret permissions.
 * 5. Trustee is NOT automatically a Beneficiary.
 * 6. Max 1 current Trustee per Vault (duplicate returns 409 TRUSTEE_ALREADY_EXISTS).
 * 7. Beneficiary does NOT need an account (no userId, no account creation).
 * 8. Beneficiary has NO Claim Link, NO Guest Portal, NO Beneficiary OTP.
 * 9. NO allocation percentage or share ratio.
 * 10. At least 1 Beneficiary is required for configuration readiness.
 * 11. In mock mode, operates safely in memory without fabricating user credentials.
 */

export const DEFAULT_VAULT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * In-memory Mock Storage for Local Dev / Testing
 */
const mockStore = {
  trustees: new Map(), // vaultId -> Array<Trustee>
  beneficiaries: new Map(), // vaultId -> Array<Beneficiary>
};

/**
 * Generate standard UUID v4 for mock records
 */
function generateMockUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Reset all mock data (useful for test isolation)
 */
export function resetMockData() {
  mockStore.trustees.clear();
  mockStore.beneficiaries.clear();
}

/**
 * Get active (APPOINTED) Trustee for a given Vault
 *
 * @param {string} vaultId
 * @returns {Promise<Array<Object>>} List of appointed trustees (max 1)
 */
export async function getTrustees(vaultId = DEFAULT_VAULT_ID) {
  try {
    const response = await fetch(`/api/v1/trustees?vaultId=${encodeURIComponent(vaultId)}`, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.items || [];
      return list.filter((t) => t.status === 'APPOINTED');
    }
  } catch {
    // Backend API unavailable; fallback to in-memory mock store
  }

  const list = mockStore.trustees.get(vaultId) || [];
  return list.filter((t) => t.status === 'APPOINTED');
}

/**
 * Add a new Trustee to the Vault
 *
 * Business rule: Max 1 current Trustee per Vault.
 * Status must be APPOINTED.
 * Duplicate returns 409 TRUSTEE_ALREADY_EXISTS.
 *
 * @param {string} vaultId
 * @param {Object} trusteeData
 * @param {string} trusteeData.fullName
 * @param {string} [trusteeData.phone]
 * @param {string} [trusteeData.email]
 * @param {string} [trusteeData.relationship]
 * @param {string} [trusteeData.note]
 * @returns {Promise<Object>} Created TrusteeResponse
 */
export async function createTrustee(vaultId = DEFAULT_VAULT_ID, trusteeData = {}) {
  const payload = {
    vaultId,
    fullName: (trusteeData.fullName || '').trim(),
    phone: (trusteeData.phone || '').trim() || null,
    email: (trusteeData.email || '').trim() || null,
    relationship: (trusteeData.relationship || '').trim() || null,
    note: (trusteeData.note || '').trim() || null,
  };

  try {
    const response = await fetch('/api/v1/trustees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    }

    if (response.status === 409) {
      const errData = await response.json().catch(() => ({}));
      const error = new Error(errData.message || 'Mỗi két chỉ có tối đa 1 Người giám hộ hiện tại.');
      error.code = errData.code || 'TRUSTEE_ALREADY_EXISTS';
      error.status = 409;
      throw error;
    }
  } catch (err) {
    if (err.code === 'TRUSTEE_ALREADY_EXISTS') {
      throw err;
    }
    // Fallback to mock simulation
  }

  // Enforce Max 1 APPOINTED Trustee rule in mock mode
  const currentList = mockStore.trustees.get(vaultId) || [];
  const appointedCount = currentList.filter((t) => t.status === 'APPOINTED').length;
  if (appointedCount >= 1) {
    const error = new Error('Mỗi két chỉ có tối đa 1 Người giám hộ hiện tại.');
    error.code = 'TRUSTEE_ALREADY_EXISTS';
    error.status = 409;
    throw error;
  }

  const now = new Date().toISOString();
  const createdTrustee = {
    id: generateMockUuid(),
    vaultId,
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email,
    relationship: payload.relationship,
    note: payload.note,
    status: 'APPOINTED',
    createdAt: now,
    updatedAt: now,
    // Explicitly NO userId or unlock capability
  };

  currentList.push(createdTrustee);
  mockStore.trustees.set(vaultId, currentList);

  return createdTrustee;
}

/**
 * Get all Beneficiaries for a Vault
 *
 * @param {string} vaultId
 * @returns {Promise<Array<Object>>}
 */
export async function getBeneficiaries(vaultId = DEFAULT_VAULT_ID) {
  try {
    const response = await fetch(`/api/v1/vaults/${encodeURIComponent(vaultId)}/beneficiaries`, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : data.items || [];
    }
  } catch {
    // Fallback to mock store
  }

  return mockStore.beneficiaries.get(vaultId) || [];
}

/**
 * Add a new Beneficiary to a Vault.
 *
 * Business rules:
 * - Beneficiary does NOT need an account (no userId).
 * - No Claim Link, no Guest Portal, no Beneficiary OTP.
 * - No allocation percentage or share ratio.
 *
 * @param {string} vaultId
 * @param {Object} beneficiaryData
 * @param {string} beneficiaryData.fullName
 * @param {string} [beneficiaryData.relationship]
 * @param {string} [beneficiaryData.dateOfBirth] YYYY-MM-DD
 * @param {string} [beneficiaryData.phone]
 * @param {string} [beneficiaryData.email]
 * @returns {Promise<Object>} Created BeneficiaryResponse
 */
export async function createBeneficiary(vaultId = DEFAULT_VAULT_ID, beneficiaryData = {}) {
  const payload = {
    fullName: (beneficiaryData.fullName || '').trim(),
    relationship: (beneficiaryData.relationship || '').trim() || null,
    dateOfBirth: beneficiaryData.dateOfBirth ? String(beneficiaryData.dateOfBirth).trim() : null,
    phone: (beneficiaryData.phone || '').trim() || null,
    email: (beneficiaryData.email || '').trim() || null,
  };

  try {
    const response = await fetch(`/api/v1/vaults/${encodeURIComponent(vaultId)}/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to mock simulation
  }

  const currentList = mockStore.beneficiaries.get(vaultId) || [];
  const now = new Date().toISOString();

  const createdBeneficiary = {
    id: generateMockUuid(),
    vaultId,
    fullName: payload.fullName,
    relationship: payload.relationship,
    dateOfBirth: payload.dateOfBirth,
    phone: payload.phone,
    email: payload.email,
    createdAt: now,
    updatedAt: now,
    // Explicitly NO userId, NO claim link, NO OTP, NO allocation percentage
  };

  currentList.push(createdBeneficiary);
  mockStore.beneficiaries.set(vaultId, currentList);

  return createdBeneficiary;
}

/**
 * Determine whether the Vault setup meets configuration readiness:
 * - At least 1 Beneficiary is required for readiness.
 * - Trustee is optional.
 *
 * @param {string} vaultId
 * @returns {Promise<{ isReady: boolean, beneficiaryCount: number, hasTrustee: boolean }>}
 */
export async function checkConfigurationReadiness(vaultId = DEFAULT_VAULT_ID) {
  const trustees = await getTrustees(vaultId);
  const beneficiaries = await getBeneficiaries(vaultId);

  const hasBeneficiary = beneficiaries.length >= 1;
  const hasTrustee = trustees.length > 0;

  return {
    isReady: hasBeneficiary,
    beneficiaryCount: beneficiaries.length,
    hasTrustee,
  };
}
