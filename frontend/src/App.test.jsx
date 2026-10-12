import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { assetService } from './services/assetService'

vi.mock('./pages/vault/VaultOverviewPage.jsx', () => ({ default: () => <h1>Vault route test</h1> }))
vi.mock('./pages/dms/DMSOverviewPage.jsx', () => ({ default: () => <h1>DMS route test</h1> }))
beforeEach(() => {
  vi.stubEnv('DEV', true); vi.stubEnv('PROD', false)
  vi.spyOn(assetService, 'getAssets').mockResolvedValue({ content: [], totalElements: 0 })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); window.history.replaceState({}, '', '/') })

it('keeps Assets, Vault and DMS connected through the shared shell', async () => {
  window.history.replaceState({}, '', '/assets?preview=true')
  render(<App />)
  expect(await screen.findByText('Chưa có tài sản nào trong kho')).toBeInTheDocument()
  expect(screen.queryByText(/Bản xem trước|Preview with sample data/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Kho di sản số (Vault)' }))
  expect(screen.getByText('Vault route test')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Giám sát hoạt động (DMS)' }))
  expect(screen.getByText('DMS route test')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Danh mục tài sản di sản' }))
  expect(await screen.findByText('Chưa có tài sản nào trong kho')).toBeInTheDocument()
  expect(window.location.pathname).toBe('/assets')
  expect(window.location.search).toBe('?preview=true')
})

it('keeps login available and avoids preview when clean assets route is opened', async () => {
  window.history.replaceState({}, '', '/assets')
  render(<App />)
  expect(screen.queryByText(/Bản xem trước dùng dữ liệu mẫu/)).not.toBeInTheDocument()
  expect(await screen.findByText('Chưa có tài sản nào trong kho')).toBeInTheDocument()
  expect(assetService.getAssets).toHaveBeenCalledWith(undefined, expect.objectContaining({ isDevPreview: false }))
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  expect(window.location.pathname).toBe('/login')
  expect(screen.getByRole('heading', { name: /Đăng nhập/ })).toBeInTheDocument()
})

it('does not expose protected asset UI in production through a preview URL', () => {
  vi.stubEnv('PROD', true)
  window.history.replaceState({}, '', '/assets?preview=true')
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
  expect(assetService.getAssets).not.toHaveBeenCalled()
})


it('connects Will upload through the shared shell and global language', () => {
  window.history.replaceState({}, '', '/assets?preview=true'); render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Hồ sơ di chúc số' }));
  expect(window.location.pathname).toBe('/wills'); expect(window.location.search).toBe('?preview=true');
  expect(screen.getByRole('heading', { name: 'Lưu bản di chúc số hóa' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'EN' }));
  expect(screen.getByRole('heading', { name: 'Store a digitized will' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Refresh records' })).not.toBeInTheDocument();
});

it('blocks protected Will upload in production even with preview URL', () => {
  vi.stubEnv('PROD', true); window.history.replaceState({}, '', '/wills?preview=true'); render(<App />);
  expect(screen.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument();
});
