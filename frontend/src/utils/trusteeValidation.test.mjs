import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateTrustee, trusteeValidationMessages } from './trusteeValidation.js';

describe('Trustee Validation (PS-8 / ST-04)', () => {
  it('validates that full name is required and trimmed', () => {
    const resVi = validateTrustee({ fullName: '', phone: '0901234567' }, 'vi');
    assert.equal(resVi.fullName, trusteeValidationMessages.vi.fullNameRequired);

    const resEn = validateTrustee({ fullName: '   ', email: 'test@example.com' }, 'en');
    assert.equal(resEn.fullName, trusteeValidationMessages.en.fullNameRequired);
  });

  it('rejects full name longer than 150 characters', () => {
    const longName = 'A'.repeat(151);
    const res = validateTrustee({ fullName: longName, phone: '0901234567' }, 'vi');
    assert.equal(res.fullName, trusteeValidationMessages.vi.fullNameTooLong);
  });

  it('requires at least one contact method (phone OR email)', () => {
    const res = validateTrustee({ fullName: 'Nguyễn Văn A' }, 'vi');
    assert.equal(res.contact, trusteeValidationMessages.vi.contactRequired);
    assert.ok(res.phone);
    assert.ok(res.email);

    const resEn = validateTrustee({ fullName: 'John Doe', phone: '', email: '   ' }, 'en');
    assert.equal(resEn.contact, trusteeValidationMessages.en.contactRequired);
  });

  it('accepts valid phone when email is omitted', () => {
    const res = validateTrustee({ fullName: 'Nguyễn Văn A', phone: '0901234567' }, 'vi');
    assert.deepEqual(res, {});
  });

  it('accepts valid email when phone is omitted', () => {
    const res = validateTrustee({ fullName: 'Nguyễn Văn A', email: 'trustee@example.com' }, 'vi');
    assert.deepEqual(res, {});
  });

  it('accepts both phone and email when both are valid', () => {
    const res = validateTrustee(
      { fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'trustee@example.com' },
      'vi'
    );
    assert.deepEqual(res, {});
  });

  it('rejects invalid email format when email is provided', () => {
    const resVi = validateTrustee(
      { fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'invalid-email' },
      'vi'
    );
    assert.equal(resVi.email, trusteeValidationMessages.vi.emailInvalid);

    const resEn = validateTrustee(
      { fullName: 'John Doe', phone: '0901234567', email: 'not-an-email@' },
      'en'
    );
    assert.equal(resEn.email, trusteeValidationMessages.en.emailInvalid);
  });

  it('rejects invalid phone format when phone is provided', () => {
    const res = validateTrustee(
      { fullName: 'Nguyễn Văn A', email: 'trustee@example.com', phone: 'abc123' },
      'vi'
    );
    assert.equal(res.phone, trusteeValidationMessages.vi.phoneInvalid);
  });

  it('validates relationship length up to 100 characters', () => {
    const longRel = 'R'.repeat(101);
    const res = validateTrustee(
      { fullName: 'Nguyễn Văn A', phone: '0901234567', relationship: longRel },
      'vi'
    );
    assert.equal(res.relationship, trusteeValidationMessages.vi.relationshipTooLong);

    const validRes = validateTrustee(
      { fullName: 'Nguyễn Văn A', phone: '0901234567', relationship: 'Luật sư gia đình' },
      'vi'
    );
    assert.equal(validRes.relationship, undefined);
  });

  it('validates note length up to 500 characters', () => {
    const longNote = 'N'.repeat(501);
    const res = validateTrustee(
      { fullName: 'Nguyễn Văn A', email: 'trustee@example.com', note: longNote },
      'vi'
    );
    assert.equal(res.note, trusteeValidationMessages.vi.noteTooLong);

    const validRes = validateTrustee(
      { fullName: 'Nguyễn Văn A', email: 'trustee@example.com', note: 'Ghi chú ủy quyền.' },
      'vi'
    );
    assert.equal(validRes.note, undefined);
  });
});
