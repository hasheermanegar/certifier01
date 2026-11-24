import {lazy,Suspense,useEffect,useState} from "react";
import Sidebar from "./components/Sidebar";import Topbar from "./components/Topbar";import LoadingScreen from "./components/LoadingScreen";



import "./styles.css";
import AuthScreen from "./components/AuthScreen";
import { api, authStorage, API_BASE } from "./services/api";
import PublicCertificateVerification from "./pages/PublicCertificateVerification";

const Dashboard=lazy(()=>import("./pages/Dashboard"));
const DesignTemplates=lazy(()=>import("./pages/DesignTemplates"));
const CredentialTemplates=lazy(()=>import("./pages/CredentialTemplates"));
const AllCredentials=lazy(()=>import("./pages/AllCredentials"));
const Pathways=lazy(()=>import("./pages/Pathways"));
const Analytics=lazy(()=>import("./pages/Analytics"));
const CredentialUsage=lazy(()=>import("./pages/CredentialUsage"));
const Settings=lazy(()=>import("./pages/Settings"));
const HelpCenter=lazy(()=>import("./pages/HelpCenter"));
const EmailTemplates=lazy(()=>import("./pages/EmailTemplates"));
const Forms=lazy(()=>import("./pages/Forms"));
const Integrations=lazy(()=>import("./pages/Integrations"));
const GettingStarted=lazy(()=>import("./pages/GettingStarted"));
const Recipients=lazy(()=>import("./pages/Recipients"));
const BulkIssuing=lazy(()=>import("./pages/BulkIssuing"));
const CertificateDesigner=lazy(()=>import("./designer/CertificateDesigner"));
const uid=()=>crypto.randomUUID();const fresh=()=>({id:uid(),name:"Untitled certificate",orientation:"landscape",width:1120,height:790,background:"#fff",elements:[{id:uid(),type:"text",x:100,y:90,width:920,height:70,text:"CERTIFICATE OF ACHIEVEMENT",fontSize:36,bold:true,color:"#17233d",align:"center"},{id:uid(),type:"text",x:150,y:230,width:820,height:50,text:"This certificate is proudly presented to",fontSize:20,color:"#64748b",align:"center"},{id:uid(),type:"attribute",x:150,y:300,width:820,height:70,text:"{{recipient_name}}",fontSize:40,bold:true,color:"#315eea",align:"center"},{id:uid(),type:"text",x:150,y:420,width:820,height:50,text:"For successfully completing the programme",fontSize:19,color:"#475569",align:"center"},{id:uid(),type:"attribute",x:250,y:520,width:620,height:40,text:"{{issue_date}}",fontSize:16,color:"#475569",align:"center"}]});
const read=(k)=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}};
const emailDeliveryMessage=(status,email,action="Certificate issued")=>{
  if(status==="sent")return `${action}; the email was sent to ${email}.`;
  if(status==="pending"||status==="sending")return `${action}; the email is queued and will be sent in the background.`;
  if(status==="not_configured")return `${action}, but no email was sent because email delivery is not configured on the server. Configure SMTP settings on the backend, then retry.`;
  return `${action}, but email delivery failed. Check the backend SMTP settings and logs, then retry.`;
};
const mergeCredentialRecipients=(previous,credentials)=>{
  const map=new Map();
  previous.forEach(r=>{
    const email=(r.email||"").trim().toLowerCase();
    const key=email||("id:"+r.id);
    if(!map.has(key))map.set(key,r);
    else{
      const existing=map.get(key);
      if((r.name||"").length>(existing.name||"").length){
        map.set(key,{...existing,...r,id:existing.id,organization:r.organization||existing.organization});
      }
    }
  });
  credentials.forEach(c=>{
    const email=(c.email||"").trim().toLowerCase();
    if(email&&!map.has(email))map.set(email,{id:uid(),name:c.recipient||"Unknown recipient",email,organization:"",createdAt:c.issuedAt||new Date().toISOString()});
  });
  return [...map.values()];
};
export default function App(){const[page,setPage]=useState("Dashboard"),[mobileNavOpen,setMobileNavOpen]=useState(false),[loading,setLoading]=useState(true),[authChecking,setAuthChecking]=useState(()=>Boolean(authStorage.getToken())),[user,setUser]=useState(null),[designs,setDesigns]=useState(read("cp-designs")),[credentials,setCredentials]=useState(read("cp-creds")),[recipients,setRecipients]=useState(()=>mergeCredentialRecipients(read("cp-recipients"),read("cp-creds"))),[pathways,setPathways]=useState(read("cp-pathways")),[emailTemplates,setEmailTemplates]=useState(read("cp-email-templates")),[forms,setForms]=useState(read("cp-forms")),[active,setActive]=useState(null),[modal,setModal]=useState(false);
useEffect(()=>{let t=setTimeout(()=>setLoading(false),300);return()=>clearTimeout(t)},[]);
useEffect(()=>{
  let active=true;
  const token=authStorage.getToken();
  if(!token)return;

  api.me().then(result=>{
    if(result.user?.role !== "admin"){
      authStorage.clearToken();
      if(active)setUser(null);
      return;
    }
    if(active)setUser(result.user);
  }).catch(()=>{
    authStorage.clearToken();
    if(active)setUser(null);
  }).finally(()=>{
    if(active)setAuthChecking(false);
  });

  return()=>{active=false;};
},[]);
useEffect(()=>{
  if(!user)return;
  let cancelled=false;
  (async()=>{
    try{
      const result=await api.getTemplates();
      const remote=result.certificates||[];
      const current=read("cp-designs");
      const synced=remote.map(item=>{
        const existing=current.find(d=>d.backendId===item._id);
        const saved=item.design||{};
        return {...saved,id:existing?.id||saved.id||uid(),backendId:item._id,name:saved.name||item.title||"Untitled certificate"};
      });
      const migrated=[];
      for(const design of current.filter(d=>!d.backendId)){
        const created=await api.createTemplate({title:design.name||"Untitled certificate",description:"",design,organization:user.organization||""});
        migrated.push({...design,backendId:created.certificate._id});
      }
      if(!cancelled)setDesigns([...migrated,...synced,...current.filter(d=>d.backendId&&!synced.some(x=>x.backendId===d.backendId))]);
    }catch(error){
      console.error("Template sync failed:",error);
      if(!cancelled)window.alert("Could not sync certificate templates with the server: "+error.message);
    }
  })();
  return()=>{cancelled=true;};
},[user]);

useEffect(()=>{
  if(!user)return;
  let cancelled=false;
  (async()=>{
    try{
      const local=read("cp-recipients");
      const pending=local.filter(r=>!r.backendId&&r.name&&r.email);
      if(pending.length){
        await api.bulkCreateRecipients(pending.map(r=>({name:r.name,email:r.email,organization:r.organization||""})));
      }
      const result=await api.getRecipients();
      const remote=result.recipients||[];
      const synced=remote.map(item=>{
        const existing=local.find(r=>r.backendId===item._id)||local.find(r=>(r.email||"").trim().toLowerCase()===(item.email||"").trim().toLowerCase());
        return {...existing,...item,id:existing?.id||item._id,backendId:item._id,createdAt:item.createdAt||existing?.createdAt};
      });
      if(!cancelled)setRecipients(mergeCredentialRecipients(synced,read("cp-creds")));
    }catch(error){
      console.error("Recipient sync failed:",error);
      if(!cancelled)window.alert("Could not sync recipients with the server: "+error.message);
    }
  })();
  return()=>{cancelled=true;};
},[user]);

useEffect(()=>{
  if(!user)return;
  let cancelled=false;
  (async()=>{
    try{
      const result=await api.getIssuedCertificates();
      const remote=result.certificates||[];
      const synced=remote.map(item=>{
        const existing=read("cp-creds").find(c=>c.certificateId===item.certificateId);
        return {
          ...existing,
          id:existing?.id||item._id,
          backendId:item._id,
          certificateId:item.certificateId,
          recipient:item.recipient?.name||item.recipientSnapshot?.name||existing?.recipient||"Unknown recipient",
          email:item.recipient?.email||item.recipientSnapshot?.email||existing?.email||"",
          title:item.template?.title||item.templateSnapshot?.title||existing?.title||"Certificate",
          issuedAt:item.issuedAt||existing?.issuedAt,
          status:item.status==="revoked"?"Revoked":item.status==="expired"?"Expired":"Issued",
          expiresAt:item.expiresAt||existing?.expiresAt||"",
          emailStatus:item.emailStatus||existing?.emailStatus||"not_configured",
          emailSentAt:item.emailSentAt||existing?.emailSentAt||"",
          verificationUrl:item.verificationUrl||existing?.verificationUrl||"",
          qrCode:item.qrCode||existing?.qrCode||""
        };
      });
      if(!cancelled){
        setCredentials(previous=>{
          const ids=new Set(synced.map(c=>c.certificateId));
          return [...synced,...previous.filter(c=>!c.certificateId||!ids.has(c.certificateId))];
        });
      }
    }catch(error){
      console.error("Issued certificate sync failed:",error);
      if(!cancelled)window.alert("Could not load issued certificates: "+error.message);
    }
  })();
  return()=>{cancelled=true;};
},[user]);

useEffect(()=>localStorage.setItem("cp-designs",JSON.stringify(designs)),[designs]);useEffect(()=>localStorage.setItem("cp-creds",JSON.stringify(credentials)),[credentials]);useEffect(()=>localStorage.setItem("cp-recipients",JSON.stringify(recipients)),[recipients]);useEffect(()=>localStorage.setItem("cp-pathways",JSON.stringify(pathways)),[pathways]);useEffect(()=>localStorage.setItem("cp-email-templates",JSON.stringify(emailTemplates)),[emailTemplates]);useEffect(()=>localStorage.setItem("cp-forms",JSON.stringify(forms)),[forms]);
useEffect(()=>{
  const pending=credentials.filter(c=>c.certificateId&&(c.emailStatus==="pending"||c.emailStatus==="sending"));
  if(!pending.length)return;
  let active=true;
  const refreshStatuses=async()=>{
    try{
      const results=await Promise.all(
        Array.from({length:Math.ceil(pending.length/500)},(_,index)=>
          api.getCertificateEmailStatuses(pending.slice(index*500,(index+1)*500).map(c=>c.certificateId))
        )
      );
      if(!active)return;
      const statuses=new Map(results.flatMap(result=>result.certificates||[]).map(c=>[c.certificateId,c]));
      setCredentials(previous=>{
        let changed=false;
        const next=previous.map(c=>{
          const current=statuses.get(c.certificateId);
          if(!current||(current.emailStatus===c.emailStatus&&current.emailSentAt===c.emailSentAt))return c;
          changed=true;
          return {...c,emailStatus:current.emailStatus,emailSentAt:current.emailSentAt};
        });
        return changed?next:previous;
      });
    }catch(error){
      console.error("Could not refresh email delivery statuses:",error);
    }
  };
  void refreshStatuses();
  const timer=setInterval(()=>void refreshStatuses(),2500);
  return()=>{active=false;clearInterval(timer);};
},[credentials]);
const createDesign=()=>{setActive(fresh());setPage("Designer")},openDesign=d=>{setActive(structuredClone(d));setPage("Designer")},saveDesign=async d=>{try{let saved={...d};if(d.backendId){const result=await api.updateTemplate(d.backendId,{title:d.name||"Untitled certificate",design:d});saved={...d,backendId:result.certificate._id};}else{const result=await api.createTemplate({title:d.name||"Untitled certificate",description:"",design:d,organization:user?.organization||""});saved={...d,backendId:result.certificate._id};}setDesigns(p=>p.some(x=>x.id===saved.id)?p.map(x=>x.id===saved.id?saved:x):[saved,...p]);setActive(null);setPage("Design Templates");}catch(error){window.alert("Could not save design: "+error.message);}};
const deleteDesign=async id=>{const design=designs.find(d=>d.id===id);try{if(design?.backendId)await api.deleteTemplate(design.backendId);setDesigns(p=>p.filter(d=>d.id!==id));}catch(error){window.alert("Could not delete design: "+error.message);}};
const addRecipient=async r=>{if(recipients.some(x=>(x.email||"").trim().toLowerCase()===(r.email||"").trim().toLowerCase())){window.alert("A recipient with this email already exists.");return;}try{const result=await api.createRecipient({name:r.name,email:r.email,organization:r.organization||""});setRecipients(p=>[{...r,backendId:result.recipient._id},...p]);}catch(error){window.alert("Could not add recipient: "+error.message);}};
const updateRecipient=async(id,changes)=>{const recipient=recipients.find(r=>r.id===id);if(!recipient)return;try{if(recipient.backendId){const result=await api.updateRecipient(recipient.backendId,changes);setRecipients(p=>p.map(r=>r.id===id?{...r,...result.recipient,id,backendId:recipient.backendId}:r));}else{window.alert("This recipient has not synced to the server yet. Please refresh and try again.");}}catch(error){window.alert("Could not update recipient: "+error.message);}};
const deleteRecipient=async id=>{const recipient=recipients.find(r=>r.id===id);if(!recipient)return;try{if(recipient.backendId)await api.deleteRecipient(recipient.backendId);setRecipients(p=>p.filter(r=>r.id!==id));}catch(error){window.alert("Could not delete recipient: "+error.message);}}
;
const downloadIssuedCertificate=async credential=>{
  try{
    const token=authStorage.getToken();
    const response=await fetch(`${API_BASE}/issued-certificates/${encodeURIComponent(credential.certificateId)}/pdf`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.message||"PDF download failed");}
    const blob=await response.blob();
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download=`VistaraCertification-${credential.certificateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){window.alert("Could not download PDF: "+error.message);}
};
const revokeIssuedCertificate=async id=>{
  const credential=credentials.find(c=>c.id===id);
  if(!credential?.certificateId){window.alert("This record is not connected to a backend-issued certificate.");return;}
  try{
    await api.revokeCertificate(credential.certificateId);
    setCredentials(previous=>previous.map(c=>c.id===id?{...c,status:"Revoked"}:c));
  }catch(error){window.alert("Could not revoke certificate: "+error.message);}
};
;
const resendIssuedCertificate=async id=>{
  const credential=credentials.find(c=>c.id===id);
  if(!credential?.certificateId) throw new Error("Certificate record not found.");
  let result;
  try {
    result=await api.resendCertificateEmail(credential.certificateId);
  } catch(error) {
    if(error.data?.emailStatus){
      setCredentials(previous=>previous.map(c=>c.id===id?{
        ...c,
        emailStatus:error.data.emailStatus
      }:c));
    }
    throw error;
  }
  if(result.emailStatus==="pending"||result.emailStatus==="sending"){
    setCredentials(previous=>previous.map(c=>c.id===id?{
      ...c,
      emailStatus:result.emailStatus
    }:c));
    window.alert(emailDeliveryMessage(result.emailStatus,credential.email,"Email resend requested"));
    return;
  }
  if(result.emailStatus!=="sent"){
    setCredentials(previous=>previous.map(c=>c.id===id?{
      ...c,
      emailStatus:result.emailStatus||"failed"
    }:c));
    throw new Error(emailDeliveryMessage(result.emailStatus,credential.email,"Email resend attempted"));
  }
  setCredentials(previous=>previous.map(c=>c.id===id?{
    ...c,
    emailStatus:result.emailStatus,
    emailSentAt:result.emailSentAt
  }:c));
  window.alert(emailDeliveryMessage(result.emailStatus,credential.email,"Email resent"));
};
if(window.location.pathname.startsWith("/verify/"))return <PublicCertificateVerification/>;
if(loading||authChecking)return <LoadingScreen/>;
if(!user)return <AuthScreen onLogin={(loggedInUser)=>{
  if(loggedInUser?.role==="admin")setUser(loggedInUser);
  else{api.logout();setUser(null);}
}}/>;
return <div className="app-shell"><Sidebar page={page} setPage={setPage} mobileOpen={mobileNavOpen} onClose={()=>setMobileNavOpen(false)}/><main className="main-area"><Suspense fallback={<LoadingScreen/>}>{page!=="Designer"&&<Topbar title={page} onCreate={()=>setModal(true)} onHelp={()=>setPage("Help Center")} onMenu={()=>setMobileNavOpen(open=>!open)} mobileNavOpen={mobileNavOpen}/>}
{page==="Dashboard"&&<Dashboard designs={designs} credentials={credentials} onDesign={createDesign} onIssue={()=>setModal(true)} setPage={setPage}/>}
{page==="Design Templates"&&<DesignTemplates designs={designs} onCreate={createDesign} onOpen={openDesign} onDelete={deleteDesign} onUseTemplate={design=>{setActive(structuredClone(design));setPage("Designer");}}/>}
{page==="Credential Templates"&&<CredentialTemplates designs={designs} onCreate={createDesign} onOpen={openDesign}/>}
{page==="All Credentials"&&<AllCredentials credentials={credentials} onCreate={()=>setModal(true)} onUpdate={async (id,changes)=>{
  const current=credentials.find(c=>c.id===id);
  if(!current)return;
  try {
    if(Object.prototype.hasOwnProperty.call(changes,"expiresAt")&&current.certificateId){
      const result=await api.setCertificateExpiry(current.certificateId,changes.expiresAt||null);
      changes={...changes,expiresAt:result.certificate?.expiresAt||""};
    }
    setCredentials(prev=>prev.map(c=>c.id===id?{...c,...changes}:c));
  } catch(error) {
    window.alert("Could not update credential: "+error.message);
  }
}} onDownload={downloadIssuedCertificate} onRevoke={revokeIssuedCertificate} onResend={resendIssuedCertificate}/>}
{page==="Recipients"&&<Recipients recipients={recipients} credentials={credentials} onAdd={addRecipient} onUpdate={updateRecipient} onDelete={deleteRecipient}/>}
{page==="Bulk Issuing"&&<BulkIssuing designs={designs} recipients={recipients} onRecipients={setRecipients} onIssue={rows=>setCredentials(p=>[...rows,...p])}/>}
{page==="Getting Started"&&<GettingStarted setPage={setPage}/>}
{page==="Integrations"&&<Integrations/>}
{page==="Forms"&&<Forms forms={forms} onSave={f=>setForms(prev=>prev.some(x=>x.id===f.id)?prev.map(x=>x.id===f.id?f:x):[f,...prev])} onDelete={id=>setForms(prev=>prev.filter(f=>f.id!==id))}/>}
{page==="Email Templates"&&<EmailTemplates templates={emailTemplates} onSave={t=>setEmailTemplates(prev=>prev.some(x=>x.id===t.id)?prev.map(x=>x.id===t.id?t:x):[t,...prev])} onDelete={id=>setEmailTemplates(prev=>prev.filter(t=>t.id!==id))}/>}
{page === "Help Center" && <HelpCenter />}
{page === "Settings" && <Settings />}
{page === "Credential Usage" && <CredentialUsage credentials={credentials} designs={designs} />}
{page==="Analytics"&&<Analytics credentials={credentials} recipients={recipients} pathways={pathways} designs={designs}/>}
{page==="Pathways"&&<Pathways pathways={pathways} designs={designs} recipients={recipients} onSave={p=>setPathways(prev=>prev.some(x=>x.id===p.id)?prev.map(x=>x.id===p.id?p:x):[p,...prev])} onDelete={id=>setPathways(prev=>prev.filter(p=>p.id!==id))}/>}
{page==="Designer"&&active&&<CertificateDesigner design={active} onSave={saveDesign} onClose={()=>{setActive(null);setPage("Design Templates")}}/>}
{!["Dashboard","Design Templates","Credential Templates","All Credentials","Recipients","Bulk Issuing","Pathways","Analytics","Email Templates","Forms","Integrations","Getting Started","Credential Usage","Settings","Help Center","Designer"].includes(page)&&<div className="page-content"><div className="empty-state"><h2>{page}</h2><p>This workspace section is ready to be connected.</p><button className="btn-primary" onClick={()=>setPage("Dashboard")}>Back to dashboard</button></div></div>}</Suspense></main>
{modal&&<IssueModal designs={designs} recipients={recipients} close={()=>setModal(false)} submit={async v=>{
  try {
    const design = designs.find(d => d.id === v.templateId);
    if (!design?.backendId) {
      throw new Error("Please select a saved design template.");
    }

    let recipient;

    if (v.recipientMode === "new") {
      const name = v.name.trim();
      const email = v.email.trim().toLowerCase();
      const organization = v.organization.trim();

      if (!name || !email) {
        throw new Error("Enter the recipient's name and email address.");
      }

      const existing = recipients.find(r =>
        (r.email || "").trim().toLowerCase() === email
      );

      if (existing) {
        if (!existing.backendId) {
          throw new Error("This email already exists locally. Refresh the page and try again.");
        }
        recipient = existing;
      } else {
        const result = await api.createRecipient({ name, email, organization });
        const saved = result.recipient;
        recipient = {
          ...saved,
          id: saved._id,
          backendId: saved._id
        };
        setRecipients(previous => [recipient, ...previous]);
      }
    } else {
      recipient = recipients.find(r => r.id === v.recipientId);
    }

    if (!recipient?.backendId) {
      throw new Error("Please select a recipient synced with the server.");
    }

    const result = await api.issueCertificate(
      design.backendId,
      recipient.backendId,
      { title: v.title.trim() || design.name || "Certificate" }
    );

    const issued = result.certificate;
    setCredentials(previous => [{
      id: issued.id || issued._id || uid(),
      backendId: issued.id || issued._id,
      certificateId: issued.certificateId,
      recipient: recipient.name,
      email: recipient.email,
      title: v.title.trim() || design.name || "Certificate",
      templateId: design.id,
      recipientId: recipient.id,
      status: issued.status || "valid",
      issuedAt: issued.issuedAt || new Date().toISOString(),
      verificationUrl: issued.verificationUrl,
      qrCode: issued.qrCode,
      emailStatus: issued.emailStatus || "not_configured",
      emailSentAt: issued.emailSentAt
    }, ...previous]);

    setModal(false);
    setPage("All Credentials");
    window.alert(emailDeliveryMessage(issued.emailStatus, recipient.email));
  } catch(error) {
    window.alert("Could not issue certificate: " + error.message);
  }
}}/>}</div>}

function IssueModal({designs,recipients,close,submit}) {
  const [f,S] = useState({
    recipientMode: recipients.length ? "existing" : "new",
    recipientId: "",
    templateId: "",
    name: "",
    email: "",
    organization: "",
    title: ""
  });
  const [saving,setSaving] = useState(false);
  const selectedRecipient = recipients.find(r => r.id === f.recipientId);
  const selectedDesign = designs.find(d => d.id === f.templateId);

  return <div className="modal-backdrop">
    <form className="modal-card" onSubmit={async e=>{
      e.preventDefault();
      if (!selectedDesign) return;
      if (f.recipientMode === "existing" && !selectedRecipient) return;

      setSaving(true);
      try {
        await submit(f);
      } finally {
        setSaving(false);
      }
    }}>
      <div className="modal-head">
        <div>
          <small className="eyebrow">NEW CREDENTIAL</small>
          <h2>Issue credential</h2>
        </div>
        <button type="button" className="icon-btn" onClick={close}>×</button>
      </div>

      <label>Recipient</label>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button
          type="button"
          className={f.recipientMode === "existing" ? "btn-primary" : "btn-secondary"}
          onClick={()=>S({...f,recipientMode:"existing"})}
          disabled={!recipients.length}
        >
          Existing recipient
        </button>
        <button
          type="button"
          className={f.recipientMode === "new" ? "btn-primary" : "btn-secondary"}
          onClick={()=>S({...f,recipientMode:"new"})}
        >
          + New recipient
        </button>
      </div>

      {f.recipientMode === "existing" ? <>
        <label>
          Select recipient
          <select
            required
            value={f.recipientId}
            onChange={e=>S({...f,recipientId:e.target.value})}
          >
            <option value="">Select a saved recipient</option>
            {recipients.map(r=>
              <option value={r.id} key={r.id}>{r.name} ({r.email})</option>
            )}
          </select>
        </label>
        {selectedRecipient &&
          <p className="modal-hint">Recipient: {selectedRecipient.name} · {selectedRecipient.email}</p>
        }
        {!recipients.length &&
          <p className="modal-hint">No saved recipients. Choose New recipient to enter their details.</p>
        }
      </> : <>
        <label>
          Full name
          <input
            required
            value={f.name}
            onChange={e=>S({...f,name:e.target.value})}
            placeholder="Enter recipient's full name"
          />
        </label>
        <label>
          Email address
          <input
            required
            type="email"
            value={f.email}
            onChange={e=>S({...f,email:e.target.value})}
            placeholder="name@example.com"
          />
        </label>
        <label>
          Organization (optional)
          <input
            value={f.organization}
            onChange={e=>S({...f,organization:e.target.value})}
            placeholder="Enter organization"
          />
        </label>
        <p className="modal-hint">The new recipient will be saved to your Recipients list before the certificate is issued.</p>
      </>}

      <label>
        Design template
        <select
          required
          value={f.templateId}
          onChange={e=>S({...f,templateId:e.target.value})}
        >
          <option value="">Select a saved design</option>
          {designs.map(d=>
            <option value={d.id} key={d.id}>{d.name || "Untitled certificate"}</option>
          )}
        </select>
      </label>

      {selectedDesign &&
        <p className="modal-hint">Design: {selectedDesign.name || "Untitled certificate"}</p>
      }

      <label>
        Credential title
        <input
          value={f.title}
          onChange={e=>S({...f,title:e.target.value})}
          placeholder={selectedDesign?.name || "Enter credential title"}
        />
      </label>
      {!designs.length &&
        <p className="modal-hint">You need at least one saved design before issuing.</p>
      }

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={close}>Cancel</button>
        <button
          className="btn-primary"
          disabled={saving || !designs.length || (f.recipientMode === "existing" && !recipients.length)}
        >
          {saving ? "Issuing..." : "Issue certificate"}
        </button>
      </div>
    </form>
  </div>;
}
