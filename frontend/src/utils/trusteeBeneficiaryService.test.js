import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import { createTrustee,createBeneficiary,getTrustees,getBeneficiaries,checkConfigurationReadiness,DEFAULT_VAULT_ID as vault,resetMockData } from './trusteeBeneficiaryService.js';
const id='11111111-2222-3333-4444-555555555555';
const data={fullName:'Sample person',email:'sample@example.com'};
const person=(kind='beneficiary') => ({id,vaultId:vault,...data,createdAt:'2026-10-12T10:00:00Z',updatedAt:'2026-10-12T10:00:00Z',status:kind === 'trustee' ? 'APPOINTED':'DESIGNATED',hasAccount:false});
function response(body,status=200,type='application/json') { return {status,headers:new Headers({'content-type':type}),json:async()=>body}; }
let fetchMock;
beforeEach(()=>{vi.stubEnv('DEV',true);vi.stubEnv('PROD',false);resetMockData();fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it.each([401,403,404,409,500])('does not turn POST failure %s into mock success',async status=>{
  fetchMock.mockResolvedValue(response({code:'VAULT_NOT_EDITABLE',message:'secret SQL failure'},status));
  await expect(createBeneficiary(vault,data)).rejects.not.toHaveProperty('message','secret SQL failure');
  expect(await getBeneficiaries(vault,{isDevPreview:true})).toHaveLength(0);
});
it('rejects a failed read instead of inventing an empty list',async()=>{
  fetchMock.mockResolvedValue(response({},403));await expect(getTrustees(vault)).rejects.toMatchObject({code:'FORBIDDEN'});
});
it('requires real Vault context by default and production blocks all mock flags',async()=>{
  await expect(getBeneficiaries()).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
  vi.stubEnv('PROD',true);vi.stubEnv('VITE_USE_MOCK','true');
  await expect(createBeneficiary(undefined,data,{isDevPreview:true,isTest:true,isMock:true})).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
  expect(fetchMock).not.toHaveBeenCalled();
});
it('in production a valid context still calls the live API despite preview flags',async()=>{
  vi.stubEnv('PROD',true);fetchMock.mockResolvedValue(response(person(),201));
  await createBeneficiary(vault,data,{isDevPreview:true});expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('preview does not contact the API, create accounts or grant permissions',async()=>{
  const opts={isDevPreview:true};await createTrustee(vault,data,opts);
  expect((await checkConfigurationReadiness(vault,opts)).isReady).toBe(false);
  const b=await createBeneficiary(vault,{fullName:'Beneficiary'},opts);expect(b.status).toBe('DESIGNATED');expect(b.hasAccount).toBe(false);
  expect((await checkConfigurationReadiness(vault,opts)).isReady).toBe(true);expect(fetchMock).not.toHaveBeenCalled();
});
it('sends only declared fields, auth in memory and language; strips secret response fields',async()=>{
  fetchMock.mockResolvedValue(response({...person(),userId:'secret',identityNumber:'private',claimLink:'url',password:'hidden'},201));
  const result=await createBeneficiary(vault,{...data,userId:'forbidden',allocation:50},{accessToken:'unit-test-token',lang:'en'});
  const options=fetchMock.mock.calls[0][1];expect(options.headers.Authorization).toBe('Bearer unit-test-token');expect(options.headers['Accept-Language']).toBe('en');
  expect(JSON.parse(options.body)).not.toHaveProperty('userId');expect(options.body).not.toContain('allocation');
  expect(result).not.toHaveProperty('identityNumber');expect(result).not.toHaveProperty('claimLink');expect(result).not.toHaveProperty('password');
});
it.each([
  ['wrong Vault',p=>{p.vaultId='22222222-2222-3333-4444-555555555555';}],
  ['missing ID',p=>{delete p.id;}],['wrong status',p=>{p.status='ACTIVE';}],
  ['linked account',p=>{p.hasAccount=true;}],['missing name',p=>{delete p.fullName;}],['missing date',p=>{delete p.createdAt;}],
])('rejects beneficiary response with %s',async(_,mutate)=>{
  const p=person();mutate(p);fetchMock.mockResolvedValue(response(p,201));
  await expect(createBeneficiary(vault,data)).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
});
it('rejects revoked trustee as a creation receipt',async()=>{
  fetchMock.mockResolvedValue(response({...person('trustee'),status:'REVOKED'},201));
  await expect(createTrustee(vault,data)).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
});
it.each([200,204])('requires 201 for creation, not %s',async status=>{
  fetchMock.mockResolvedValue(response(person(),status));await expect(createBeneficiary(vault,data)).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
});
it('does not accept HTML SPA fallback or malformed list envelope',async()=>{
  fetchMock.mockResolvedValue(response({},200,'text/html'));await expect(getBeneficiaries(vault)).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
  fetchMock.mockResolvedValue(response({items:[],totalElements:0}));await expect(getBeneficiaries(vault)).rejects.toMatchObject({code:'BACKEND_NOT_READY'});
});
it('preserves count and requests later pages through the proposed envelope',async()=>{
  fetchMock.mockResolvedValue(response({content:[person()],totalElements:25}));
  const list=await getBeneficiaries(vault,{page:1});expect(list.totalElements).toBe(25);expect(fetchMock.mock.calls[0][0]).toContain('page=1&size=20');
});
it('maps duplicate trustee without echoing technical server messages',async()=>{
  fetchMock.mockResolvedValue(response({code:'TRUSTEE_ALREADY_EXISTS',message:'private database index'},409));
  await expect(createTrustee(vault,data)).rejects.toMatchObject({code:'TRUSTEE_ALREADY_EXISTS',message:'TRUSTEE_ALREADY_EXISTS'});
});
it('aborted operation never sends a request',async()=>{
  const controller=new AbortController();controller.abort();await expect(createBeneficiary(vault,data,{signal:controller.signal})).rejects.toMatchObject({code:'ABORTED'});expect(fetchMock).not.toHaveBeenCalled();
});
