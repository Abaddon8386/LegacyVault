import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assetService, isAssetPreview } from './assetService'
import { assetMock } from '../mocks/assetMock'

const vaultId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const asset = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', vaultId, name: 'Note',
  assetType: 'TEXT', description: '', hasPayload: true,
  createdAt: '2026-10-12T00:00:00Z', updatedAt: '2026-10-12T00:00:00Z' }
const envelope = { content: [asset], page: 0, size: 10, totalElements: 1, totalPages: 1 }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

describe('PS-5 asset adapter boundaries', () => {
  beforeEach(() => { vi.stubEnv('PROD', false); vi.stubEnv('DEV', true) })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('uses the live endpoint by default and sends pagination, locale and caller token', async () => {
    const fetch = vi.fn().mockResolvedValue(json(envelope))
    vi.stubGlobal('fetch', fetch)
    expect(await assetService.getAssets(vaultId, { lang: 'en', accessToken: 'TEST_ONLY' })).toEqual(envelope)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/vaults/${vaultId}/assets?page=0&size=10&sort=createdAt%2Cdesc`),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer TEST_ONLY', 'Accept-Language': 'en' }) }))
  })

  it('never substitutes the preview vault ID in live mode', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(assetService.getAssets()).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
    await expect(assetService.createAsset(undefined, {})).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('blocks preview in production even if mock flags are supplied', async () => {
    vi.stubEnv('PROD', true); vi.stubEnv('DEV', true); vi.stubEnv('VITE_USE_MOCK', 'true')
    const mock = vi.spyOn(assetMock, 'getAssets')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(envelope)))
    expect(isAssetPreview({ isDevPreview: true })).toBe(false)
    await assetService.getAssets(vaultId, { isDevPreview: true })
    expect(mock).not.toHaveBeenCalled()
  })

  it('supports explicit DEV preview with memory-only metadata', async () => {
    const secret = '  SECRET_PRESERVE_SPACES  '
    const created = await assetService.createAsset(undefined, { name: 'Preview', assetType: 'TEXT', payload: secret }, { isDevPreview: true })
    expect(created.hasPayload).toBe(true)
    expect(created).not.toHaveProperty('payload')
    expect(JSON.stringify(localStorage)).not.toContain('Preview')
    expect(JSON.stringify(localStorage)).not.toContain(secret)
  })

  it.each([
    ['HTML fallback', () => new Response('<html>SPA</html>', { headers: { 'content-type': 'text/html' } })],
    ['malformed JSON', () => new Response('{', { headers: { 'content-type': 'application/json' } })],
    ['bare array instead of paginated envelope', () => json([asset])],
    ['missing pagination', () => json({ content: [asset] })],
    ['inconsistent total', () => json({ ...envelope, totalElements: 0 })],
    ['unexpected payload', () => json({ ...envelope, content: [{ ...asset, payload: 'SECRET' }] })],
    ['wrong vault metadata', () => json({ ...envelope, content: [{ ...asset, vaultId: asset.id }] })],
  ])('rejects %s without returning sample success', async (_label, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()))
    await expect(assetService.getAssets(vaultId)).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
  })

  it.each([[400, 'VALIDATION_FAILED'], [401, 'UNAUTHENTICATED'], [403, 'ACCESS_DENIED'],
    [404, 'RESOURCE_NOT_FOUND'], [409, 'VAULT_NOT_EDITABLE'], [500, 'SERVER_ERROR']])('maps HTTP %s to a stable safe code', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ message: 'SQL SECRET', code: 'UNKNOWN' }, status)))
    await expect(assetService.getAssets(vaultId)).rejects.toMatchObject({ status, code, message: code })
  })

  it('does not interpret an HTML 401 as a successful list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('login', { status: 401 })))
    await expect(assetService.getAssets(vaultId)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  it('preserves secret bytes and only sends contract request fields', async () => {
    const fetch = vi.fn().mockResolvedValue(json(asset, 201)); vi.stubGlobal('fetch', fetch)
    await assetService.createAsset(vaultId, { name: ' Note ', assetType: 'TEXT', description: ' note ',
      payload: '  SECRET\n ', extra: 'ignored' })
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ name: 'Note', assetType: 'TEXT', description: 'note', payload: '  SECRET\n ' })
  })

  it('rejects create responses with a wrong status or exposed secret', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(json(asset, 200)).mockResolvedValueOnce(json({ ...asset, payload: 'SECRET' }, 201))
    vi.stubGlobal('fetch', fetch)
    const input = { name: 'Note', assetType: 'TEXT', payload: 'SECRET' }
    await expect(assetService.createAsset(vaultId, input)).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
    await expect(assetService.createAsset(vaultId, input)).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
  })

  it('validates create before any fetch and handles network errors safely', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('private details')); vi.stubGlobal('fetch', fetch)
    await expect(assetService.createAsset(vaultId, { name: '', payload: 'X' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    expect(fetch).not.toHaveBeenCalled()
    await expect(assetService.getAssets(vaultId)).rejects.toMatchObject({ code: 'NETWORK_ERROR', message: 'NETWORK_ERROR' })
  })
})
