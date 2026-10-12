import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VAULT_ID,
  resetMockData,
  getTrustees as livegetTrustees,
  createTrustee as livecreateTrustee,
  getBeneficiaries as livegetBeneficiaries,
  createBeneficiary as livecreateBeneficiary,
  checkConfigurationReadiness as livecheckConfigurationReadiness,
} from './trusteeBeneficiaryService.js';

const preview = { isDevPreview:true, isTest:true };
const getTrustees = id => livegetTrustees(id,preview);
const getBeneficiaries = id => livegetBeneficiaries(id,preview);
const checkConfigurationReadiness = id => livecheckConfigurationReadiness(id,preview);
const createTrustee = (id,data) => livecreateTrustee(id,data,preview);
const createBeneficiary = (id,data) => livecreateBeneficiary(id,data,preview);

describe('Trustee & Beneficiary Service (PS-8 / ST-04-05)', () => {
  beforeEach(() => {
    resetMockData();
  });

  describe('Trustee Flow (ST-04)', () => {
    it('creates Trustee with status APPOINTED without account creation or userId', async () => {
      const trustee = await createTrustee(DEFAULT_VAULT_ID, {
        fullName: 'Nguyễn Văn Giám Hộ',
        phone: '0901234567',
        relationship: 'Luật sư gia đình',
      });

      assert.ok(trustee.id);
      assert.equal(trustee.vaultId, DEFAULT_VAULT_ID);
      assert.equal(trustee.fullName, 'Nguyễn Văn Giám Hộ');
      assert.equal(trustee.phone, '0901234567');
      // Contract requirement: APPOINTED, not ACTIVE
      assert.equal(trustee.status, 'APPOINTED');

      // CRITICAL SECURITY ASSERTIONS:
      // No userId, no user credentials, no unlock permission
      assert.equal(trustee.userId, undefined);
      assert.equal(trustee.canUnlock, undefined);
      assert.equal(trustee.hasAccount, undefined);
      assert.equal(trustee.password, undefined);

      const list = await getTrustees(DEFAULT_VAULT_ID);
      assert.equal(list.length, 1);
      assert.equal(list[0].status, 'APPOINTED');
    });

    it('enforces maximum 1 current Trustee per Vault with 409 TRUSTEE_ALREADY_EXISTS', async () => {
      await createTrustee(DEFAULT_VAULT_ID, {
        fullName: 'Trustee One',
        phone: '0901234567',
      });

      await assert.rejects(
        async () => {
          await createTrustee(DEFAULT_VAULT_ID, {
            fullName: 'Trustee Two',
            email: 'two@example.com',
          });
        },
        (err) => {
          // Contract error: 409 TRUSTEE_ALREADY_EXISTS
          assert.equal(err.code, 'TRUSTEE_ALREADY_EXISTS');
          assert.equal(err.status, 409);
          return true;
        }
      );
    });

    it('trustee is optional and vault has empty trustee list initially', async () => {
      const list = await getTrustees(DEFAULT_VAULT_ID);
      assert.equal(list.length, 0);
    });
  });

  describe('Beneficiary Flow (ST-05)', () => {
    it('creates Beneficiary without account creation or userId', async () => {
      const beneficiary = await createBeneficiary(DEFAULT_VAULT_ID, {
        fullName: 'Trần Thị Thụ Hưởng',
        relationship: 'Con gái',
        dateOfBirth: '2005-01-01',
        email: 'daughter@example.com',
      });

      assert.ok(beneficiary.id);
      assert.equal(beneficiary.vaultId, DEFAULT_VAULT_ID);
      assert.equal(beneficiary.fullName, 'Trần Thị Thụ Hưởng');
      assert.equal(beneficiary.relationship, 'Con gái');
      assert.equal(beneficiary.dateOfBirth, '2005-01-01');

      // CRITICAL SCOPE BOUNDARIES:
      // No account, no userId, no Claim Link, no Guest Portal, no OTP
      assert.equal(beneficiary.userId, undefined);
      assert.equal(beneficiary.claimLink, undefined);
      assert.equal(beneficiary.otp, undefined);
      assert.equal(beneficiary.guestPortalUrl, undefined);

      // No share ratio or percentage
      assert.equal(beneficiary.sharePercentage, undefined);
      assert.equal(beneficiary.allocation, undefined);
    });

    it('lists multiple beneficiaries successfully', async () => {
      await createBeneficiary(DEFAULT_VAULT_ID, { fullName: 'Người hưởng 1' });
      await createBeneficiary(DEFAULT_VAULT_ID, { fullName: 'Người hưởng 2' });

      const list = await getBeneficiaries(DEFAULT_VAULT_ID);
      assert.equal(list.length, 2);
      assert.equal(list[0].fullName, 'Người hưởng 1');
      assert.equal(list[1].fullName, 'Người hưởng 2');
    });
  });

  describe('Configuration Readiness (>= 1 Beneficiary required)', () => {
    it('is not ready if no Beneficiary has been added', async () => {
      const readiness = await checkConfigurationReadiness(DEFAULT_VAULT_ID);
      assert.equal(readiness.isReady, false);
      assert.equal(readiness.beneficiaryCount, 0);
      assert.equal(readiness.hasTrustee, false);
    });

    it('is ready when 1 Beneficiary is added even without a Trustee (Trustee is optional)', async () => {
      await createBeneficiary(DEFAULT_VAULT_ID, { fullName: 'Trần Văn C' });

      const readiness = await checkConfigurationReadiness(DEFAULT_VAULT_ID);
      assert.equal(readiness.isReady, true);
      assert.equal(readiness.beneficiaryCount, 1);
      assert.equal(readiness.hasTrustee, false);
    });

    it('is ready when 1 Beneficiary and 1 Trustee are configured', async () => {
      await createTrustee(DEFAULT_VAULT_ID, {
        fullName: 'Nguyễn Văn Giám Hộ',
        phone: '0901234567',
      });
      await createBeneficiary(DEFAULT_VAULT_ID, { fullName: 'Trần Văn C' });

      const readiness = await checkConfigurationReadiness(DEFAULT_VAULT_ID);
      assert.equal(readiness.isReady, true);
      assert.equal(readiness.beneficiaryCount, 1);
      assert.equal(readiness.hasTrustee, true);
    });
  });
});
