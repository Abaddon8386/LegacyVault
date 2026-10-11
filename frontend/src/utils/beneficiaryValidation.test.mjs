import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateBeneficiary, beneficiaryValidationMessages } from './beneficiaryValidation.js';

describe('Beneficiary Validation (PS-8 / ST-05)', () => {
  it('validates that full name is required and trimmed', () => {
    const resVi = validateBeneficiary({ fullName: '' }, 'vi');
    assert.equal(resVi.fullName, beneficiaryValidationMessages.vi.fullNameRequired);

    const resEn = validateBeneficiary({ fullName: '   ' }, 'en');
    assert.equal(resEn.fullName, beneficiaryValidationMessages.en.fullNameRequired);
  });

  it('rejects full name longer than 150 characters', () => {
    const longName = 'B'.repeat(151);
    const res = validateBeneficiary({ fullName: longName }, 'vi');
    assert.equal(res.fullName, beneficiaryValidationMessages.vi.fullNameTooLong);
  });

  it('accepts valid beneficiary with optional fields omitted', () => {
    const res = validateBeneficiary({ fullName: 'Trần Thị B' }, 'vi');
    assert.deepEqual(res, {});
  });

  it('validates relationship length up to 100 characters', () => {
    const longRel = 'R'.repeat(101);
    const res = validateBeneficiary({ fullName: 'Trần Thị B', relationship: longRel }, 'vi');
    assert.equal(res.relationship, beneficiaryValidationMessages.vi.relationshipTooLong);

    const validRes = validateBeneficiary({ fullName: 'Trần Thị B', relationship: 'Con gái' }, 'vi');
    assert.equal(validRes.relationship, undefined);
  });

  it('rejects date of birth in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureStr = futureDate.toISOString().slice(0, 10);

    const resVi = validateBeneficiary({ fullName: 'Trần Thị B', dateOfBirth: futureStr }, 'vi');
    assert.equal(resVi.dateOfBirth, beneficiaryValidationMessages.vi.dateOfBirthFuture);

    const resEn = validateBeneficiary({ fullName: 'Jane Doe', dateOfBirth: futureStr }, 'en');
    assert.equal(resEn.dateOfBirth, beneficiaryValidationMessages.en.dateOfBirthFuture);
  });

  it('accepts past date of birth', () => {
    const res = validateBeneficiary(
      { fullName: 'Trần Thị B', dateOfBirth: '2005-08-20' },
      'vi'
    );
    assert.equal(res.dateOfBirth, undefined);
  });

  it('validates phone and email formats when provided', () => {
    const badPhone = validateBeneficiary(
      { fullName: 'Trần Thị B', phone: 'invalid-number' },
      'vi'
    );
    assert.equal(badPhone.phone, beneficiaryValidationMessages.vi.phoneInvalid);

    const badEmail = validateBeneficiary(
      { fullName: 'Trần Thị B', email: 'not-an-email' },
      'vi'
    );
    assert.equal(badEmail.email, beneficiaryValidationMessages.vi.emailInvalid);

    const goodRes = validateBeneficiary(
      {
        fullName: 'Trần Thị B',
        phone: '0912345678',
        email: 'beneficiary@example.com',
      },
      'vi'
    );
    assert.deepEqual(goodRes, {});
  });

  it('does NOT enforce or validate any share ratio or allocation percentage', () => {
    // Beneficiary does not have percentage/allocation in PS-8 scope
    const inputWithExtra = {
      fullName: 'Trần Thị B',
      percentage: 50,
      shareRatio: '50%',
      allocation: 100,
    };
    const res = validateBeneficiary(inputWithExtra, 'vi');
    assert.deepEqual(res, {});
    assert.equal(res.percentage, undefined);
    assert.equal(res.shareRatio, undefined);
    assert.equal(res.allocation, undefined);
  });
});
