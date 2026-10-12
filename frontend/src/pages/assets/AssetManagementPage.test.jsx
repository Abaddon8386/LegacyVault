import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssetManagementPage } from './AssetManagementPage'
import { translations } from '../../i18n/translations'
import { assetService } from '../../services/assetService'
import { assetMock } from '../../mocks/assetMock'

describe('AssetManagementPage Contract-Aligned UI Tests (PS-5)', () => {
  const t = translations.vi

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const mockAssets = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      vaultId: '00000000-0000-0000-0000-000000000001',
      name: 'Di chúc và tâm nguyện gia đình',
      assetType: 'TEXT',
      description: 'Ghi chú về phân định tài sản cho con cái',
      hasPayload: true,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      vaultId: '00000000-0000-0000-0000-000000000001',
      name: 'Mật khẩu ví lạnh Ledger',
      assetType: 'CREDENTIAL',
      description: 'Cụm từ phục hồi bí mật để trong két',
      hasPayload: true,
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: '2026-09-10T00:00:00Z',
    },
  ]

  it('renders loading state initially and then shows asset list with summary cards', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: mockAssets, totalElements: mockAssets.length })

    render(<AssetManagementPage t={t} />)

    // Check loading indicator is shown initially
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Wait for assets to render
    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    })

    // Check Summary card values
    expect(screen.getByText(t.assets.stats.totalCount)).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getAllByText(t.assets.stats.securityStatus).length).toBeGreaterThan(0)

    // Business rule banner check
    expect(
      screen.getByText(/Lưu ý pháp lý: Tài sản lưu trong hệ thống mang tính chất ghi nhận/i)
    ).toBeInTheDocument()
  })

  it('collapses legal notice when clicking "Đã hiểu" and shows ⓘ icon', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: mockAssets, totalElements: mockAssets.length })

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getByText(t.assets.noticeDismiss)).toBeInTheDocument()
    })

    // Click "Đã hiểu"
    const dismissBtn = screen.getByText(t.assets.noticeDismiss)
    fireEvent.click(dismissBtn)

    // Banner should be removed from view
    expect(screen.queryByText(t.assets.noticeDismiss)).not.toBeInTheDocument()

    // Info pill button should be visible next to title
    expect(
      screen.getByRole('button', { name: new RegExp(t.assets.noticeInfoTooltip, 'i') })
    ).toBeInTheDocument()
  })

  it('filters assets by search keyword', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: mockAssets, totalElements: mockAssets.length })

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
    })

    const searchInput = screen.getByPlaceholderText(t.assets.searchPlaceholder)
    fireEvent.change(searchInput, { target: { value: 'Ledger' } })

    expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    expect(screen.queryByText('Di chúc và tâm nguyện gia đình')).not.toBeInTheDocument()
  })

  it('filters assets by assetType (TEXT vs CREDENTIAL)', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: mockAssets, totalElements: mockAssets.length })

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
    })

    const typeSelect = screen.getByLabelText(t.assets.filterAria)
    fireEvent.change(typeSelect, { target: { value: 'CREDENTIAL' } })

    expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    expect(screen.queryByText('Di chúc và tâm nguyện gia đình')).not.toBeInTheDocument()
  })

  it('validates required fields before allowing asset creation', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: mockAssets, totalElements: mockAssets.length })

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
    })

    // Open Add Modal
    const addBtns = screen.getAllByRole('button', { name: new RegExp(t.assets.addNewBtn, 'i') })
    fireEvent.click(addBtns[0])

    expect(screen.getByRole('heading', { name: t.assets.addModal.title })).toBeInTheDocument()

    // Click submit without entering required inputs
    const submitBtn = screen.getByRole('button', { name: t.assets.addModal.submitBtn })
    fireEvent.click(submitBtn)

    // Expect validation errors for required contract fields
    expect(screen.getByText(t.assets.validation.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(t.assets.validation.typeRequired)).toBeInTheDocument()
    expect(screen.getByText(t.assets.validation.payloadRequired)).toBeInTheDocument()

    // Non-blank short name (e.g. 1-2 chars) is valid (no min-3 requirement)
    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    fireEvent.change(nameInput, { target: { value: 'AB' } })
    fireEvent.click(submitBtn)
    expect(screen.queryByText(t.assets.validation.nameRequired)).not.toBeInTheDocument()
  })

  it('creates asset with write-only payload and ensures payload is not in DOM or localStorage', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: mockAssets, totalElements: mockAssets.length })

    const secretPassword = 'SUPER_CONFIDENTIAL_KEY_987654321'
    const newMockAsset = {
      id: '33333333-3333-4333-8333-333333333333',
      vaultId: '00000000-0000-0000-0000-000000000001',
      name: 'Khóa API Server Bí Mật',
      assetType: 'CREDENTIAL',
      description: 'API Key giao dịch số',
      hasPayload: true,
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    }
    vi.spyOn(assetService, 'createAsset').mockImplementation(async () => {
      assetService.getAssets.mockResolvedValue({ content: [newMockAsset, ...mockAssets], totalElements: 3 })
      return newMockAsset
    })

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
    })

    // Open Add Modal
    const addBtns = screen.getAllByRole('button', { name: new RegExp(t.assets.addNewBtn, 'i') })
    fireEvent.click(addBtns[0])

    // Fill form
    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    const typeSelect = document.getElementById('asset-type')
    const payloadInput = screen.getByPlaceholderText(t.assets.addModal.payloadPlaceholder)
    const descInput = screen.getByPlaceholderText(t.assets.addModal.descriptionPlaceholder)

    fireEvent.change(nameInput, { target: { value: 'Khóa API Server Bí Mật' } })
    fireEvent.change(typeSelect, { target: { value: 'CREDENTIAL' } })
    fireEvent.change(payloadInput, { target: { value: secretPassword } })
    fireEvent.change(descInput, { target: { value: 'API Key giao dịch số' } })

    const submitBtn = screen.getByRole('button', { name: t.assets.addModal.submitBtn })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getAllByText('Khóa API Server Bí Mật').length).toBeGreaterThan(0)
    })

    // Verify plaintext secret is NEVER rendered anywhere in the DOM
    expect(screen.queryByText(secretPassword)).not.toBeInTheDocument()

    // Test assetMock directly to verify plaintext payload is discarded and NOT saved to localStorage
    const createdByMock = await assetMock.createAsset({
      name: 'Mật mã thực tế',
      assetType: 'TEXT',
      description: 'Ghi chú',
      payload: 'SECRET_NEVER_SAVED_PLAINTEXT',
    })

    expect(createdByMock.hasPayload).toBe(true)
    expect(createdByMock.payload).toBeUndefined()

    // Inspect localStorage string
    const rawStorage = localStorage.getItem('legacyvault_mock_assets_v2') || ''
    expect(rawStorage).not.toContain('SECRET_NEVER_SAVED_PLAINTEXT')
  })

  it('handles error state gracefully with retry button', async () => {
    vi.spyOn(assetService, 'getAssets').mockRejectedValueOnce(new Error('Network error'))

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(t.assets.alerts.loadError)).toBeInTheDocument()
    })

    // Ensure retry button is available
    expect(
      screen.getByRole('button', { name: new RegExp(t.assets.alerts.retryBtn, 'i') })
    ).toBeInTheDocument()
  })
})

describe('AssetManagementPage PS-6 View & Edit Asset Tests', () => {
  const t = translations.vi

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    vi.spyOn(assetService, 'getAssetById').mockResolvedValue(mockAssets[1])
  })

  const mockAssets = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      vaultId: '00000000-0000-0000-0000-000000000001',
      name: 'Di chúc và tâm nguyện gia đình',
      assetType: 'TEXT',
      description: 'Ghi chú về phân định tài sản cho con cái',
      hasPayload: true,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      vaultId: '00000000-0000-0000-0000-000000000001',
      name: 'Mật khẩu ví lạnh Ledger',
      assetType: 'CREDENTIAL',
      description: 'Cụm từ phục hồi bí mật để trong két',
      hasPayload: true,
      createdAt: '2026-09-10T00:00:00Z',
      updatedAt: '2026-09-10T00:00:00Z',
    },
  ]

  it('opens View Asset detail modal and displays only allowed contract fields without exposing payload', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [...mockAssets].reverse(), totalElements: mockAssets.length })
    vi.spyOn(assetService, 'getAssetById').mockResolvedValue(mockAssets[1])

    render(<AssetManagementPage t={t} vaultId={mockAssets[1].vaultId} />)

    await waitFor(() => {
      expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    })

    // Click "Xem chi tiết" button for first row
    const viewButtons = screen.getAllByRole('button', { name: new RegExp(t.assets.actions.viewDetail, 'i') })
    fireEvent.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: t.assets.detailModal.title })).toBeInTheDocument()
    })

    // Check allowed contract fields are shown
    expect(screen.getByText(t.assets.detailModal.nameLabel)).toBeInTheDocument()
    expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    expect(screen.getByText(t.assets.detailModal.descLabel)).toBeInTheDocument()
    expect(screen.getAllByText('Cụm từ phục hồi bí mật để trong két').length).toBeGreaterThan(0)
    expect(screen.getAllByText(t.assets.detailModal.payloadLabel).length).toBeGreaterThan(0)
    expect(screen.getByText(t.assets.detailModal.createdAtLabel)).toBeInTheDocument()
    expect(screen.getByText(t.assets.detailModal.updatedAtLabel)).toBeInTheDocument()

    // Assert that no secret payload input/field or value is rendered in detail modal
    expect(screen.queryByPlaceholderText(t.assets.addModal.payloadPlaceholder)).not.toBeInTheDocument()
    expect(screen.queryByText(/SUPER_SECRET/i)).not.toBeInTheDocument()

    // Can close the modal
    const closeBtn = screen.getAllByRole('button', { name: t.assets.detailModal.closeBtn })[0]
    fireEvent.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: t.assets.detailModal.title })).not.toBeInTheDocument()
    })
  })

  it('opens Edit Asset modal prefilled with editable metadata only, assetType is read-only, and payload starts empty', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [...mockAssets].reverse(), totalElements: mockAssets.length })
    vi.spyOn(assetService, 'getAssetById').mockResolvedValue(mockAssets[1])

    render(<AssetManagementPage t={t} vaultId={mockAssets[1].vaultId} />)

    await waitFor(() => {
      expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    })

    // Click "Chỉnh sửa" for first asset row (mockAssets[1] because sorted desc by createdAt)
    const editButtons = screen.getAllByRole('button', { name: new RegExp(t.assets.actions.edit, 'i') })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: t.assets.editModal.title })).toBeInTheDocument()
    })

    // Name is prefilled
    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    expect(nameInput.value).toBe('Mật khẩu ví lạnh Ledger')

    // Description is prefilled
    const descInput = screen.getByPlaceholderText(t.assets.editModal.descriptionPlaceholder)
    expect(descInput.value).toBe('Cụm từ phục hồi bí mật để trong két')

    // assetType is displayed as read-only (not an editable select)
    expect(screen.queryByLabelText(t.assets.addModal.typeLabel)).not.toBeInTheDocument()
    expect(screen.getAllByText(t.assets.editModal.typeLabel).length).toBeGreaterThan(0)

    // payload field starts completely empty
    const payloadInput = screen.getByPlaceholderText(t.assets.editModal.payloadPlaceholder)
    expect(payloadInput.value).toBe('')
  })

  it('submitting Edit with blank payload omits payload from patch body', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [...mockAssets].reverse(), totalElements: mockAssets.length })
    const updateSpy = vi.spyOn(assetService, 'updateAsset').mockImplementation(async () => {
      const updated = {
      ...mockAssets[1],
      name: 'Mật khẩu ví lạnh đã đổi tên',
      description: 'Mô tả mới',
      updatedAt: '2026-10-12T12:00:00Z',
      }
      assetService.getAssets.mockResolvedValue({ content: [updated, mockAssets[0]], totalElements: 2 })
      return updated
    })

    render(<AssetManagementPage t={t} vaultId={mockAssets[1].vaultId} />)

    await waitFor(() => {
      expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    })

    const editButtons = screen.getAllByRole('button', { name: new RegExp(t.assets.actions.edit, 'i') })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: t.assets.editModal.title })).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    const descInput = screen.getByPlaceholderText(t.assets.editModal.descriptionPlaceholder)
    const payloadInput = screen.getByPlaceholderText(t.assets.editModal.payloadPlaceholder)

    // Modify name and description, but leave payload blank
    fireEvent.change(nameInput, { target: { value: 'Mật khẩu ví lạnh đã đổi tên' } })
    fireEvent.change(descInput, { target: { value: 'Mô tả mới' } })
    expect(payloadInput.value).toBe('')

    const submitBtn = screen.getByRole('button', { name: t.assets.editModal.submitBtn })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1)
    })

    // Verify patch body does NOT include payload property
    const [calledVaultId, calledAssetId, patchData] = updateSpy.mock.calls[0]
    expect(calledVaultId).toBe(mockAssets[1].vaultId)
    expect(calledAssetId).toBe(mockAssets[1].id)
    expect(patchData).toEqual({
      name: 'Mật khẩu ví lạnh đã đổi tên',
      description: 'Mô tả mới',
    })
    expect(patchData.payload).toBeUndefined()

    // UI refreshes with the updated name
    await waitFor(() => {
      expect(screen.getAllByText('Mật khẩu ví lạnh đã đổi tên').length).toBeGreaterThan(0)
    })
  })

  it('submitting Edit with new payload never stores or renders plaintext payload and refreshes UI', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [...mockAssets].reverse(), totalElements: mockAssets.length })
    const newSecret = 'MY_SUPER_TOP_SECRET_REPLACEMENT_KEY_777'

    const updateSpy = vi.spyOn(assetService, 'updateAsset').mockImplementation(async () => {
      const updated = {
      ...mockAssets[1],
      name: 'Mật khẩu ví lạnh có khóa mới',
      hasPayload: true,
      updatedAt: '2026-10-12T15:00:00Z',
      }
      assetService.getAssets.mockResolvedValue({ content: [updated, mockAssets[0]], totalElements: 2 })
      return updated
    })

    render(<AssetManagementPage t={t} vaultId={mockAssets[1].vaultId} />)

    await waitFor(() => {
      expect(screen.getAllByText('Mật khẩu ví lạnh Ledger').length).toBeGreaterThan(0)
    })

    const editButtons = screen.getAllByRole('button', { name: new RegExp(t.assets.actions.edit, 'i') })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: t.assets.editModal.title })).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    const payloadInput = screen.getByPlaceholderText(t.assets.editModal.payloadPlaceholder)

    fireEvent.change(nameInput, { target: { value: 'Mật khẩu ví lạnh có khóa mới' } })
    fireEvent.change(payloadInput, { target: { value: newSecret } })

    const submitBtn = screen.getByRole('button', { name: t.assets.editModal.submitBtn })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1)
    })

    // Verify UI has updated
    await waitFor(() => {
      expect(screen.getAllByText('Mật khẩu ví lạnh có khóa mới').length).toBeGreaterThan(0)
    })

    // Verify secret is NEVER in the DOM
    expect(screen.queryByText(newSecret)).not.toBeInTheDocument()

    // Test assetMock directly: first create an asset, then update it
    const createdInMock = await assetMock.createAsset({
      name: 'Tài sản kiểm tra mock update',
      assetType: 'TEXT',
      description: 'Mô tả',
      payload: 'OLD_PAYLOAD',
    })

    const updatedInMock = await assetMock.updateAsset(createdInMock.vaultId, createdInMock.id, {
      name: 'Tài sản kiểm tra mock update đã sửa',
      payload: 'ANOTHER_SECRET_TEST_123',
    })

    expect(updatedInMock.name).toBe('Tài sản kiểm tra mock update đã sửa')
    expect(updatedInMock.hasPayload).toBe(true)
    expect(updatedInMock.payload).toBeUndefined()

    const rawStorage = localStorage.getItem('legacyvault_mock_assets_v2') || ''
    expect(rawStorage).not.toContain('ANOTHER_SECRET_TEST_123')
  })

  it('validates name required and max length during Edit', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [...mockAssets].reverse(), totalElements: mockAssets.length })

    render(<AssetManagementPage t={t} vaultId={mockAssets[1].vaultId} />)

    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
    })

    const editButtons = screen.getAllByRole('button', { name: new RegExp(t.assets.actions.edit, 'i') })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: t.assets.editModal.title })).toBeInTheDocument()
    })

    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    const submitBtn = screen.getByRole('button', { name: t.assets.editModal.submitBtn })

    // Clear name
    fireEvent.change(nameInput, { target: { value: '   ' } })
    fireEvent.click(submitBtn)

    expect(screen.getByText(t.assets.validation.nameRequired)).toBeInTheDocument()

    // Test max length > 150
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(151) } })
    fireEvent.click(submitBtn)

    expect(screen.getByText(t.assets.validation.nameMax)).toBeInTheDocument()
  })

  it('handles edit failure error gracefully', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [...mockAssets].reverse(), totalElements: mockAssets.length })
    vi.spyOn(assetService, 'updateAsset').mockRejectedValue(new Error('Update failed'))

    render(<AssetManagementPage t={t} vaultId={mockAssets[1].vaultId} />)

    await waitFor(() => {
      expect(screen.getAllByText('Di chúc và tâm nguyện gia đình').length).toBeGreaterThan(0)
    })

    const editButtons = screen.getAllByRole('button', { name: new RegExp(t.assets.actions.edit, 'i') })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: t.assets.editModal.title })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(t.assets.addModal.namePlaceholder), { target: { value: 'Changed name' } })
    const submitBtn = screen.getByRole('button', { name: t.assets.editModal.submitBtn })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(t.assets.alerts.editError)).toBeInTheDocument()
    })
  })
})
