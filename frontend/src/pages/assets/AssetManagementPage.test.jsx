import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssetManagementPage } from './AssetManagementPage'
import { translations } from '../../i18n/translations'
import { assetService } from '../../services/assetService'

describe('AssetManagementPage Focused UI Tests', () => {
  const t = translations.vi

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const mockAssets = [
    {
      id: 'ast_1',
      vaultId: 'vault_default',
      name: 'Nhà phố Nguyễn Trãi',
      category: 'REAL_ESTATE',
      estimatedValue: 6000000000,
      documentRef: 'GCN-12345',
      description: 'Sổ đỏ chính chủ',
      createdAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'ast_2',
      vaultId: 'vault_default',
      name: 'Tài khoản Techcombank',
      category: 'BANK_ACCOUNT',
      estimatedValue: 200000000,
      documentRef: 'STK-999',
      description: 'Tiết kiệm',
      createdAt: '2026-09-10T00:00:00Z',
    },
  ]

  it('renders loading state initially and then shows asset list with summary cards', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue(mockAssets)

    render(<AssetManagementPage t={t} />)

    // Check loading indicator is shown initially
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Wait for assets to render
    await waitFor(() => {
      expect(screen.getAllByText('Nhà phố Nguyễn Trãi').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Tài khoản Techcombank').length).toBeGreaterThan(0)
    })

    // Check Summary card values
    expect(screen.getByText(t.assets.stats.totalValue)).toBeInTheDocument()
    expect(screen.getByText('6.200.000.000 đ')).toBeInTheDocument()
    expect(screen.getByText(t.assets.stats.totalCount)).toBeInTheDocument()

    // Business rule banner check
    expect(
      screen.getByText(/Lưu ý pháp lý: Tài sản lưu trong hệ thống mang tính chất ghi nhận/i)
    ).toBeInTheDocument()
  })

  it('collapses legal notice when clicking "Đã hiểu" and shows ⓘ icon', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue(mockAssets)

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
    expect(screen.getByRole('button', { name: new RegExp(t.assets.noticeInfoTooltip, 'i') })).toBeInTheDocument()
  })

  it('filters assets by search keyword', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue(mockAssets)

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Nhà phố Nguyễn Trãi').length).toBeGreaterThan(0)
    })

    const searchInput = screen.getByPlaceholderText(t.assets.searchPlaceholder)
    fireEvent.change(searchInput, { target: { value: 'Techcombank' } })

    expect(screen.getAllByText('Tài khoản Techcombank').length).toBeGreaterThan(0)
    expect(screen.queryByText('Nhà phố Nguyễn Trãi')).not.toBeInTheDocument()

    // Summary cards reflect filtered values
    expect(screen.getAllByText('200.000.000 đ').length).toBeGreaterThan(0)
  })

  it('validates required fields before allowing asset creation', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue(mockAssets)

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Nhà phố Nguyễn Trãi').length).toBeGreaterThan(0)
    })

    // Open Add Modal
    const addBtns = screen.getAllByRole('button', { name: new RegExp(t.assets.addNewBtn, 'i') })
    fireEvent.click(addBtns[0])

    expect(screen.getByRole('heading', { name: t.assets.addModal.title })).toBeInTheDocument()

    // Click submit without entering required inputs
    const submitBtn = screen.getByRole('button', { name: t.assets.addModal.submitBtn })
    fireEvent.click(submitBtn)

    // Expect validation errors
    expect(screen.getByText(t.assets.validation.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(t.assets.validation.categoryRequired)).toBeInTheDocument()
  })

  it('successfully creates a new asset and displays it in list', async () => {
    vi.spyOn(assetService, 'getAssets').mockResolvedValue(mockAssets)
    const newMockAsset = {
      id: 'ast_3',
      vaultId: 'vault_default',
      name: 'Xe VinFast VF9',
      category: 'VEHICLE',
      estimatedValue: 1500000000,
      documentRef: 'DK-51A',
      description: 'Xe gia đình',
      createdAt: '2026-10-11T00:00:00Z',
    }
    vi.spyOn(assetService, 'createAsset').mockResolvedValue(newMockAsset)

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getAllByText('Nhà phố Nguyễn Trãi').length).toBeGreaterThan(0)
    })

    // Open Add Modal
    const addBtns = screen.getAllByRole('button', { name: new RegExp(t.assets.addNewBtn, 'i') })
    fireEvent.click(addBtns[0])

    // Fill form
    const nameInput = screen.getByPlaceholderText(t.assets.addModal.namePlaceholder)
    const categorySelect = document.getElementById('asset-category')

    fireEvent.change(nameInput, { target: { value: 'Xe VinFast VF9' } })
    fireEvent.change(categorySelect, { target: { value: 'VEHICLE' } })

    const submitBtn = screen.getByRole('button', { name: t.assets.addModal.submitBtn })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getAllByText('Xe VinFast VF9').length).toBeGreaterThan(0)
    })
  })

  it('handles error state gracefully with retry button', async () => {
    vi.spyOn(assetService, 'getAssets').mockRejectedValueOnce(new Error('Network error'))

    render(<AssetManagementPage t={t} />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(t.assets.alerts.loadError)).toBeInTheDocument()
    })

    // Ensure retry button is available
    expect(screen.getByRole('button', { name: new RegExp(t.assets.alerts.retryBtn, 'i') })).toBeInTheDocument()
  })
})
