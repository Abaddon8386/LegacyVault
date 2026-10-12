import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWillUpload,
  MAX_FILE_SIZE_BYTES,
  MAX_NOTE_LENGTH,
  ACCEPTED_MIME_TYPES,
  willValidationMessages,
} from './willValidation.js';
import {
  willService,
  willStatusMessages,
  DEFAULT_MOCK_VAULT_ID,
} from './willService.js';

describe('Digitized Will Upload Flow & Safety Contract (PS-7)', () => {
  describe('1. File Type Acceptance & Rejection', () => {
    it('accepts application/pdf', () => {
      const pdf = { name: 'ban_di_chuc.pdf', type: 'application/pdf', size: 1024 * 100 };
      const errs = validateWillUpload({ file: pdf, note: '' });
      assert.deepEqual(errs, {});
    });

    it('accepts image/jpeg', () => {
      const jpeg = { name: 'di_chuc_trang_1.jpg', type: 'image/jpeg', size: 1024 * 500 };
      const errs = validateWillUpload({ file: jpeg, note: '' });
      assert.deepEqual(errs, {});
    });

    it('accepts image/png', () => {
      const png = { name: 'di_chuc_scan.png', type: 'image/png', size: 1024 * 1024 };
      const errs = validateWillUpload({ file: png, note: '' });
      assert.deepEqual(errs, {});
    });

    it('accepts application/pdf even without .pdf extension (MIME is authoritative on backend)', () => {
      const pdfWithoutExt = { name: 'document_scan_01', type: 'application/pdf', size: 1024 * 100 };
      const errs = validateWillUpload({ file: pdfWithoutExt, note: '' });
      assert.deepEqual(errs, {});
    });

    it('rejects unsupported types (e.g. docx, txt, zip, exe)', () => {
      const unsupportedList = [
        { name: 'document.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 2000 },
        { name: 'notes.txt', type: 'text/plain', size: 500 },
        { name: 'archive.zip', type: 'application/zip', size: 8000 },
        { name: 'malicious.exe', type: 'application/x-msdownload', size: 12000 },
      ];

      for (const file of unsupportedList) {
        const errsVi = validateWillUpload({ file, note: '' }, 'vi');
        assert.ok(errsVi.file, `Expected rejection for ${file.name}`);
        assert.equal(errsVi.file, willValidationMessages.vi.fileTypeInvalid);
      }
    });
  });

  describe('2. File Size Enforcement', () => {
    it('rejects file strictly greater than 10 MB', () => {
      const oversized = {
        name: 'huge_scan.pdf',
        type: 'application/pdf',
        size: MAX_FILE_SIZE_BYTES + 1,
      };
      const errs = validateWillUpload({ file: oversized, note: '' }, 'vi');
      assert.equal(errs.file, willValidationMessages.vi.fileSizeExceeded);
    });

    it('accepts file exactly at 10 MB', () => {
      const exact10MB = {
        name: 'exact_limit.pdf',
        type: 'application/pdf',
        size: MAX_FILE_SIZE_BYTES,
      };
      const errs = validateWillUpload({ file: exact10MB, note: '' }, 'vi');
      assert.deepEqual(errs, {});
    });
  });

  describe('3. Required & Non-Empty File', () => {
    it('requires file selection', () => {
      const errs = validateWillUpload({ file: null, note: '' });
      assert.equal(errs.file, willValidationMessages.vi.fileRequired);
    });

    it('rejects empty file (0 bytes)', () => {
      const empty = { name: 'zero.pdf', type: 'application/pdf', size: 0 };
      const errs = validateWillUpload({ file: empty, note: '' });
      assert.equal(errs.file, willValidationMessages.vi.fileEmpty);
    });
  });

  describe('4. Optional Note Length (<= 500 characters)', () => {
    const validFile = { name: 'test.pdf', type: 'application/pdf', size: 1024 };

    it('allows empty note', () => {
      const errs = validateWillUpload({ file: validFile, note: '' });
      assert.deepEqual(errs, {});
    });

    it('allows note up to 500 characters', () => {
      const note500 = 'a'.repeat(MAX_NOTE_LENGTH);
      const errs = validateWillUpload({ file: validFile, note: note500 });
      assert.deepEqual(errs, {});
    });

    it('rejects note exceeding 500 characters', () => {
      const note501 = 'a'.repeat(MAX_NOTE_LENGTH + 1);
      const errs = validateWillUpload({ file: validFile, note: note501 });
      assert.equal(errs.note, willValidationMessages.vi.noteTooLong);
    });
  });

  describe('5. Upload Execution & Metadata Representation', () => {
    it('returns status strictly UPLOADED (never LEGAL_APPROVED)', async () => {
      const sampleFile = {
        name: 'ban_chup_di_chuc_hop_phap.pdf',
        type: 'application/pdf',
        size: 1024 * 800,
        arrayBuffer: async () => new TextEncoder().encode('dummy pdf content 1').buffer,
      };

      const response = await willService.uploadWill(DEFAULT_MOCK_VAULT_ID, sampleFile, 'Lưu trữ ban đầu', { isDevPreview: true, isTest: true });

      assert.equal(response.status, 'UPLOADED');
      assert.notEqual(response.status, 'LEGAL_APPROVED');
      assert.notEqual(response.status, 'APPROVED');
      assert.notEqual(response.status, 'VERIFIED');
    });

    it('populates valid currentVersion metadata with 64-char SHA-256', async () => {
      const sampleFile = {
        name: 'ban_chup_trang_1.png',
        type: 'image/png',
        size: 1024 * 350,
        arrayBuffer: async () => new TextEncoder().encode('dummy png content 2').buffer,
      };

      const response = await willService.uploadWill(DEFAULT_MOCK_VAULT_ID, sampleFile, '', { isDevPreview: true, isTest: true });

      assert.equal(response.currentVersion.version, 1);
      assert.equal(response.currentVersion.fileName, sampleFile.name);
      assert.equal(response.currentVersion.contentType, sampleFile.type);
      assert.equal(response.currentVersion.sizeBytes, sampleFile.size);
      assert.equal(typeof response.currentVersion.sha256, 'string');
      assert.equal(response.currentVersion.sha256.length, 64);
      assert.match(response.currentVersion.sha256, /^[0-9a-f]{64}$/);
      assert.ok(response.currentVersion.uploadedAt);
      assert.ok(response.createdAt);
    });

    it('does NOT render, buffer, or persist raw file bytes', async () => {
      const sampleFile = {
        name: 'private_will.pdf',
        type: 'application/pdf',
        size: 1024 * 1024,
        arrayBuffer: async () => new TextEncoder().encode('dummy private content 3').buffer,
      };

      const response = await willService.uploadWill(DEFAULT_MOCK_VAULT_ID, sampleFile, '', { isDevPreview: true, isTest: true });

      // Verify no binary content or base64 data leak
      assert.equal(response.currentVersion.content, undefined);
      assert.equal(response.currentVersion.data, undefined);
      assert.equal(response.currentVersion.fileData, undefined);
      assert.equal(response.currentVersion.buffer, undefined);
      assert.equal(response.currentVersion.base64, undefined);
      assert.equal(response.file, undefined);
    });
  });

  describe('6. Legal & Integrity Wording Standards', () => {
    it('advisory message explicitly warns that upload does NOT constitute legal approval', () => {
      assert.ok(willStatusMessages.vi.NOTICE_CONTENT.includes('chưa phải xác nhận giá trị pháp lý'));
      assert.ok(willStatusMessages.en.NOTICE_CONTENT.includes('does not constitute legal approval'));
    });

    it('SHA-256 hint clarifies hash is for integrity check only, not legal certification', () => {
      assert.ok(willStatusMessages.vi.SHA256_HINT.includes('không mang giá trị chứng thực pháp lý'));
      assert.ok(willStatusMessages.en.SHA256_HINT.includes('not legal certification'));
    });
  });
});
