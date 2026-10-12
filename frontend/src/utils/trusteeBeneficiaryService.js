import { validateTrustee } from './trusteeValidation.js';
import { validateBeneficiary } from './beneficiaryValidation.js';
export const DEFAULT_VAULT_ID = '00000000-0000-0000-0000-000000000001';
const stores = { trustee: new Map(), beneficiary: new Map() };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (code, status) => Object.assign(new Error(code), { code, status });
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export function resetMockData() { stores.trustee.clear(); stores.beneficiary.clear(); }
export function isPeoplePreview(options = {}) {
  const env = import.meta.env;
  if (env?.PROD) return false;
  return Boolean(options.isDevPreview && (env?.DEV || (!env && options.isTest && globalThis.process?.versions?.node)));
}
function context(vaultId, options) {
  if (options.signal?.aborted) throw error('ABORTED');
  const preview = isPeoplePreview(options);
  const id = preview ? vaultId || DEFAULT_VAULT_ID : vaultId;
  if (!UUID.test(id || '')) throw error('BACKEND_NOT_READY');
  return { id, preview };
}
function payload(kind, data) {
  const fields = kind === 'trustee' ? ['fullName','phone','email','relationship','note'] : ['fullName','phone','email','relationship','dateOfBirth'];
  const result = Object.fromEntries(fields.map(key => [key, typeof data[key] === 'string' ? data[key].trim() || null : null]));
  const errors = (kind === 'trustee' ? validateTrustee : validateBeneficiary)(result);
  if (Object.keys(errors).length) throw error('VALIDATION_FAILED');
  return result;
}
function record(kind, data, vaultId, creation = false) {
  if (!UUID.test(data?.id || '') || data.vaultId !== vaultId || !text(data.fullName,150) || !date(data.createdAt) || !date(data.updatedAt) ||
      (kind === 'trustee' ? !['APPOINTED','REVOKED'].includes(data.status) || (creation && data.status !== 'APPOINTED') : data.status !== 'DESIGNATED' || data.hasAccount !== false)) throw error('BACKEND_NOT_READY');
  const fields = kind === 'trustee' ? ['phone','email','relationship','note'] : ['phone','email','relationship','dateOfBirth'];
  if (fields.some(key => data[key] != null && typeof data[key] !== 'string')) throw error('BACKEND_NOT_READY');
  let safe; try { safe = payload(kind,data); } catch { throw error('BACKEND_NOT_READY'); }
  return { id:data.id, vaultId, ...safe, status:data.status, createdAt:data.createdAt, updatedAt:data.updatedAt, ...(kind === 'beneficiary' ? { hasAccount:false } : {}) };
}
async function request(url, method, body, options) {
  const headers = { Accept:'application/json', 'Accept-Language':options.lang === 'en' ? 'en' : 'vi' };
  if (body) headers['Content-Type'] = 'application/json';
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
  let response;
  try { response = await fetch(url, { method, headers, signal:options.signal, ...(body ? {body:JSON.stringify(body)} : {}) }); }
  catch { throw error(options.signal?.aborted ? 'ABORTED' : 'NETWORK_ERROR'); }
  if (response.status !== (method === 'POST' ? 201 : 200)) {
    let code = {400:'VALIDATION_FAILED',401:'UNAUTHORIZED',403:'FORBIDDEN',404:'NOT_FOUND'}[response.status] || (response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'BACKEND_NOT_READY');
    if (response.status === 409) {
      let parsed; try { parsed = await response.json(); } catch { /* no raw message */ }
      code = parsed?.code === 'TRUSTEE_ALREADY_EXISTS' ? 'TRUSTEE_ALREADY_EXISTS' : 'VAULT_NOT_EDITABLE';
    }
    throw error(code,response.status);
  }
  try {
    if (!/application\/(?:[a-z0-9.+-]*\+)?json/i.test(response.headers.get('content-type') || '')) throw error('BACKEND_NOT_READY');
    return await response.json();
  } catch { throw error('BACKEND_NOT_READY'); }
}
async function list(kind, vaultId, options = {}) {
  const {id,preview} = context(vaultId,options);
  if (preview) {
    const all = (stores[kind].get(id) || []).map(item => structuredClone(item));
    const current = kind === 'trustee' ? all.filter(item => item.status === 'APPOINTED') : all;
    return Object.assign(current, { totalElements:current.length });
  }
  const page = Number.isSafeInteger(options.page) && options.page >= 0 ? options.page : 0;
  const url = kind === 'trustee' ? `/api/v1/trustees?vaultId=${encodeURIComponent(id)}` : `/api/v1/vaults/${id}/beneficiaries?page=${page}&size=20`;
  const data = await request(url,'GET',null,options);
  if (!Array.isArray(data?.content) || !Number.isSafeInteger(data.totalElements) || data.totalElements < data.content.length || (kind === 'trustee' && data.totalElements > 1) ||
      (data.totalElements > page * 20 && data.content.length === 0)) throw error('BACKEND_NOT_READY');
  let items = data.content.map(item => record(kind,item,id));
  if (new Set(items.map(item => item.id)).size !== items.length) throw error('BACKEND_NOT_READY');
  if (kind === 'trustee') items = items.filter(item => item.status === 'APPOINTED');
  return Object.assign(items,{totalElements:kind === 'trustee' ? items.length : data.totalElements});
}
async function create(kind,vaultId,data,options = {}) {
  const {id,preview} = context(vaultId,options);
  const body = payload(kind,data);
  if (preview) {
    const all = stores[kind].get(id) || [];
    if (kind === 'trustee' && all.some(item => item.status === 'APPOINTED')) throw error('TRUSTEE_ALREADY_EXISTS',409);
    const now = new Date().toISOString();
    const created = record(kind,{id:globalThis.crypto.randomUUID(),vaultId:id,...body,status:kind === 'trustee' ? 'APPOINTED' : 'DESIGNATED',hasAccount:false,createdAt:now,updatedAt:now},id,true);
    stores[kind].set(id,[...all,created]); return structuredClone(created);
  }
  const url = kind === 'trustee' ? '/api/v1/trustees' : `/api/v1/vaults/${id}/beneficiaries`;
  const dataResult = await request(url,'POST',kind === 'trustee' ? {vaultId:id,...body} : body,options);
  const created = record(kind,dataResult,id,true);
  if (created.fullName !== body.fullName) throw error('BACKEND_NOT_READY');
  return created;
}
export const getTrustees = (id,options) => list('trustee',id,options);
export const getBeneficiaries = (id,options) => list('beneficiary',id,options);
export const createTrustee = (id,data,options) => create('trustee',id,data,options);
export const createBeneficiary = (id,data,options) => create('beneficiary',id,data,options);
// This is only the people requirement, never a declaration that the whole Vault/DMS is ready.
export async function checkConfigurationReadiness(id,options) {
  const [trustees,beneficiaries] = await Promise.all([getTrustees(id,options),getBeneficiaries(id,options)]);
  return {isReady:beneficiaries.totalElements >= 1,beneficiaryCount:beneficiaries.totalElements,hasTrustee:trustees.length > 0};
}
