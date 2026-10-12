/**
 * Memory-only DEV preview data for Assets (PS-5 Contract Alignment).
 * All mock data and simulation logic belong strictly in src/mocks/.
 *
 * NOTE: Fields strictly align with the proposed PS-74 Asset API contract (AssetResponse):
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
 * persisted to browser storage or returned in preview responses.
 */

export const DEFAULT_MOCK_VAULT_ID = '00000000-0000-0000-0000-000000000001'


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

let previewAssets = INITIAL_MOCK_ASSETS.map(item => ({ ...item }))

function getStoredAssets() { return previewAssets.map(item => ({ ...item })) }
function saveStoredAssets(assets) { previewAssets = assets }

export const assetMock = {
  async getAssetById(vaultId, assetId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const asset = getStoredAssets().find(item => item.id === assetId && item.vaultId === vaultId)
    if (!asset) throw Object.assign(new Error('RESOURCE_NOT_FOUND'), { code: 'RESOURCE_NOT_FOUND', status: 404 })
    return { ...asset }
  },

  async updateAsset(vaultId, assetId, patchData) {
    await new Promise(resolve => setTimeout(resolve, 350))
    const all = getStoredAssets()
    const index = all.findIndex(item => item.id === assetId && item.vaultId === vaultId)
    if (index === -1) throw Object.assign(new Error('RESOURCE_NOT_FOUND'), { code: 'RESOURCE_NOT_FOUND', status: 404 })
    const current = all[index]
    const updated = { ...current,
      name: patchData.name === undefined ? current.name : patchData.name.trim(),
      description: patchData.description === undefined ? current.description : patchData.description.trim(),
      hasPayload: patchData.payload?.trim() ? true : current.hasPayload,
      updatedAt: new Date().toISOString(),
    }
    // Never store the secret or other fields supplied by callers.
    all[index] = updated
    saveStoredAssets(all)
    return { ...updated }
  },

  /**
   * Mock getAssets with simulated latency.
   * @param {string} vaultId - Vault UUID
   * @returns {Promise<Array>}
   */
  async getAssets(vaultId = DEFAULT_MOCK_VAULT_ID) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    const all = getStoredAssets()
    // TODO(mock): Vault filtering will be handled by backend API
    return all.filter((item) => !vaultId || item.vaultId === vaultId)
  },

  /**
   * Mock createAsset with simulated latency and memory-only metadata.
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

    // Keep only preview metadata in memory, never persist user inputs
    const current = getStoredAssets()
    saveStoredAssets([newAsset, ...current])

    return newAsset
  },
}
