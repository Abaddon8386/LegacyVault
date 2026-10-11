import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWillUpload,
  MAX_FILE_SIZE_BYTES,
  willValidationMessages,
} from './willValidation.js';

describe('Will Upload Validation (PS-7)', () => {
  it('requires a file to be selected', () => {
    const errors = validateWillUpload({ file: null, note: '' }, 'vi');
    assert.equal(errors.file, willValidationMessages.vi.fileRequired);

    const errorsEn = validateWillUpload({ file: null, note: '' }, 'en');
    assert.equal(errorsEn.file, willValidationMessages.en.fileRequired);
  });

  it('rejects an empty file (0 bytes)', () => {
    const emptyFile = { name: 'test.pdf', type: 'application/pdf', size: 0 };
    const errors = validateWillUpload({ file: emptyFile, note: '' }, 'vi');
    assert.equal(errors.file, willValidationMessages.vi.fileEmpty);
  });

  it('accepts valid PDF, JPEG, and PNG files under 10MB', () => {
    const validPdf = { name: 'di_chuc.pdf', type: 'application/pdf', size: 1024 * 500 };
    assert.deepEqual(validateWillUpload({ file: validPdf, note: 'Ghi chú di chúc' }), {});

    const validJpg = { name: 'ban_chup.jpg', type: 'image/jpeg', size: 1024 * 1024 * 2 };
    assert.deepEqual(validateWillUpload({ file: validJpg, note: '' }), {});

    const validPng = { name: 'ban_scan.png', type: 'image/png', size: 1024 * 1024 * 9 };
    assert.deepEqual(validateWillUpload({ file: validPng, note: '' }), {});
  });

  it('rejects unsupported file MIME types and extensions', () => {
    const docxFile = { name: 'di_chuc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 2048 };
    const errorsDocx = validateWillUpload({ file: docxFile, note: '' }, 'vi');
    assert.equal(errorsDocx.file, willValidationMessages.vi.fileTypeInvalid);

    const exeFile = { name: 'script.exe', type: 'application/x-msdownload', size: 1024 };
    const errorsExe = validateWillUpload({ file: exeFile, note: '' }, 'en');
    assert.equal(errorsExe.file, willValidationMessages.en.fileTypeInvalid);
  });

  it('rejects file larger than 10 MB', () => {
    const oversizedFile = {
      name: 'large_scan.pdf',
      type: 'application/pdf',
      size: MAX_FILE_SIZE_BYTES + 1,
    };
    const errors = validateWillUpload({ file: oversizedFile, note: '' }, 'vi');
    assert.equal(errors.file, willValidationMessages.vi.fileSizeExceeded);
  });

  it('validates optional note length <= 500 characters', () => {
    const validFile = { name: 'di_chuc.pdf', type: 'application/pdf', size: 1000 };
    
    // Exactly 500 chars is valid
    const note500 = 'a'.repeat(500);
    const errors500 = validateWillUpload({ file: validFile, note: note500 }, 'vi');
    assert.deepEqual(errors500, {});

    // 501 chars is invalid
    const note501 = 'a'.repeat(501);
    const errors501 = validateWillUpload({ file: validFile, note: note501 }, 'vi');
    assert.equal(errors501.note, willValidationMessages.vi.noteTooLong);

    const errors501En = validateWillUpload({ file: validFile, note: note501 }, 'en');
    assert.equal(errors501En.note, willValidationMessages.en.noteTooLong);
  });
});
