import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVaultInput,
  fetchVault,
  createVault,
  VAULT_SCENARIOS,
  vaultStatusMessages,
} from './vaultService.js';

test('Vault Service - Scenario list is properly exported', () => {
  assert.ok(Array.isArray(VAULT_SCENARIOS));
  assert.ok(VAULT_SCENARIOS.length >= 7);
  const activeScenario = VAULT_SCENARIOS.find((s) => s.id === 'exists');
  assert.ok(activeScenario);
  assert.match(activeScenario.labelVi, /ACTIVE/);
});

test('Vault Validation - Required name validation (VI and EN)', () => {
  const empty = { vault_name: '', description: '' };
  const errVi = validateVaultInput(empty, 'vi');
  assert.equal(errVi.vault_name, vaultStatusMessages.vi.nameRequired);

  const errEn = validateVaultInput(empty, 'en');
  assert.equal(errEn.vault_name, vaultStatusMessages.en.nameRequired);
});

test('Vault Validation - Length constraints (2 to 150 chars, desc <= 1000)', () => {
  const tooShort = { vault_name: 'A' };
  assert.equal(
    validateVaultInput(tooShort, 'vi').vault_name,
    vaultStatusMessages.vi.nameMin
  );

  const tooLong = { vault_name: 'A'.repeat(151) };
  assert.equal(
    validateVaultInput(tooLong, 'vi').vault_name,
    vaultStatusMessages.vi.nameMax
  );

  const descTooLong = { vault_name: 'Kho di sản', description: 'D'.repeat(1001) };
  assert.equal(
    validateVaultInput(descTooLong, 'vi').description,
    vaultStatusMessages.vi.descMax
  );

  const valid = { vault_name: 'Kho gia đình Vance', description: 'Gìn giữ di sản số' };
  assert.deepEqual(validateVaultInput(valid, 'vi'), {});
});

test('Vault Service - Fetch existing active vault has status ACTIVE', async () => {
  const data = await fetchVault({ scenario: 'exists', lang: 'vi' });
  assert.ok(data);
  assert.equal(data.status, 'ACTIVE');
  assert.ok(data.name || data.vault_name);
});

test('Vault Service - Fetch empty state scenario returns null', async () => {
  const data = await fetchVault({ scenario: 'empty', lang: 'vi' });
  assert.equal(data, null);
});

test('Vault Service - HTTP 401 and 403 scenarios throw appropriate errors', async () => {
  await assert.rejects(
    async () => {
      await fetchVault({ scenario: 'unauthorized', lang: 'vi' });
    },
    (err) => {
      assert.equal(err.status, 401);
      assert.equal(err.code, 'UNAUTHORIZED');
      return true;
    }
  );

  await assert.rejects(
    async () => {
      await fetchVault({ scenario: 'forbidden', lang: 'vi' });
    },
    (err) => {
      assert.equal(err.status, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('Vault Service - Create vault produces an ACTIVE vault', async () => {
  const newVault = await createVault(
    { vault_name: 'Kho di sản mới', description: 'Mô tả thử nghiệm' },
    { lang: 'vi', scenario: 'success' }
  );

  assert.ok(newVault);
  assert.equal(newVault.status, 'ACTIVE');
  assert.equal(newVault.vault_name, 'Kho di sản mới');
  assert.equal(newVault.isSimulation, true);
});

test('Vault Service - Live fetch: Non-JSON response triggers BACKEND_NOT_READY', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 404,
    headers: { get: () => 'text/html' },
    json: async () => { throw new Error('Not JSON'); },
  });

  await assert.rejects(
    async () => {
      await fetchVault({ isDevPreview: false, lang: 'vi', fetchFn: mockFetch });
    },
    (err) => {
      assert.equal(err.code, 'BACKEND_NOT_READY');
      return true;
    }
  );
});

test('Vault Service - Live fetch: 404 status returns null for uninitialized vault', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 404,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Not found' }),
  });

  const result = await fetchVault({ isDevPreview: false, lang: 'vi', fetchFn: mockFetch });
  assert.equal(result, null);
});