import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  willService,
  computeFileSha256,
  formatFileSize,
  formatDateTime,
  DEFAULT_MOCK_VAULT_ID,
} from './willService.js';

describe('Will Service & Mock Implementation (PS-7)', () => {
  it('computes real SHA-256 matching known content hash (hello world)', async () => {
    // SHA-256 of "hello world" in utf-8:
    // b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
    const text = 'hello world';
    const hash = await computeFileSha256(text);
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64);
    assert.equal(hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('computes identical hash for identical bytes and different hash for different bytes', async () => {
    const fileA = {
      name: 'file1.pdf',
      arrayBuffer: async () => new TextEncoder().encode('Di chuc noi dung A').buffer,
    };
    const fileB = {
      name: 'file2.pdf',
      arrayBuffer: async () => new TextEncoder().encode('Di chuc noi dung A').buffer,
    };
    const fileC = {
      name: 'file3.pdf',
      arrayBuffer: async () => new TextEncoder().encode('Di chuc noi dung B khac biet').buffer,
    };

    const hashA = await computeFileSha256(fileA);
    const hashB = await computeFileSha256(fileB);
    const hashC = await computeFileSha256(fileC);

    assert.equal(hashA, hashB);
    assert.notEqual(hashA, hashC);
    assert.match(hashA, /^[0-9a-f]{64}$/);
  });

  it('fails clearly rather than fabricating a hash when bytes cannot be computed', async () => {
    await assert.rejects(
      async () => {
        await computeFileSha256({ name: 'corrupted' });
      },
      { message: /CANNOT_READ_FILE_BYTES/ }
    );
  });

  it('formats file sizes accurately', () => {
    assert.equal(formatFileSize(0), '0 B');
    assert.equal(formatFileSize(500), '500 B');
    assert.equal(formatFileSize(1024), '1.0 KB');
    assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.50 MB');
  });

  it('formats dates cleanly', () => {
    const formatted = formatDateTime('2026-10-12T00:00:00Z', 'vi');
    assert.ok(formatted.length > 5);
  });

  it('uploads a digitized will document in mock mode returning strictly UPLOADED status and real SHA-256', async () => {
    const rawContent = 'Bản di chúc mẫu hợp pháp được lập ngày 12/10/2026';
    const mockFile = {
      name: 'di_chuc_chinh_thuc.pdf',
      type: 'application/pdf',
      size: rawContent.length,
      arrayBuffer: async () => new TextEncoder().encode(rawContent).buffer,
    };
    const note = 'Bản có chữ ký xác nhận';

    const result = await willService.uploadWill(DEFAULT_MOCK_VAULT_ID, mockFile, note, { isDevPreview: true, isTest: true });

    // Assert status is strictly UPLOADED and NOT LEGAL_APPROVED
    assert.equal(result.status, 'UPLOADED');
    assert.notEqual(result.status, 'LEGAL_APPROVED');

    // Assert currentVersion
    assert.ok(result.currentVersion);
    assert.equal(result.currentVersion.version, 1);
    assert.equal(result.currentVersion.fileName, 'di_chuc_chinh_thuc.pdf');
    assert.equal(result.currentVersion.contentType, 'application/pdf');
    assert.equal(result.currentVersion.sizeBytes, rawContent.length);
    assert.equal(result.currentVersion.sha256.length, 64);
    assert.match(result.currentVersion.sha256, /^[0-9a-f]{64}$/);
    assert.ok(result.currentVersion.uploadedAt);
    assert.ok(result.createdAt);

    // Assert sha256 matches actual hash of rawContent
    const expectedHash = await computeFileSha256(rawContent);
    assert.equal(result.currentVersion.sha256, expectedHash);

    // Assert no raw file content or buffer is persisted/exposed in response
    assert.equal(result.currentVersion.content, undefined);
    assert.equal(result.currentVersion.fileData, undefined);
    assert.equal(result.currentVersion.buffer, undefined);
  });

  it('rejects upload when file is missing', async () => {
    await assert.rejects(
      async () => {
        await willService.uploadWill(DEFAULT_MOCK_VAULT_ID, null);
      },
      { message: 'FILE_REQUIRED' }
    );
  });
});
