import { assetMock, DEFAULT_MOCK_VAULT_ID } from '../mocks/assetMock'

/**
 * Asset Service — PS-5 & PS-6 (Contract Aligned).
 * Component only calls through this service.
 * Service decides whether to use mock or real API based on VITE_USE_MOCK.
 */

// Defaults to true during frontend prototype development or testing unless explicitly set to 'false'
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_USE_MOCK === undefined ||
  import.meta.env.MODE === 'test'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const assetService = {
  /**
   * Fetch asset list for the specified vault.
   * GET /api/v1/vaults/{vaultId}/assets
   * @param {string} vaultId - Vault UUID
   * @returns {Promise<Array>} List of AssetResponse
   */
  async getAssets(vaultId = DEFAULT_MOCK_VAULT_ID) {
    if (USE_MOCK) {
      return assetMock.getAssets(vaultId)
    }

    const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/assets`)
    if (!response.ok) {
      throw new Error(`Failed to fetch assets: ${response.statusText}`)
    }
    return response.json()
  },

  /**
   * Fetch asset details by ID.
   * GET /api/v1/vaults/{vaultId}/assets/{assetId}
   * @param {string} vaultId - Vault UUID
   * @param {string} assetId - Asset UUID
   * @returns {Promise<Object>} AssetResponse (no payload returned)
   */
  async getAssetById(vaultId = DEFAULT_MOCK_VAULT_ID, assetId) {
    if (USE_MOCK) {
      return assetMock.getAssetById(vaultId, assetId)
    }

    const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/assets/${assetId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch asset detail: ${response.statusText}`)
    }
    return response.json()
  },

  /**
   * Add a new asset to the vault.
   * POST /api/v1/vaults/{vaultId}/assets
   * @param {string|Object} vaultIdOrData - Vault UUID or asset data object
   * @param {Object} [maybeAssetData] - { name, assetType, description, payload }
   * @returns {Promise<Object>} AssetResponse (no payload returned)
   */
  async createAsset(vaultIdOrData, maybeAssetData) {
    let vaultId = DEFAULT_MOCK_VAULT_ID
    let assetData = {}

    if (typeof vaultIdOrData === 'string') {
      vaultId = vaultIdOrData
      assetData = maybeAssetData || {}
    } else if (typeof vaultIdOrData === 'object' && vaultIdOrData !== null) {
      assetData = vaultIdOrData
      vaultId = assetData.vaultId || DEFAULT_MOCK_VAULT_ID
    }

    const payloadBody = {
      name: assetData.name,
      assetType: assetData.assetType,
      description: assetData.description,
      payload: assetData.payload,
      vaultId,
    }

    if (USE_MOCK) {
      return assetMock.createAsset(payloadBody)
    }

    const response = await fetch(
      `${API_BASE_URL}/vaults/${vaultId}/assets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: payloadBody.name,
          assetType: payloadBody.assetType,
          description: payloadBody.description,
          payload: payloadBody.payload,
        }),
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to create asset: ${response.statusText}`)
    }
    return response.json()
  },

  /**
   * Update an existing asset.
   * PATCH /api/v1/vaults/{vaultId}/assets/{assetId}
   * Editable fields: name, description, payload.
   * @param {string} vaultId - Vault UUID
   * @param {string} assetId - Asset UUID
   * @param {Object} patchData - { name?, description?, payload? }
   * @returns {Promise<Object>} Updated AssetResponse
   */
  async updateAsset(vaultId = DEFAULT_MOCK_VAULT_ID, assetId, patchData) {
    if (USE_MOCK) {
      return assetMock.updateAsset(vaultId, assetId, patchData)
    }

    const response = await fetch(
      `${API_BASE_URL}/vaults/${vaultId}/assets/${assetId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchData),
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to update asset: ${response.statusText}`)
    }
    return response.json()
  },
}
