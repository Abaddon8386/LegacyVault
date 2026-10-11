import { assetMock } from '../mocks/assetMock'

/**
 * Asset Service — PS-5: Add & List only.
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
   * @param {string} vaultId
   * @returns {Promise<Array>}
   */
  async getAssets(vaultId = 'vault_default') {
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
   * Add a new asset to the vault.
   * @param {Object} assetData
   * @returns {Promise<Object>}
   */
  async createAsset(assetData) {
    if (USE_MOCK) {
      return assetMock.createAsset(assetData)
    }

    const response = await fetch(
      `${API_BASE_URL}/vaults/${assetData.vaultId || 'vault_default'}/assets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to create asset: ${response.statusText}`)
    }
    return response.json()
  },
}
