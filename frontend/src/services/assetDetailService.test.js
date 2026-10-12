import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { assetService } from './assetService'
import { assetMock } from '../mocks/assetMock'

const vaultId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const assetId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const asset = { id: assetId, vaultId, name: 'Note', assetType: 'TEXT', description: 'Note description',
  hasPayload: true, createdAt: '2026-10-12T00:00:00Z', updatedAt: '2026-10-12T00:00:00Z' }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
beforeEach(() => { vi.stubEnv('PROD', false); vi.stubEnv('DEV', true) })
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('PS-6 detail/update API and secret boundaries', () => {
  it('loads exact asset metadata with authorization and locale', async () => {
    const fetch = vi.fn().mockResolvedValue(json(asset)); vi.stubGlobal('fetch', fetch)
    expect(await assetService.getAssetById(vaultId, assetId, { lang: 'en', accessToken: 'TEST_ONLY' })).toEqual(asset)
    expect(fetch).toHaveBeenCalledWith(`/api/v1/vaults/${vaultId}/assets/${assetId}`, expect.objectContaining({
      method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer TEST_ONLY', 'Accept-Language': 'en' }),
    }))
  })

  it.each([[403, 'ACCESS_DENIED'], [404, 'RESOURCE_NOT_FOUND']])('rejects detail and update HTTP %s', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(json({ code, message: 'PRIVATE SERVER DETAILS' }, status))))
    await expect(assetService.getAssetById(vaultId, assetId)).rejects.toMatchObject({ status, code, message: code })
    await expect(assetService.updateAsset(vaultId, assetId, { name: 'Changed' })).rejects.toMatchObject({ status, code })
  })

  it.each([
    ['wrong asset', { ...asset, id: vaultId }],
    ['wrong vault', { ...asset, vaultId: assetId }],
    ['exposed payload', { ...asset, payload: 'SECRET' }],
  ])('rejects %s responses for detail and update', async (_label, data) => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(json(data))))
    await expect(assetService.getAssetById(vaultId, assetId)).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
    await expect(assetService.updateAsset(vaultId, assetId, { name: 'Changed' })).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
  })

  it('sends only editable fields and preserves all secret whitespace', async () => {
    const fetch = vi.fn().mockResolvedValue(json({ ...asset, name: 'Changed', updatedAt: '2026-10-12T01:00:00Z' }))
    vi.stubGlobal('fetch', fetch)
    const updated = await assetService.updateAsset(vaultId, assetId, { name: ' Changed ', description: ' new ',
      payload: '  TEST_SECRET\n ', assetType: 'CREDENTIAL', vaultId: assetId, id: vaultId, createdAt: 'fake' })
    expect(updated.assetType).toBe('TEXT')
    expect(updated.createdAt).toBe(asset.createdAt)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ name: 'Changed', description: 'new', payload: '  TEST_SECRET\n ' })
    expect(fetch.mock.calls[0][1].method).toBe('PATCH')
    expect(updated).not.toHaveProperty('payload')
  })

  it('omits unspecified secret fields from a metadata-only patch', async () => {
    const fetch = vi.fn().mockResolvedValue(json(asset)); vi.stubGlobal('fetch', fetch)
    await assetService.updateAsset(vaultId, assetId, { name: 'Note' })
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ name: 'Note' })
  })

  it.each([{}, { assetType: 'CREDENTIAL' }, { name: ' ' }, { description: 'x'.repeat(1001) }, { payload: ' ' }])('rejects invalid/empty update before fetching', async data => {
      const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
      await expect(assetService.updateAsset(vaultId, assetId, data)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
      expect(fetch).not.toHaveBeenCalled()
    })

  it('requires real Vault context in live mode', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    await expect(assetService.getAssetById(undefined, assetId)).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
    await expect(assetService.updateAsset(undefined, assetId, { name: 'Changed' })).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('blocks mock detail/update in production despite preview flags', async () => {
    vi.stubEnv('PROD', true); vi.stubEnv('DEV', true); vi.stubEnv('VITE_USE_MOCK', 'true')
    const get = vi.spyOn(assetMock, 'getAssetById'), update = vi.spyOn(assetMock, 'updateAsset')
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(json(asset))))
    await assetService.getAssetById(vaultId, assetId, { isDevPreview: true })
    await assetService.updateAsset(vaultId, assetId, { name: 'Changed' }, { isDevPreview: true })
    expect(get).not.toHaveBeenCalled(); expect(update).not.toHaveBeenCalled()
  })

  it('keeps preview metadata in memory and denies cross-Vault access', async () => {
    const options = { isDevPreview: true }
    const created = await assetService.createAsset(undefined, { name: 'Preview asset', assetType: 'TEXT', payload: 'TEST_SECRET' }, options)
    const updated = await assetService.updateAsset(created.vaultId, created.id, { name: 'Updated', payload: 'TEST_NEW_SECRET' }, options)
    expect(await assetService.getAssetById(created.vaultId, created.id, options)).toEqual(updated)
    expect(JSON.stringify(localStorage)).not.toContain('TEST_NEW_SECRET')
    expect(updated).not.toHaveProperty('payload')
    await expect(assetService.getAssetById(vaultId, created.id, options)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
    await expect(assetService.updateAsset(vaultId, created.id, { name: 'Wrong vault' }, options)).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' })
  })
})
