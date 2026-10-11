/**
 * Mock data and storage simulation for Assets (PS-5 & PS-6 Contract Alignment).
 * All mock data and simulation logic belong strictly in src/mocks/.
 *
 * NOTE: Fields strictly align with the current Asset API Contract (AssetResponse):
 * - id: UUID string
 * - vaultId: UUID string
 * - name: string (<= 150)
 * - assetType: enum ('TEXT' | 'CREDENTIAL')
 * - description: string (<= 1000)
 * - hasPayload: boolean
 * - createdAt: ISO 8601 UTC string
 * - updatedAt: ISO 8601 UTC string
 *
 * SECURITY: payload is write-only. It is processed, discarded, and NEVER
 * stored in plaintext in localStorage or returned in mock responses.
 */

export const DEFAULT_MOCK_VAULT_ID = '00000000-0000-0000-0000-000000000001'

const STORAGE_KEY = 'legacyvault_mock_assets_v2'

export function generateMockUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const INITIAL_MOCK_ASSETS = [
  {
    id: 'e2a875a0-811c-4b51-9df4-6d9b626e2541',
    vaultId: DEFAULT_MOCK_VAULT_ID,
    name: 'Di chúc và tâm nguyện riêng tư',
    assetType: 'TEXT',
    description: 'Ghi chú về phân định di sản và các dặn dò gia đình.',
    hasPayload: true,
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-08-15T09:30:00Z',
  },
  {
    id: 'b7c491e3-6c8d-4f12-a392-12f5a89201bc',
    vaultId: DEFAULT_MOCK_VAULT_ID,
    name: 'Khóa khôi phục ví phần cứng Ledger',
    assetType: 'CREDENTIAL',
    description: 'Mã PIN và cụm từ hạt giống dự phòng để trong két sắt.',
    hasPayload: true,
    createdAt: '2026-09-02T14:15:00Z',
    updatedAt: '2026-09-02T14:15:00Z',
  },
  {
    id: 'f9d3184b-01aa-4d89-913a-5928d3bc91aa',
    vaultId: DEFAULT_MOCK_VAULT_ID,
    name: 'Thông tin tài khoản ngân hàng số và email chính',
    assetType: 'CREDENTIAL',
    description: 'Thông tin đăng nhập tài khoản quản lý tài sản số.',
    hasPayload: true,
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
]

function getStoredAssets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ASSETS))
      return INITIAL_MOCK_ASSETS
    }
    return JSON.parse(raw)
  } catch {
    return INITIAL_MOCK_ASSETS
  }
}

function saveStoredAssets(assets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
  } catch {
    // Fail gracefully — do not log sensitive payloads
  }
}

export const assetMock = {
  /**
   * Mock getAssets with simulated latency.
   * @param {string} vaultId - Vault UUID
   * @returns {Promise<Array>}
   */
  async getAssets(vaultId = DEFAULT_MOCK_VAULT_ID) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    const all = getStoredAssets()
    return all.filter((item) => !vaultId || item.vaultId === vaultId)
  },

  /**
   * Mock getAssetById with simulated latency.
   * @param {string} vaultId - Vault UUID
   * @param {string} assetId - Asset UUID
   * @returns {Promise<Object>} AssetResponse (no payload included)
   */
  async getAssetById(vaultId = DEFAULT_MOCK_VAULT_ID, assetId) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const all = getStoredAssets()
    const found = all.find(
      (item) => item.id === assetId && (!vaultId || item.vaultId === vaultId)
    )
    if (!found) {
      throw new Error(`Asset not found: ${assetId}`)
    }
    return { ...found }
  },

  /**
   * Mock createAsset with simulated latency and storage.
   * @param {Object} assetData - { name, assetType, description, payload, vaultId }
   * @returns {Promise<Object>} AssetResponse (no payload included)
   */
  async createAsset(assetData) {
    await new Promise((resolve) => setTimeout(resolve, 450))

    const now = new Date().toISOString()
    // Discard payload plaintext immediately — store ONLY hasPayload: true
    const hasPayload = Boolean(
      assetData.payload && String(assetData.payload).trim().length > 0
    )

    const newAsset = {
      id: generateMockUUID(),
      vaultId: assetData.vaultId || DEFAULT_MOCK_VAULT_ID,
      name: (assetData.name || '').trim(),
      assetType: assetData.assetType || 'TEXT',
      description: (assetData.description || '').trim(),
      hasPayload,
      createdAt: now,
      updatedAt: now,
    }

    // Persist to storage without plaintext payload
    const current = getStoredAssets()
    saveStoredAssets([newAsset, ...current])

    return newAsset
  },

  /**
   * Mock updateAsset with simulated latency and storage.
   * Updates only valid fields (name, description, payload).
   * Refreshes updatedAt. Never stores plaintext payload.
   *
   * @param {string} vaultId - Vault UUID
   * @param {string} assetId - Asset UUID
   * @param {Object} patchData - { name?, description?, payload? }
   * @returns {Promise<Object>} Updated AssetResponse
   */
  async updateAsset(vaultId = DEFAULT_MOCK_VAULT_ID, assetId, patchData) {
    await new Promise((resolve) => setTimeout(resolve, 350))

    const all = getStoredAssets()
    const index = all.findIndex(
      (item) => item.id === assetId && (!vaultId || item.vaultId === vaultId)
    )
    if (index === -1) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const current = all[index]
    const now = new Date().toISOString()

    let newHasPayload = current.hasPayload
    if (patchData.payload !== undefined && patchData.payload !== null) {
      const trimmed = String(patchData.payload).trim()
      if (trimmed.length > 0) {
        newHasPayload = true
      }
    }

    const updatedAsset = {
      ...current,
      name: patchData.name !== undefined ? patchData.name.trim() : current.name,
      description:
        patchData.description !== undefined
          ? patchData.description.trim()
          : current.description,
      hasPayload: newHasPayload,
      updatedAt: now,
    }

    // Discard any payload before saving to storage
    const nextList = [...all]
    nextList[index] = updatedAsset
    saveStoredAssets(nextList)

    return { ...updatedAsset }
  },
}
