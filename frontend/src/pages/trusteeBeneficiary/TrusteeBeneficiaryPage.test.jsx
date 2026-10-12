import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import Page from './TrusteeBeneficiaryPage.jsx';
import * as service from '../../utils/trusteeBeneficiaryService.js';
const person={id:'11111111-2222-3333-4444-555555555555',fullName:'Sample beneficiary'};
beforeEach(()=>{vi.spyOn(service,'getTrustees').mockResolvedValue([]);vi.spyOn(service,'getBeneficiaries').mockResolvedValue(Object.assign([],{totalElements:0}));});
afterEach(()=>vi.restoreAllMocks());
async function start(props={}){const view=render(<Page {...props}/>);await screen.findByRole('button',{name:'Bỏ qua người quản lý'});return view;}
it('skips trustee locally but still requires a beneficiary; no account or old flow',async()=>{
  await start();fireEvent.click(screen.getByRole('button',{name:'Bỏ qua người quản lý'}));
  expect(screen.getByText('Cần bổ sung người thụ hưởng')).toBeInTheDocument();expect(screen.queryByRole('form',{name:'Người quản lý'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Khai báo người quản lý'}));expect(screen.getByRole('form',{name:'Người quản lý'})).toBeInTheDocument();
  expect(screen.queryByText(/ST-04|ST-05|APPOINTED|Claim Link|OTP|Guest Portal/)).not.toBeInTheDocument();
});
it('changes validation language without clearing input',async()=>{
  const view=await start();fireEvent.submit(screen.getByRole('form',{name:'Người quản lý'}));
  expect(screen.getByText(/Vui lòng nhập họ/)).toBeInTheDocument();view.rerender(<Page lang="en"/>);
  expect(screen.getByText('Please enter the Trustee full name.')).toBeInTheDocument();
});
it('blocks repeated creation, updates the list and clears the successful form without needing account fields',async()=>{
  let resolve;vi.spyOn(service,'createBeneficiary').mockImplementation(()=>new Promise(yes=>{resolve=yes;}));await start();
  const form=screen.getByRole('form',{name:'Người thụ hưởng'});fireEvent.change(form.querySelector('#beneficiary-fullName'),{target:{value:'Sample beneficiary'}});
  fireEvent.submit(form);fireEvent.submit(form);expect(service.createBeneficiary).toHaveBeenCalledTimes(1);expect(screen.getByRole('button',{name:'Đang lưu…'})).toBeDisabled();
  resolve(person);expect(await screen.findByText('Đã có người thụ hưởng')).toBeInTheDocument();expect(screen.getByText('Sample beneficiary')).toBeInTheDocument();expect(form.querySelector('#beneficiary-fullName')).toHaveValue('');
});
it('retains form after a safe localized failure',async()=>{
  vi.spyOn(service,'createBeneficiary').mockRejectedValue({code:'FORBIDDEN',message:'secret SQL'});await start();
  const form=screen.getByRole('form',{name:'Người thụ hưởng'});fireEvent.change(form.querySelector('#beneficiary-fullName'),{target:{value:'Sample'}});fireEvent.submit(form);
  expect(await screen.findByRole('alert')).toHaveTextContent('không có quyền');expect(form.querySelector('#beneficiary-fullName')).toHaveValue('Sample');expect(screen.queryByText('secret SQL')).not.toBeInTheDocument();
});
it('failed initial read does not show empty/readiness success and supports retry',async()=>{
  service.getBeneficiaries.mockRejectedValueOnce({code:'BACKEND_NOT_READY'});render(<Page/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Chưa thể kết nối');expect(screen.queryByRole('form')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Thử lại'}));expect(await screen.findByText('Chưa có người thụ hưởng.')).toBeInTheDocument();
});
it('aborts pending creation and ignores late success when changing vault',async()=>{
  let resolve,options;vi.spyOn(service,'createBeneficiary').mockImplementation((v,d,o)=>{options=o;return new Promise(yes=>{resolve=yes;});});
  const view=await start({vaultId:'first'});const form=screen.getByRole('form',{name:'Người thụ hưởng'});fireEvent.change(form.querySelector('#beneficiary-fullName'),{target:{value:'Sample'}});fireEvent.submit(form);
  view.rerender(<Page vaultId="second"/>);expect(options.signal.aborted).toBe(true);resolve(person);
  await waitFor(()=>expect(screen.queryByText('Sample beneficiary')).not.toBeInTheDocument());
});
it('loads later pages without treating first-page size as total beneficiaries',async()=>{
  service.getBeneficiaries.mockResolvedValueOnce(Object.assign([person],{totalElements:2})).mockResolvedValueOnce(Object.assign([{id:'second',fullName:'Second person'}],{totalElements:2}));
  await start();fireEvent.click(screen.getByRole('button',{name:'Xem thêm'}));expect(await screen.findByText('Second person')).toBeInTheDocument();expect(service.getBeneficiaries).toHaveBeenLastCalledWith(undefined,expect.objectContaining({page:1}));
});
