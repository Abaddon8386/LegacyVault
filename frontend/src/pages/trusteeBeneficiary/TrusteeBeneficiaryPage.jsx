import { useEffect, useRef, useState } from 'react';
import { validateTrustee } from '../../utils/trusteeValidation.js';
import { validateBeneficiary } from '../../utils/beneficiaryValidation.js';
import { getTrustees, getBeneficiaries, createTrustee, createBeneficiary } from '../../utils/trusteeBeneficiaryService.js';
import './TrusteeBeneficiaryPage.css';
const copy = {
  vi: {
    title:'Người quản lý & Người thụ hưởng', intro:'Khai báo người hỗ trợ liên hệ và những người bạn chỉ định thụ hưởng di sản.',
    trustee:'Người quản lý', beneficiary:'Người thụ hưởng', optional:'Tùy chọn', required:'Cần ít nhất một người',
    trusteeHint:'Bạn có thể bỏ qua người quản lý. Người này không cần tài khoản, không được cấp quyền mở kho hoặc xem tài sản và không tự trở thành người thụ hưởng.',
    beneficiaryHint:'Thêm ít nhất một người thụ hưởng. Người được khai báo chưa cần tài khoản tại bước này.',
    skip:'Bỏ qua người quản lý', unskip:'Khai báo người quản lý', skipped:'Bạn chưa chỉ định người quản lý. Có thể bổ sung sau.',
    empty:'Chưa có người thụ hưởng.', readiness:'Thông tin người thụ hưởng', ready:'Đã có người thụ hưởng', pending:'Cần bổ sung người thụ hưởng',
    scope:'Đây là điều kiện về người thụ hưởng; các bước thiết lập kho khác vẫn cần được hoàn tất.',
    save:'Lưu người quản lý', add:'Thêm người thụ hưởng', saved:'Đã lưu thông tin.', saving:'Đang lưu…', loading:'Đang tải thông tin…',
    retry:'Thử lại', more:'Xem thêm', appointed:'Đã chỉ định', contact:'Nhập ít nhất một cách liên hệ: số điện thoại hoặc email.',
    fullName:'Họ và tên', phone:'Số điện thoại', email:'Email', relationship:'Mối quan hệ', note:'Ghi chú', dateOfBirth:'Ngày sinh',
    errors:{ BACKEND_NOT_READY:'Chưa thể kết nối hồ sơ. Vui lòng thử lại sau.', UNAUTHORIZED:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      FORBIDDEN:'Bạn không có quyền quản lý thông tin trong kho này.', NOT_FOUND:'Không tìm thấy kho di sản.', TRUSTEE_ALREADY_EXISTS:'Kho đã có người quản lý. Vui lòng tải lại thông tin.',
      VAULT_NOT_EDITABLE:'Kho hiện không cho phép thay đổi thông tin.', VALIDATION_FAILED:'Vui lòng kiểm tra lại thông tin đã nhập.', GENERIC:'Không thể lưu hoặc tải thông tin. Vui lòng kiểm tra kết nối và thử lại.' },
  },
  en: {
    title:'Trustee & Beneficiaries', intro:'Record a supporting contact and the people you designate as beneficiaries of your heritage.',
    trustee:'Trustee', beneficiary:'Beneficiaries', optional:'Optional', required:'At least one person required',
    trusteeHint:'You may skip the trustee. They do not need an account, gain no access to unlock the vault or view assets, and do not automatically become a beneficiary.',
    beneficiaryHint:'Add at least one beneficiary. They do not need an account at this step.',
    skip:'Skip trustee', unskip:'Set up trustee', skipped:'No trustee designated. You can add one later.',
    empty:'No beneficiaries yet.', readiness:'Beneficiary information', ready:'Beneficiary added', pending:'Add a beneficiary',
    scope:'This covers the beneficiary requirement. Other vault setup steps still need to be completed.',
    save:'Save trustee', add:'Add beneficiary', saved:'Information saved.', saving:'Saving…', loading:'Loading information…',
    retry:'Try again', more:'Load more', appointed:'Appointed', contact:'Provide at least one contact method: phone or email.',
    fullName:'Full name', phone:'Phone number', email:'Email', relationship:'Relationship', note:'Note', dateOfBirth:'Date of birth',
    errors:{ BACKEND_NOT_READY:'Records cannot be reached yet. Please try again later.', UNAUTHORIZED:'Your session has expired. Please sign in again.',
      FORBIDDEN:'You do not have permission to manage this vault.', NOT_FOUND:'Heritage vault not found.', TRUSTEE_ALREADY_EXISTS:'This vault already has a trustee. Please reload its records.',
      VAULT_NOT_EDITABLE:'This vault currently does not allow changes.', VALIDATION_FAILED:'Please check the information entered.', GENERIC:'Unable to save or load information. Please check your connection and try again.' },
  },
};
const fields = { trustee:['fullName','phone','email','relationship','note'], beneficiary:['fullName','relationship','dateOfBirth','phone','email'] };
const blank = kind => Object.fromEntries(fields[kind].map(key => [key,'']));
export default function TrusteeBeneficiaryPage(props) {
  return <PeopleForm key={JSON.stringify([props.vaultId,props.accessToken,props.isDevPreview])} {...props} />;
}
function PeopleForm({lang='vi',vaultId,accessToken,isDevPreview=false}) {
  const language = lang === 'en' ? 'en' : 'vi'; const t = copy[language];
  const [trustees,setTrustees] = useState([]); const [beneficiaries,setBeneficiaries] = useState([]);
  const [total,setTotal] = useState(0); const [page,setPage] = useState(0);
  const [loaded,setLoaded] = useState(false); const [loadError,setLoadError] = useState(null); const [reload,setReload] = useState(0);
  const [skipped,setSkipped] = useState(false); const [busy,setBusy] = useState(null); const [notice,setNotice] = useState(null);
  const [forms,setForms] = useState({trustee:blank('trustee'),beneficiary:blank('beneficiary')});
  const [validated,setValidated] = useState({trustee:false,beneficiary:false});
  const initialLanguage = useRef(language);
  const pending = useRef(false); const controller = useRef(null); const active = useRef(false);
  useEffect(() => {
    active.current = true; const request = new AbortController();
    Promise.all([getTrustees(vaultId,{isDevPreview,accessToken,lang:initialLanguage.current,signal:request.signal}),getBeneficiaries(vaultId,{isDevPreview,accessToken,lang:initialLanguage.current,signal:request.signal})])
      .then(([a,b]) => { if (!request.signal.aborted) {setTrustees(a);setBeneficiaries(b);setTotal(b.totalElements ?? b.length);setPage(0);setLoaded(true);setLoadError(null);} })
      .catch(err => {if (!request.signal.aborted) setLoadError(err.code || 'GENERIC');});
    return () => {active.current=false;request.abort();controller.current?.abort();};
  },[vaultId,accessToken,isDevPreview,reload]);
  const errors = {
    trustee:validated.trustee ? validateTrustee(forms.trustee,language) : {},
    beneficiary:validated.beneficiary ? validateBeneficiary(forms.beneficiary,language) : {},
  };
  async function save(event,kind) {
    event.preventDefault(); if (pending.current || !loaded) return;
    setValidated(old => ({...old,[kind]:true})); setNotice(null);
    if (Object.keys((kind === 'trustee' ? validateTrustee : validateBeneficiary)(forms[kind],language)).length) return;
    pending.current=true;setBusy(kind); const request=new AbortController();controller.current=request;
    try {
      const added = await (kind === 'trustee' ? createTrustee : createBeneficiary)(vaultId,forms[kind],{isDevPreview,accessToken,lang:language,signal:request.signal});
      if (!active.current || request.signal.aborted) return;
      if (kind === 'trustee') {setTrustees([added]);setSkipped(false);} else {setBeneficiaries(old => [added,...old]);setTotal(old => old+1);}
      setForms(old => ({...old,[kind]:blank(kind)}));setValidated(old => ({...old,[kind]:false}));setNotice({success:true});
    } catch(err) {if (active.current && !request.signal.aborted) setNotice({code:err.code || 'GENERIC'});}
    finally {if (active.current && controller.current === request) {pending.current=false;setBusy(null);controller.current=null;}}
  }
  async function more() {
    if (pending.current) return; pending.current=true;setBusy('more');setNotice(null);
    const request=new AbortController();controller.current=request;
    try {
      const next = await getBeneficiaries(vaultId,{isDevPreview,accessToken,lang:language,signal:request.signal,page:page+1});
      if (!active.current || request.signal.aborted) return;
      setBeneficiaries(old => [...old,...next.filter(person => !old.some(item => item.id === person.id))]);setTotal(next.totalElements ?? next.length);setPage(old => old+1);
    } catch(err) {if (active.current && !request.signal.aborted) setNotice({code:err.code || 'GENERIC'});}
    finally {if (active.current && controller.current === request) {pending.current=false;setBusy(null);controller.current=null;}}
  }
  function entity(person,kind) {
    return <article className="lv-tb-entity-card" key={person.id}><div className="lv-tb-entity-header"><strong className="lv-tb-entity-name">{person.fullName}</strong>{kind === 'trustee' && <span className="lv-tb-badge-active">{t.appointed}</span>}</div>
      <dl className="lv-tb-entity-grid">{fields[kind].filter(key => key !== 'fullName' && person[key]).map(key => <div className="lv-tb-entity-prop" key={key}><dt className="lv-tb-prop-label">{t[key]}</dt><dd className="lv-tb-prop-value">{person[key]}</dd></div>)}</dl></article>;
  }
  function form(kind) {
    return <form className="lv-tb-form" onSubmit={event => save(event,kind)} noValidate aria-label={t[kind]}><fieldset disabled={Boolean(busy)}>
      <div className="lv-tb-form-grid">{fields[kind].map(key => {
        const id=`${kind}-${key}`; const props={id,value:forms[kind][key],className:key === 'note' ? 'lv-tb-textarea' : 'lv-tb-input',
          maxLength:{fullName:150,relationship:100,note:500}[key], 'aria-invalid':Boolean(errors[kind][key]),'aria-describedby':errors[kind][key] ? `${id}-error` : undefined,
          onChange:event => setForms(old => ({...old,[kind]:{...old[kind],[key]:event.target.value}}))};
        return <div className={`lv-tb-field-group ${['fullName','relationship','note'].includes(key) ? 'full-width' : ''}`} key={key}><label className="lv-tb-label" htmlFor={id}>{t[key]}{key === 'fullName' && <span className="lv-tb-req"> *</span>}</label>
          {key === 'note' ? <textarea {...props} rows={3}/> : <input {...props} type={{phone:'tel',email:'email',dateOfBirth:'date'}[key] || 'text'}/>}
          {errors[kind][key] && <span className="lv-tb-error-text" role="alert" id={`${id}-error`}>{errors[kind][key]}</span>}</div>;
      })}</div>{kind === 'trustee' && <p className="lv-tb-hint">{t.contact}</p>}
      <div className="lv-tb-actions-row"><button type="submit" className="lv-tb-btn-primary">{busy === kind ? t.saving : kind === 'trustee' ? t.save : t.add}</button></div>
    </fieldset></form>;
  }
  return <section className="lv-tb-page"><div className="lv-tb-container">
    <div className="lv-tb-title-block"><h1 className="lv-tb-title">{t.title}</h1><p className="lv-tb-desc">{t.intro}</p></div>
    {notice && <div className={`lv-tb-alert ${notice.success ? 'success' : 'error'}`} role={notice.success ? 'status' : 'alert'}>{notice.success ? t.saved : t.errors[notice.code] || t.errors.GENERIC}{notice.code === 'TRUSTEE_ALREADY_EXISTS' && <button type="button" className="lv-tb-btn-secondary" onClick={() => {setLoaded(false);setNotice(null);setReload(old => old+1);}}>{t.retry}</button>}</div>}
    {!loaded ? loadError ? <div className="lv-tb-alert error" role="alert"><span>{t.errors[loadError] || t.errors.GENERIC}</span><button type="button" className="lv-tb-btn-secondary" onClick={() => {setLoadError(null);setReload(old => old+1);}}>{t.retry}</button></div> : <p role="status">{t.loading}</p> : <>
      <section className="lv-tb-readiness-banner" aria-label={t.readiness}><div className="lv-tb-readiness-header"><strong>{t.readiness}</strong><span className={`lv-tb-status-badge ${total >= 1 ? 'ready' : 'pending'}`}>{total >= 1 ? t.ready : t.pending}</span></div><p>{t.beneficiary}: {total}</p><p className="lv-tb-hint">{t.scope}</p></section>
      <div className="lv-tb-sections-stack">
        <section className="lv-tb-section-card" aria-labelledby="trustee-heading"><div className="lv-tb-section-header"><div><span className="lv-tb-section-tag">{t.optional}</span><h2 id="trustee-heading" className="lv-tb-section-title">{t.trustee}</h2></div>{!trustees.length && !skipped && <button type="button" className="lv-tb-btn-skip" disabled={Boolean(busy)} onClick={() => setSkipped(true)}>{t.skip}</button>}</div>
          <p className="lv-tb-notice-box">{t.trusteeHint}</p>
          {trustees.length ? entity(trustees[0],'trustee') : skipped ? <div className="lv-tb-skipped-state"><p>{t.skipped}</p><button type="button" className="lv-tb-btn-secondary" disabled={Boolean(busy)} onClick={() => setSkipped(false)}>{t.unskip}</button></div> : form('trustee')}
        </section>
        <section className="lv-tb-section-card" aria-labelledby="beneficiary-heading"><span className="lv-tb-section-tag">{t.required}</span><h2 id="beneficiary-heading" className="lv-tb-section-title">{t.beneficiary}</h2><p className="lv-tb-notice-box">{t.beneficiaryHint}</p>
          {!beneficiaries.length ? <p className="lv-tb-empty-state">{t.empty}</p> : beneficiaries.map(person => entity(person,'beneficiary'))}
          {beneficiaries.length < total && <button type="button" className="lv-tb-btn-secondary" disabled={Boolean(busy)} onClick={more}>{busy === 'more' ? t.loading : t.more}</button>}
          {form('beneficiary')}
        </section>
      </div>
    </>}
  </div></section>;
}
