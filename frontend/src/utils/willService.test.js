import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { willService, computeFileSha256, DEFAULT_MOCK_VAULT_ID as vault, formatDateTime } from './willService.js';
const file = () => new File(['%PDF-1.4 hello'], 'will.pdf', { type: 'application/pdf' });
const receipt = f => ({ id: '11111111-2222-3333-4444-555555555555', vaultId: vault, status: 'UPLOADED', createdAt: '2026-10-12T10:00:00Z', currentVersion: { version: 1, fileName: f.name, contentType: f.type, sizeBytes: f.size, uploadedAt: '2026-10-12T10:00:00Z', sha256: 'a'.repeat(64) } });
class Request {
  upload = {}; headers = {}; status = 201; type = 'application/json';
  open(...args) { this.opened = args; }
  setRequestHeader(key, value) { this.headers[key] = value; }
  getResponseHeader() { return this.type; }
  send(body) { this.body = body; }
  abort() { this.onabort?.(); }
}
let xhr;
function start(f = file(), options = {}) { xhr = new Request(); return willService.uploadWill(vault, f, ' note ', { xhrFactory: () => xhr, ...options }); }
beforeEach(() => { vi.stubEnv('DEV', true); vi.stubEnv('PROD', false); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it('sends multipart, language and in-memory auth; reports at most 99 before a valid receipt', async () => {
  const f = file(); const onProgress = vi.fn(); const pending = start(f, { lang: 'en', accessToken: 'test-token', onProgress });
  expect(xhr.opened).toEqual(['POST', `/api/v1/vaults/${vault}/wills`]);
  expect(xhr.headers).toEqual({ Accept: 'application/json', 'Accept-Language': 'en', Authorization: 'Bearer test-token' });
  expect(xhr.body.get('file').name).toBe('will.pdf'); expect(xhr.body.get('note')).toBe('note');
  xhr.upload.onprogress({ lengthComputable: true, loaded: 10, total: 10 });
  expect(onProgress).toHaveBeenLastCalledWith(99);
  xhr.responseText = JSON.stringify({ ...receipt(f), token: 'secret', fileData: 'private' }); xhr.onload();
  const result = await pending; expect(result.token).toBeUndefined(); expect(result.fileData).toBeUndefined();
  expect(onProgress).toHaveBeenLastCalledWith(100); expect(xhr.upload.onprogress).toBeNull();
});
it('allows absent hash from Jira metadata and never fabricates one', async () => {
  const f = file(); const pending = start(f); const data = receipt(f); delete data.currentVersion.sha256;
  xhr.responseText = JSON.stringify(data); xhr.onload(); expect((await pending).currentVersion.sha256).toBeUndefined();
});
it('uses indeterminate progress when the transfer length is unknown', async () => {
  const progress = vi.fn(); const pending = start(file(), { onProgress: progress });
  xhr.upload.onprogress({ lengthComputable: false }); expect(progress).toHaveBeenLastCalledWith(null);
  xhr.onerror(); await expect(pending).rejects.toMatchObject({ code: 'UPLOAD_FAILED' });
});
it.each([400,401,403,404,409,413,415,500,200,204])('rejects HTTP %s without exposing server error text', async status => {
  const pending = start(); xhr.status = status; xhr.responseText = '{"message":"secret database failure"}'; xhr.onload();
  await expect(pending).rejects.not.toHaveProperty('message', 'secret database failure');
});
it.each([
  ['legal approval', d => { d.status = 'LEGAL_APPROVED'; }],
  ['wrong vault', d => { d.vaultId = '22222222-2222-3333-4444-555555555555'; }],
  ['missing id', d => { delete d.id; }], ['wrong version', d => { d.currentVersion.version = 2; }],
  ['invalid hash', d => { d.currentVersion.sha256 = 'fake'; }],
  ['wrong size', d => { d.currentVersion.sizeBytes = 999; }],
  ['wrong file', d => { d.currentVersion.fileName = 'other.pdf'; }],
  ['wrong type', d => { d.currentVersion.contentType = 'text/plain'; }],
  ['bad timestamp', d => { d.createdAt = 'yesterday'; }],
])('rejects a receipt with %s', async (_, mutate) => {
  const f = file(); const progress = vi.fn(); const pending = start(f, { onProgress: progress });
  const data = receipt(f); mutate(data); xhr.responseText = JSON.stringify(data); xhr.onload();
  await expect(pending).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' }); expect(progress).not.toHaveBeenCalledWith(100);
});
it.each(['text/html','application/json'])('rejects HTML or invalid JSON even with 201 (%s)', async type => {
  const pending = start(); xhr.type = type; xhr.responseText = '<html>SPA fallback</html>'; xhr.onload();
  await expect(pending).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' });
});
it('aborts transfer and removes callbacks', async () => {
  const controller = new AbortController(); const pending = start(file(), { signal: controller.signal });
  controller.abort(); await expect(pending).rejects.toMatchObject({ code: 'ABORTED' }); expect(xhr.onload).toBeNull(); expect(xhr.upload.onprogress).toBeNull();
});
it('rejects a timeout without claiming the server deleted the document', async () => {
  const pending = start(); xhr.ontimeout(); await expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
});
it('requires real Vault context by default instead of silently generating mock success', async () => {
  await expect(willService.uploadWill(undefined, file())).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' });
});
it('production cannot opt into mock through test, preview or isMock flags', async () => {
  vi.stubEnv('PROD', true); vi.stubEnv('VITE_USE_MOCK', 'true');
  await expect(willService.uploadWill(undefined, file(), '', { isDevPreview: true, isTest: true, isMock: true })).rejects.toMatchObject({ code: 'BACKEND_NOT_READY' });
});
it('validates before sending a multipart request', async () => {
  await expect(willService.uploadWill(vault, new File([], 'a.pdf', { type: 'application/pdf' }))).rejects.toMatchObject({ code: 'VALIDATION_FAILED', fieldErrors: { file: 'fileEmpty' } });
});
it('hashes only the selected byte slice', async () => {
  const bytes = new TextEncoder().encode('xhello worldy');
  expect(await computeFileSha256(bytes.subarray(1, 12))).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
});
it('does not display Invalid Date', () => { expect(formatDateTime('bad')).toBe('—'); });
