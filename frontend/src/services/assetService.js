import { assetMock, DEFAULT_MOCK_VAULT_ID } from '../mocks/assetMock'

// PS-74 is a proposed contract. Mock requires explicit DEV preview.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const fail = (code, status = 0) => Object.assign(new Error(code), { code, status })

export function isAssetPreview(options = {}) {
  return !import.meta.env.PROD && Boolean(import.meta.env.DEV) && options.isDevPreview === true
}

function resolveVault(vaultId, options) {
  if (isAssetPreview(options)) return vaultId || DEFAULT_MOCK_VAULT_ID
  if (!UUID.test(vaultId || '')) throw fail('BACKEND_NOT_READY')
  return vaultId
}

function metadata(data, vaultId) {
  if (!data || !UUID.test(data.id || '') || data.vaultId !== vaultId ||
      typeof data.name !== 'string' || !data.name.trim() ||
      !['TEXT', 'CREDENTIAL'].includes(data.assetType) ||
      typeof data.hasPayload !== 'boolean' ||
      !(data.description == null || typeof data.description === 'string') ||
      !Number.isFinite(Date.parse(data.createdAt)) || !Number.isFinite(Date.parse(data.updatedAt)) ||
      Object.hasOwn(data, 'payload')) throw fail('BACKEND_NOT_READY')
  // Only metadata reaches page state; never expose unexpected secret fields.
  return { id: data.id, vaultId, name: data.name, assetType: data.assetType,
    description: data.description || '', hasPayload: data.hasPayload,
    createdAt: data.createdAt, updatedAt: data.updatedAt }
}

async function request(path, init, options) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init, signal: options.signal,
      headers: { Accept: 'application/json', 'Accept-Language': options.lang || 'vi',
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        ...init.headers },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw fail('NETWORK_ERROR')
  }
  const isJson = /application\/(?:[\w.+-]+\+)?json/i.test(response.headers.get('content-type') || '')
  if (!response.ok) {
    const data = isJson ? await response.json().catch(() => null) : null
    const codes = ['VALIDATION_FAILED', 'UNAUTHENTICATED', 'ACCESS_DENIED', 'RESOURCE_NOT_FOUND', 'VAULT_NOT_EDITABLE']
    const fallback = { 400: 'VALIDATION_FAILED', 401: 'UNAUTHENTICATED', 403: 'ACCESS_DENIED', 404: 'RESOURCE_NOT_FOUND', 409: 'VAULT_NOT_EDITABLE' }
    throw fail(codes.includes(data?.code) ? data.code : fallback[response.status] || 'SERVER_ERROR', response.status)
  }
  if (!isJson || response.status !== (init.method === 'POST' ? 201 : 200)) throw fail('BACKEND_NOT_READY')
  try { return await response.json() } catch { throw fail('BACKEND_NOT_READY') }
}

export const assetService = {
  async getAssets(vaultId, options = {}) {
    vaultId = resolveVault(vaultId, options)
    const page = Math.max(0, options.page || 0)
    const size = [5, 10, 20, 50].includes(options.size) ? options.size : 10
    const sort = /^(name|assetType|createdAt),(asc|desc)$/.test(options.sort || '') ? options.sort : 'createdAt,desc'
    let data
    if (isAssetPreview(options)) {
      const all = await assetMock.getAssets(vaultId)
      const [field, direction] = sort.split(',')
      all.sort((a, b) => String(a[field]).localeCompare(String(b[field])) * (direction === 'asc' ? 1 : -1))
      data = { content: all.slice(page * size, (page + 1) * size), page, size,
        totalElements: all.length, totalPages: Math.ceil(all.length / size) }
    } else {
      const query = new URLSearchParams({ page, size, sort })
      data = await request(`/vaults/${encodeURIComponent(vaultId)}/assets?${query}`, { method: 'GET' }, options)
    }
    if (!data || !Array.isArray(data.content) || data.page !== page || data.size !== size ||
        !Number.isInteger(data.totalElements) || data.totalElements < 0 ||
        !Number.isInteger(data.totalPages) || data.totalPages !== Math.ceil(data.totalElements / size) ||
        data.content.length !== Math.max(0, Math.min(size, data.totalElements - page * size))) throw fail('BACKEND_NOT_READY')
    return { ...data, content: data.content.map(item => metadata(item, vaultId)) }
  },

  async createAsset(vaultId, assetData, options = {}) {
    vaultId = resolveVault(vaultId, options)
    const body = { name: assetData.name?.trim(), assetType: assetData.assetType,
      description: assetData.description?.trim() || '', payload: assetData.payload }
    if (!body.name || body.name.length > 150 || !['TEXT', 'CREDENTIAL'].includes(body.assetType) ||
        body.description.length > 1000 || typeof body.payload !== 'string' || !body.payload.trim()) throw fail('VALIDATION_FAILED')
    const data = isAssetPreview(options)
      ? await assetMock.createAsset({ ...body, vaultId })
      : await request(`/vaults/${encodeURIComponent(vaultId)}/assets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }, options)
    return metadata(data, vaultId)
  },
}
