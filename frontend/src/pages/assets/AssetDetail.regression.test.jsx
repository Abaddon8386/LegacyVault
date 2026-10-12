import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AssetManagementPage } from './AssetManagementPage'
import { assetService } from '../../services/assetService'
import { translations } from '../../i18n/translations'

const t = translations.vi
const vaultId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const asset = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', vaultId, name: 'Private note', assetType: 'TEXT',
  description: 'Current description', hasPayload: true, createdAt: '2026-10-12T00:00:00Z', updatedAt: '2026-10-12T00:00:00Z' }
const page = props => <AssetManagementPage t={t} vaultId={vaultId} {...props} />
const open = async mode => {
  await screen.findAllByText(asset.name)
  const label = mode === 'view' ? t.assets.actions.viewDetail : t.assets.actions.edit
  fireEvent.click(screen.getAllByRole('button', { name: `${label}: ${asset.name}` })[0])
}
const editor = async () => screen.findByLabelText(/^Tên tài sản/)
beforeEach(() => {
  vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [asset], totalElements: 1 })
  vi.spyOn(assetService, 'getAssetById').mockResolvedValue(asset)
})
afterEach(() => vi.restoreAllMocks())

describe('PS-6 authorization, refresh and form regressions', () => {
  it.each(['ACCESS_DENIED', 'RESOURCE_NOT_FOUND'])('never displays cached details or an edit form after %s', async code => {
    assetService.getAssetById.mockRejectedValue({ code })
    render(page())
    await open('view')
    await screen.findByText(t.assets.alerts[code])
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.queryByText(t.assets.detailModal.nameLabel)).not.toBeInTheDocument()
    expect(dialog.queryByText(asset.description)).not.toBeInTheDocument()
    fireEvent.click(dialog.getByRole('button', { name: t.assets.closeBtn }))
    await open('edit')
    await screen.findByText(t.assets.alerts[code])
    expect(screen.queryByLabelText(/^Tên tài sản/)).not.toBeInTheDocument()
  })

  it('uses a fresh GET before editing and provides a retry for failed detail requests', async () => {
    assetService.getAssetById.mockRejectedValueOnce({ code: 'NETWORK_ERROR' }).mockResolvedValueOnce({ ...asset, description: 'Fresh description' })
    render(page())
    await open('edit')
    await screen.findByText(t.assets.alerts.NETWORK_ERROR)
    fireEvent.click(screen.getByRole('button', { name: t.assets.alerts.retryBtn }))
    await editor()
    expect(screen.getByLabelText(t.assets.editModal.descriptionLabel)).toHaveValue('Fresh description')
    expect(assetService.getAssetById).toHaveBeenLastCalledWith(vaultId, asset.id, expect.objectContaining({ isDevPreview: false }))
  })

  it('ignores a detail response after the user closes the loading dialog', async () => {
    let resolveDetail
    assetService.getAssetById.mockImplementation(() => new Promise(resolve => { resolveDetail = resolve }))
    render(page())
    await open('view')
    expect(screen.getByText(t.assets.alerts.detailLoading)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t.assets.closeBtn }))
    await act(async () => resolveDetail(asset))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(assetService.getAssetById.mock.calls[0][2].signal.aborted).toBe(true)
  })

  it('does not display an old detail response after Vault context changes', async () => {
    let resolveDetail
    assetService.getAssetById.mockImplementation(() => new Promise(resolve => { resolveDetail = resolve }))
    const view = render(page())
    await open('view')
    view.rerender(page({ vaultId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }))
    await act(async () => resolveDetail(asset))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('rejects no-op edits and translates form validation without clearing input', async () => {
    const update = vi.spyOn(assetService, 'updateAsset')
    const view = render(page())
    await open('edit'); await editor()
    fireEvent.click(screen.getByRole('button', { name: t.assets.editModal.submitBtn }))
    expect(screen.getByText(t.assets.editModal.noChangesError)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/^Tên tài sản/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: t.assets.editModal.submitBtn }))
    view.rerender(page({ lang: 'en', t: translations.en }))
    expect(screen.getByText(translations.en.assets.validation.nameRequired)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Asset Name/)).toHaveValue('')
    expect(assetService.getAssetById).toHaveBeenCalledOnce()
  })

  it('preserves secret bytes, omits unchanged fields and refetches list after saving', async () => {
    const update = vi.spyOn(assetService, 'updateAsset').mockResolvedValue({ ...asset, updatedAt: '2026-10-12T01:00:00Z' })
    render(page())
    await open('edit'); await editor()
    fireEvent.change(screen.getByLabelText(t.assets.editModal.payloadLabel), { target: { value: '  TEST_SECRET\n ' } })
    fireEvent.click(screen.getByRole('button', { name: t.assets.editModal.submitBtn }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(update).toHaveBeenCalledWith(vaultId, asset.id, { payload: '  TEST_SECRET\n ' }, expect.any(Object))
    await waitFor(() => expect(assetService.getAssets).toHaveBeenCalledTimes(2))
    expect(screen.queryByDisplayValue('  TEST_SECRET\n ')).not.toBeInTheDocument()
    await screen.findAllByText(asset.name)
    await open('edit'); await editor()
    expect(screen.getByLabelText(t.assets.editModal.payloadLabel)).toHaveValue('')
  })

  it('keeps inputs after network/save failure and translates its inline error', async () => {
    vi.spyOn(assetService, 'updateAsset').mockRejectedValue({ code: 'NETWORK_ERROR' })
    const view = render(page())
    await open('edit'); await editor()
    fireEvent.change(screen.getByLabelText(t.assets.editModal.payloadLabel), { target: { value: 'TEST_SECRET' } })
    fireEvent.click(screen.getByRole('button', { name: t.assets.editModal.submitBtn }))
    await screen.findByText(t.assets.alerts.NETWORK_ERROR)
    view.rerender(page({ lang: 'en', t: translations.en }))
    expect(screen.getByLabelText(translations.en.assets.editModal.payloadLabel)).toHaveValue('TEST_SECRET')
    expect(screen.getByText(translations.en.assets.alerts.NETWORK_ERROR)).toBeInTheDocument()
  })

  it.each(['UNAUTHENTICATED', 'ACCESS_DENIED', 'RESOURCE_NOT_FOUND', 'VAULT_NOT_EDITABLE'])('removes editable metadata and secrets on update error %s', async code => {
    vi.spyOn(assetService, 'updateAsset').mockRejectedValue({ code })
    render(page())
    await open('edit'); await editor()
    fireEvent.change(screen.getByLabelText(t.assets.editModal.payloadLabel), { target: { value: 'TEST_SECRET' } })
    fireEvent.click(screen.getByRole('button', { name: t.assets.editModal.submitBtn }))
    await screen.findByText(t.assets.alerts[code])
    expect(screen.queryByLabelText(/^Tên tài sản/)).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('TEST_SECRET')).not.toBeInTheDocument()
  })

  it('blocks close and duplicate update while a save is pending', async () => {
    let resolveSave
    const update = vi.spyOn(assetService, 'updateAsset').mockImplementation(() => new Promise(resolve => { resolveSave = resolve }))
    render(page())
    await open('edit'); await editor()
    fireEvent.change(screen.getByLabelText(/^Tên tài sản/), { target: { value: 'Changed' } })
    const submit = screen.getByRole('button', { name: t.assets.editModal.submitBtn })
    fireEvent.click(submit); fireEvent.click(submit)
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('dialog').parentElement)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(update).toHaveBeenCalledOnce()
    await act(async () => resolveSave({ ...asset, name: 'Changed' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
