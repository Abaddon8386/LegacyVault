import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WillUploadPage from './WillUploadPage.jsx';
import { willService } from '../../utils/willService.js';
let resolve, reject, options;
const sample = () => new File(['%PDF-1.4 sample'], 'will.pdf', { type: 'application/pdf' });
const result = { status: 'UPLOADED', currentVersion: { version: 1, fileName: 'will.pdf', sizeBytes: 16, contentType: 'application/pdf', uploadedAt: '2026-10-12T10:00:00Z', sha256: 'a'.repeat(64) } };
function choose() { fireEvent.change(screen.getByLabelText(/Tệp tài liệu di chúc|Digitized Will Document/), { target: { files: [sample()] } }); }
function submit() { fireEvent.click(screen.getByRole('button', { name: 'Tải lên bản di chúc số hóa' })); }
beforeEach(() => {
  vi.spyOn(willService, 'uploadWill').mockImplementation((vault, file, note, opts) => { options = opts; return new Promise((yes, no) => { resolve = yes; reject = no; }); });
});
afterEach(() => vi.restoreAllMocks());
it('validates required file and changes error language without clearing inputs', () => {
  const { rerender } = render(<WillUploadPage />); submit();
  expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng chọn tệp'); expect(willService.uploadWill).not.toHaveBeenCalled();
  rerender(<WillUploadPage lang="en" />); expect(screen.getByRole('alert')).toHaveTextContent('Please select');
});
it('blocks duplicate submit and file changes while showing transfer progress', async () => {
  render(<WillUploadPage vaultId="real-vault" isDevPreview />); choose(); submit();
  fireEvent.submit(screen.getByRole('button', { name: 'Đang tải lên…' }).closest('form'));
  expect(willService.uploadWill).toHaveBeenCalledTimes(1); expect(screen.getByRole('button', { name: 'Bỏ chọn tệp' })).toBeDisabled();
  options.onProgress(70); await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('value', '70'));
  resolve(result); expect(await screen.findByRole('heading', { name: 'Tài liệu đã được ghi nhận' })).toBeInTheDocument();
  expect(screen.queryByText('LEGAL_APPROVED')).not.toBeInTheDocument(); expect(screen.getByText(/bản giấy vẫn cần/)).toBeInTheDocument();
  expect(screen.queryByText(/Bản xem trước|dữ liệu mẫu/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Tải lên tài liệu khác' }));
  expect(screen.queryByRole('button', { name: 'Bỏ chọn tệp' })).not.toBeInTheDocument(); expect(screen.getByRole('textbox')).toHaveValue('');
});
it('maps errors safely and retains input for correction', async () => {
  render(<WillUploadPage />); choose(); submit(); reject({ code: 'UNAUTHORIZED', message: 'private SQL stack' });
  expect(await screen.findByRole('alert')).toHaveTextContent('Phiên đăng nhập'); expect(screen.queryByText(/private SQL/)).not.toBeInTheDocument();
  expect(screen.getByText('will.pdf')).toBeInTheDocument();
});
it('does not invent hash metadata or offer file viewing and downloading', async () => {
  render(<WillUploadPage />); choose(); submit(); resolve({ ...result, currentVersion: { ...result.currentVersion, sha256: undefined } });
  await screen.findByRole('heading', { name: 'Tài liệu đã được ghi nhận' });
  expect(screen.queryByText('Thông tin kỹ thuật')).not.toBeInTheDocument(); expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
it('cancels waiting and gives a safe localized cancellation result', async () => {
  render(<WillUploadPage />); choose(); submit(); fireEvent.click(screen.getByRole('button', { name: 'Hủy thao tác' }));
  expect(options.signal.aborted).toBe(true); reject({ code: 'ABORTED' }); expect(await screen.findByRole('alert')).toHaveTextContent('kiểm tra hồ sơ');
});
it('aborts on unmount and does not display a late result in a new vault', async () => {
  const { rerender, unmount } = render(<WillUploadPage vaultId="first" />); choose(); submit();
  const oldResolve = resolve; const oldOptions = options;
  rerender(<WillUploadPage vaultId="second" />); expect(oldOptions.signal.aborted).toBe(true);
  oldResolve(result); await waitFor(() => expect(screen.queryByRole('heading', { name: 'Tài liệu đã được ghi nhận' })).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Tải lên bản di chúc số hóa' })).toBeEnabled();
  choose(); submit(); unmount(); expect(options.signal.aborted).toBe(true);
});
it('never writes the file or note to browser storage', async () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem'); render(<WillUploadPage />); choose();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'private note' } }); submit(); resolve(result);
  await screen.findByRole('heading', { name: 'Tài liệu đã được ghi nhận' }); expect(spy).not.toHaveBeenCalled();
});
