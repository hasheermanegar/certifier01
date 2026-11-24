import {useEffect,useRef,useState} from "react";
import {Rnd} from "react-rnd";
import {QRCodeSVG} from "qrcode.react";
import {Eye, icons, Image as ImageIcon, Printer, QrCode, Shapes, SlidersHorizontal, Trash2, Type, X} from "lucide-react";
import ToolRail from "./ToolRail";
import TemplatesPanel from "./TemplatesPanel";
import ElementsPanel from "./ElementsPanel";
import AttributesPanel from "./AttributesPanel";
import TextPanel from "./TextPanel";
import UploadsPanel from "./UploadsPanel";
import QRCodesPanel from "./QRCodesPanel";
import LayersPanel from "./LayersPanel";

const id=()=>crypto.randomUUID();

function templateElements(p, portrait) {
  const w=portrait?790:1120, h=portrait?1120:790;
  const cx=w/2;
  const titleY=portrait?220:155;
  return [
    {id:id(),type:"text",text:p.title,x:80,y:titleY,width:w-160,height:75,fontSize:portrait?27:34,color:p.accent,bold:true,align:"center"},
    {id:id(),type:"text",text:p.subtitle,x:100,y:titleY+95,width:w-200,height:45,fontSize:19,color:"#64748b",align:"center"},
    {id:id(),type:"attribute",text:"{{recipient_name}}",x:100,y:titleY+175,width:w-200,height:85,fontSize:portrait?34:42,color:p.accent,bold:true,align:"center"},
    {id:id(),type:"text",text:"For successfully completing the programme",x:110,y:titleY+290,width:w-220,height:45,fontSize:17,color:"#475569",align:"center"},
    {id:id(),type:"attribute",text:"{{issue_date}}",x:cx-160,y:h-145,width:320,height:35,fontSize:15,color:"#64748b",align:"center"},
    {id:id(),type:"text",text:"AUTHORISED SIGNATURE",x:cx-120,y:h-85,width:240,height:30,fontSize:12,color:"#64748b",align:"center"}
  ];
}

function ShapeElement({ element: e }) {
  const stroke = e.stroke || "#1A4D2E";
  const lineWidth = Math.max(1, e.strokeWidth || 3);
  const Icon = e.iconName && icons[e.iconName];

  if (Icon) {
    return <Icon className="cp-canvas-element-icon cp-canvas-outline-icon" width="100%" height="100%" color={stroke} strokeWidth={lineWidth} fill="none" style={{ opacity: e.opacity ?? 1 }} />;
  }

  if (e.shape === "hline") {
    return <svg className="cp-canvas-element-icon" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", opacity: e.opacity ?? 1 }}><path d="M 0 50 H 100" fill="none" stroke={stroke} strokeWidth={lineWidth} /></svg>;
  }
  if (e.shape === "vline") {
    return <svg className="cp-canvas-element-icon" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", opacity: e.opacity ?? 1 }}><path d="M 50 0 V 100" fill="none" stroke={stroke} strokeWidth={lineWidth} /></svg>;
  }
  if (e.shape === "dashed") {
    return <svg className="cp-canvas-element-icon" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", opacity: e.opacity ?? 1 }}><path d="M 0 50 H 100" fill="none" stroke={stroke} strokeWidth={lineWidth} strokeDasharray="8 6" /></svg>;
  }

  const fill = e.fill && e.fill !== "transparent" ? e.fill : "none";
  const common = { fill, stroke, strokeWidth: lineWidth, opacity: e.opacity ?? 1 };
  const starPoints = "50,3 61,36 96,36 68,57 79,91 50,71 21,91 32,57 4,36 39,36";
  const burstPoints = "50,2 61,28 84,12 77,39 98,50 77,61 84,88 61,72 50,98 39,72 16,88 23,61 2,50 23,39 16,12 39,28";

  return (
    <svg className="cp-canvas-element-icon" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      {e.shape === "circle" ? <circle {...common} cx="50" cy="50" r="46" /> :
        e.shape === "oval" ? <ellipse {...common} cx="50" cy="50" rx="47" ry="43" /> :
          e.shape === "rounded" ? <rect {...common} x="3" y="3" width="94" height="94" rx="14" /> :
            e.shape === "pill" ? <rect {...common} x="3" y="20" width="94" height="60" rx="30" /> :
              e.shape === "triangle" ? <polygon {...common} points="50,4 97,96 3,96" /> :
                e.shape === "star" ? <polygon {...common} points={starPoints} /> :
                  e.shape === "diamond" ? <polygon {...common} points="50,3 97,50 50,97 3,50" /> :
                    e.shape === "hexagon" ? <polygon {...common} points="25,3 75,3 97,50 75,97 25,97 3,50" /> :
                      e.shape === "pentagon" ? <polygon {...common} points="50,3 97,38 80,97 20,97 3,38" /> :
                        e.shape === "heart" ? <path {...common} d="M50 94 8 49C-7 29 8 5 29 5c10 0 17 5 21 14C54 10 61 5 71 5c21 0 36 24 21 44Z" /> :
                          e.shape === "burst" ? <polygon {...common} points={burstPoints} /> :
                            e.shape === "border" ? <><rect {...common} x="3" y="3" width="94" height="94" fill="none" strokeWidth={lineWidth * 2} /><rect {...common} x="10" y="10" width="80" height="80" fill="none" /></> :
                              e.shape === "corner" ? <path {...common} d="M4 96V4h92M14 96V14h82" fill="none" strokeWidth={lineWidth * 2} /> :
                                <rect {...common} x="3" y="3" width="94" height="94" />}
    </svg>
  );
}

export default function CertificateDesigner({design:initial,onSave,onClose}) {
  const [d,D]=useState(()=>({...initial,elements:initial.elements||[]}));  const designRef=useRef(d);
  const undoStack=useRef([]);
  const redoStack=useRef([]);
  const [historyCounts,setHistoryCounts]=useState({undo:0,redo:0});

  const updateDesign=updater=>{
    const previous=designRef.current;
    const next=typeof updater==="function"?updater(previous):updater;
    if(next===previous)return;
    undoStack.current.push(previous);
    if(undoStack.current.length>50)undoStack.current.shift();
    redoStack.current=[];
    designRef.current=next;
    D(next);
    setHistoryCounts({undo:undoStack.current.length,redo:0});
  };

  const undo=()=>{
    if(!undoStack.current.length)return;
    const previous=undoStack.current.pop();
    redoStack.current.push(designRef.current);
    designRef.current=previous;
    D(previous);
    setBackgroundImage(previous.backgroundImage || "");
    setHistoryCounts({undo:undoStack.current.length,redo:redoStack.current.length});
  };

  const redo=()=>{
    if(!redoStack.current.length)return;
    const next=redoStack.current.pop();
    undoStack.current.push(designRef.current);
    designRef.current=next;
    D(next);
    setBackgroundImage(next.backgroundImage || "");
    setHistoryCounts({undo:undoStack.current.length,redo:redoStack.current.length});
  };

  const [tool,T]=useState("Templates");
  const [mobilePanel,setMobilePanel]=useState("");
  const [selected,S]=useState(null);
  const selectedRef=useRef(selected);
  useEffect(()=>{selectedRef.current=selected;},[selected]);
  const [uploads,U]=useState([]);
  const [backgroundImage,setBackgroundImage]=useState(initial.backgroundImage || "");
  const backgroundInput=useRef(null);
  const [msg,M]=useState("");
  const [previewImage,setPreviewImage]=useState("");
  const [isPreviewing,setIsPreviewing]=useState(false);
  const recipientElement=d.elements.find(e=>e.type==="attribute"&&String(e.text||"").includes("{{recipient_name}}"));
  const credentialElement=d.elements.find(e=>e.type==="attribute"&&(
    String(e.text||"").includes("{{credential_id}}")||
    String(e.text||"").includes("{{certificate_uuid}}")
  ));
  const initialRecipient=recipientElement&&!recipientElement.text.includes("{{")
    ?recipientElement.text
    :"Recipient Name";
  const initialCredentialId=credentialElement&&!credentialElement.text.includes("{{")
    ?credentialElement.text
    :"Certificate UUID";
  const [previewRecipient,setPreviewRecipient]=useState(initialRecipient);
  const [previewCredentialId,setPreviewCredentialId]=useState(initialCredentialId);
  const [previewScale,setPreviewScale]=useState(.65);
  const previewStageRef=useRef(null);
  const previewButtonRef=useRef(null);
  const previewCloseRef=useRef(null);
  const previewDialogRef=useRef(null);
  const [zoom,Z]=useState(100);
  const [workspaceSize,WS]=useState({width:800,height:600});
  const workspaceRef=useRef(null);
  const canvas=useRef(null);
  useEffect(()=>{
    const el=workspaceRef.current;
    if(!el)return;
    const observer=new ResizeObserver(entries=>{
      const rect=entries[0].contentRect;
      WS({width:rect.width,height:rect.height});
    });
    observer.observe(el);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!previewImage)return undefined;
    const previewTrigger=previewButtonRef.current;
    previewCloseRef.current?.focus();
    const stage=previewStageRef.current;
    const updatePreviewScale=()=>{
      if(!stage)return;
      const rect=stage.getBoundingClientRect();
      setPreviewScale(Math.max(.05,Math.min((rect.width-56)/d.width,(rect.height-56)/d.height)));
    };
    updatePreviewScale();
    const observer=new ResizeObserver(updatePreviewScale);
    if(stage)observer.observe(stage);
    const handlePreviewKeyDown=event=>{
      if(event.key==="Escape"){
        setPreviewImage("");
        return;
      }
      if(event.key==="Tab"){
        const buttons=previewDialogRef.current?.querySelectorAll("button:not(:disabled)");
        if(!buttons?.length)return;
        const first=buttons[0];
        const last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){
          event.preventDefault();
          last.focus();
        }else if(!event.shiftKey&&document.activeElement===last){
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown",handlePreviewKeyDown);
    return ()=>{
      window.removeEventListener("keydown",handlePreviewKeyDown);
      observer.disconnect();
      if(previewTrigger?.isConnected)previewTrigger.focus();
    };
  },[previewImage,d.width,d.height]);

;

  const cur=d.elements.find(e=>e.id===selected);
  const patch=(i,v)=>updateDesign(x=>({...x,elements:x.elements.map(e=>e.id===i?{...e,...v}:e)}));
  const add=(type,text,extra={})=>{
    const qr=type==="qr";
    const image=type==="image";
    const width=Math.min(d.width*0.8,qr?140:image?260:Math.min(500,d.width*0.8));
    const height=qr?width:image?160:60;
    const e={
      id:id(),
      type,
      text,
      x:Math.max(0,(d.width-width)/2),
      y:Math.max(0,(d.height-height)/2),
      width,
      height,
      fontSize:24,
      color:"#26334d",
      align:"center",
      ...extra
    };
    updateDesign(x=>({...x,elements:[...x.elements,e]}));
    S(e.id);
  };
  const del=i=>{updateDesign(x=>({...x,elements:x.elements.filter(e=>e.id!==i)}));S(null)};

  const clipboardRef=useRef(null);
  const keyboardActionsRef=useRef({});
  const pasteCount=useRef(0);

  const copyElement=()=>{
    const element=d.elements.find(e=>e.id===selected);
    if(!element)return;
    clipboardRef.current=structuredClone(element);
    pasteCount.current=0;
    M("Element copied");
    setTimeout(()=>M(""),1200);
  };

  const pasteElement=()=>{
    if(!clipboardRef.current)return;
    const source=structuredClone(clipboardRef.current);
    const offset=30+(pasteCount.current*12);
    pasteCount.current++;
    const copy={...source,id:id(),x:(source.x||0)+offset,y:(source.y||0)+offset};
    updateDesign(x=>({...x,elements:[...x.elements,copy]}));
    S(copy.id);
  };

  const duplicateElement=()=>{
    const element=d.elements.find(e=>e.id===selected);
    if(!element)return;
    const copy={...structuredClone(element),id:id(),x:(element.x||0)+30,y:(element.y||0)+30};
    updateDesign(x=>({...x,elements:[...x.elements,copy]}));
    clipboardRef.current=structuredClone(element);
    S(copy.id);
  };

  useEffect(()=>{keyboardActionsRef.current={copyElement,pasteElement,duplicateElement,del};});

  useEffect(()=>{
    const handler=e=>{
      if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      if(!(e.metaKey||e.ctrlKey))return;
      const key=e.key.toLowerCase();
      const actions=keyboardActionsRef.current;
      if(key==="c"){
        if(!selectedRef.current)return;
        e.preventDefault();
        actions.copyElement();
      }else if(key==="v"){
        e.preventDefault();
        actions.pasteElement();
      }else if(key==="d"){
        if(!selectedRef.current)return;
        e.preventDefault();
        actions.duplicateElement();
      }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);



  useEffect(()=>{
    const handler=e=>{
      if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      if(!(e.metaKey||e.ctrlKey))return;
      if(e.key.toLowerCase()==="z"){
        e.preventDefault();
        e.shiftKey?redo():undo();
      }else if(e.key.toLowerCase()==="y"&&e.ctrlKey){
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  // Delete the selected canvas element using the keyboard.
  useEffect(()=>{
    const handleKeyDown=e=>{
      if(e.key!=="Delete" && e.key!=="Backspace")return;

      const target=e.target;
      if(target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      const currentSelected=selectedRef.current;
      if(!currentSelected || !designRef.current.elements.some(element=>element.id===currentSelected))return;

      e.preventDefault();
      keyboardActionsRef.current.del(currentSelected);
    };

    window.addEventListener("keydown",handleKeyDown);
    return ()=>window.removeEventListener("keydown",handleKeyDown);
  },[]);
  const move=(i,delta)=>updateDesign(x=>{
    const a=[...x.elements],n=a.findIndex(e=>e.id===i),j=Math.max(0,Math.min(a.length-1,n+delta));
    if(n<0)return x;const [v]=a.splice(n,1);a.splice(j,0,v);return{...x,elements:a};
  });
  const upload=async f=>{
    if(!f)return;
    if(!f.type.startsWith("image/")){M("Please choose an image file");return}
    if(f.size>8*1024*1024){M("Image must be under 8 MB");return}
    try {
      const src=await new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=j;fr.readAsDataURL(f)});
      const asset={id:id(),name:f.name||"Uploaded image",src};
      U(x=>[asset,...x]);
      add("image",asset.name,{src,width:260,height:160});
    }catch(error){
      console.error("Could not read uploaded image:",error);
      M("Could not read uploaded image");
    }
  };
  const useUploadedImage=asset=>add("image",asset.name||"Image",{src:asset.src,width:260,height:160});
  const uploadBackground = async file => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      M("Use a PNG, JPG or WebP image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      M("Background image must be under 8 MB");
      return;
    }
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      updateDesign(x=>({...x,backgroundImage:dataUrl}));
      setBackgroundImage(dataUrl);
      M("Background image uploaded");
    } catch {
      M("Could not read the background image");
    }
    setTimeout(() => M(""), 2200);
  };

  const change=v=>{
    if(v==="landscape"||v==="portrait"){
      updateDesign(x=>{
        const newW=v==="landscape"?1120:790;
        const newH=v==="landscape"?790:1120;
        const oldW=x.width||1120;
        const oldH=x.height||790;

        if(x.orientation===v && oldW===newW && oldH===newH)return x;

        const sx=newW/oldW;
        const sy=newH/oldH;

        return {
          ...x,
          orientation:v,
          width:newW,
          height:newH,
          elements:x.elements.map(e=>({
            ...e,
            x:Math.round((e.x||0)*sx),
            y:Math.round((e.y||0)*sy),
            width:Math.max(1,Math.round((e.width||1)*sx)),
            height:Math.max(1,Math.round((e.height||1)*sy))
          }))
        };
      });
    }else{
      updateDesign(x=>({...x,background:v}));
    }
  };
  const applyPageSize = preset => {
    const sizes = {
      A4: { landscape: [1123, 794], portrait: [794, 1123] },
      "US Letter": { landscape: [1056, 816], portrait: [816, 1056] }
    };
    if (preset === "Custom") {
      updateDesign(x => ({ ...x, pageSize: "Custom" }));
      return;
    }
    const orientation = d.orientation === "portrait" ? "portrait" : "landscape";
    const [newW, newH] = sizes[preset][orientation];
    updateDesign(x => {
      const oldW = x.width || newW;
      const oldH = x.height || newH;
      const sx = newW / oldW;
      const sy = newH / oldH;
      return {
        ...x,
        pageSize: preset,
        width: newW,
        height: newH,
        elements: x.elements.map(e => ({
          ...e,
          x: Math.round((e.x || 0) * sx),
          y: Math.round((e.y || 0) * sy),
          width: Math.max(1, Math.round((e.width || 1) * sx)),
          height: Math.max(1, Math.round((e.height || 1) * sy))
        }))
      };
    });
  };

  const applyTemplate=(p,orientation)=>{
    const selectedOrientation=p.orientation || orientation || "landscape";
    const portrait=selectedOrientation==="portrait";
    setBackgroundImage(p.backgroundImage || "");
    updateDesign(x=>({...x,name:p.name || x.name,orientation:selectedOrientation,width:p.width || (portrait?790:1120),height:p.height || (portrait?1120:790),background:p.background || p.bg || "#ffffff",backgroundImage:p.backgroundImage || "",elements:Array.isArray(p.elements)&&p.elements.length>0?p.elements:templateElements(p,portrait)}));
    S(null);M((p.name || "Certificate")+" template applied");setTimeout(()=>M(""),1800);
  };

  const getPreviewText=text=>{
    const values={
      "{{recipient_name}}":previewRecipient,
      "{{recipient_email}}":previewRecipient==="Recipient Name"?"recipient@example.com":`${previewRecipient.toLowerCase().replace(/[^a-z0-9]+/g,".")}@example.com`,
      "{{credential_title}}":d.name||"Untitled certificate",
      "{{credential_id}}":previewCredentialId,
      "{{certificate_uuid}}":previewCredentialId,
      "{{issue_date}}":new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric"}).format(new Date()),
      "{{expiry_date}}":"December 31, 2027",
      "{{issuer_name}}":"Your Organisation"
    };
    return Object.entries(values).reduce(
      (result,[placeholder,value])=>result.split(placeholder).join(value),
      text||""
    );
  };

  const previewCertificate=async()=>{
    if(isPreviewing)return;
    const recipientPlaceholder=d.elements.find(e=>String(e.text||"").includes("{{recipient_name}}"));
    const credentialPlaceholder=d.elements.find(e=>(
      String(e.text||"").includes("{{credential_id}}")||
      String(e.text||"").includes("{{certificate_uuid}}")
    ));
    const staticRecipient=d.elements.find(e=>(
      e.type==="attribute" &&
      String(e.text||"").trim() &&
      !String(e.text||"").includes("{{")
    ));
    if(recipientPlaceholder){
      setPreviewRecipient(staticRecipient?.text||"Recipient Name");
    }
    if(credentialPlaceholder&&!credentialPlaceholder.text.includes("{{")){
      setPreviewCredentialId(credentialPlaceholder.text);
    }else if(credentialPlaceholder){
      setPreviewCredentialId("Certificate UUID");
    }
    setIsPreviewing(true);
    setPreviewImage("live");
    M("");
    setIsPreviewing(false);
  };

  const updateLivePreviewField=(field,value)=>{
    if(field==="recipient")setPreviewRecipient(value);
    if(field==="credentialId")setPreviewCredentialId(value);
  };

  const exportPDF=async()=>{
    try{
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      M("Preparing PDF…");
      const c=await html2canvas(canvas.current,{scale:2,backgroundColor:null});
      const pdf=new jsPDF({orientation:d.orientation,unit:"px",format:[d.width,d.height]});
      pdf.addImage(c.toDataURL("image/png"),"PNG",0,0,d.width,d.height);
      pdf.save((d.name||"certificate")+".pdf");M("PDF exported");
    }catch(e){console.error(e);M("PDF export failed")}
    setTimeout(()=>M(""),2500);
  };
  const panel=tool==="Templates"
    ?<TemplatesPanel design={d} backgroundImage={backgroundImage} onChange={change} onApply={applyTemplate}/>
    :tool==="Attributes"?<AttributesPanel onAdd={v=>add("attribute",v)}/>
    :tool==="Text"?<TextPanel onAdd={(v,style)=>add("text",v,style||{})}/>
    :tool==="Uploads"?<UploadsPanel onUpload={upload} onUse={useUploadedImage} onRemove={assetId=>U(items=>items.filter(item=>item.id!==assetId))} images={uploads}/>
    :tool==="QR Codes"?<QRCodesPanel onAdd={(v,extra)=>add("qr",v,extra||{})}/>
    :tool==="Layers"?<LayersPanel
      elements={d.elements}
      selected={selected}
      onSelect={S}
      onDelete={del}
      onMove={move}
      onVisibilityChange={(i,visible)=>patch(i,{hidden:!visible})}
      onLockChange={(i,locked)=>patch(i,{locked})}
      background={d.background}
      backgroundImage={backgroundImage}
    />
    :<ElementsPanel onAdd={add}/>;

  const fitScale=Math.max(0.01,Math.min((workspaceSize.width-60)/d.width,(workspaceSize.height-60)/d.height));
  const scale=Math.max(0.01,fitScale*(zoom/100));

  return <div className="designer-page cp-designer" data-orientation={d.orientation}>
    <header className="cp-designer-top">
      <div className="cp-top-left">
        <button className="cp-back" onClick={onClose}>← <span>Back</span></button>
        <span className="cp-breadcrumb">/</span>
        <div className="cp-design-heading"><b>{d.name||"Untitled certificate"}</b><small>Certificate designer</small></div>
      </div>
      <div className="cp-top-actions">
        <button className="cp-top-button" title="Undo (Cmd/Ctrl+Z)" disabled={!historyCounts.undo} onClick={undo}>↶</button>
        <button className="cp-top-button" title="Redo (Cmd/Ctrl+Shift+Z)" disabled={!historyCounts.redo} onClick={redo}>↷</button>
        <button className="cp-top-button" onClick={()=>Z(Math.max(25,zoom-10))}>−</button>
        <span className="cp-zoom-label">{zoom}%</span>
        <button className="cp-top-button" onClick={()=>Z(Math.min(150,zoom+10))}>＋</button>
        <button className="cp-top-button" onClick={()=>Z(100)}>Fit</button>
        <button
          ref={previewButtonRef}
          type="button"
          className="cp-top-button cp-preview-button"
          onClick={previewCertificate}
          disabled={isPreviewing}
          aria-busy={isPreviewing}
          title="Preview certificate"
        >
          {isPreviewing ? <span className="cp-preview-spinner" aria-hidden="true"/> : <Eye size={14}/>}
          {isPreviewing ? "Preparing…" : "Preview"}
        </button>
        <button className="btn-secondary" onClick={exportPDF}>↓ Export PDF</button>
        <button className="btn-primary" onClick={()=>{onSave({...d,backgroundImage});M("Design saved");setTimeout(()=>M(""),1800)}}>Save design</button>
      </div>
    </header>

    <div className={`cp-editor-body ${mobilePanel==="properties"?"":"cp-properties-collapsed"}`}>
      <ToolRail active={tool} onSelect={nextTool=>{T(nextTool);S(null);setMobilePanel("tools")}}/>
      <aside id="certificate-tools" className={`cp-editor-panel ${mobilePanel==="tools"?"cp-mobile-open":""}`}>{panel}</aside>
      {mobilePanel && <button type="button" className="cp-mobile-drawer-backdrop" aria-label="Close panel" onClick={()=>setMobilePanel("")}/>}
      <main className="cp-workspace">
        <div className="cp-workspace-toolbar">
          <div><span className="cp-live-dot"/> <b>{d.name||"Untitled certificate"}</b><span className="cp-toolbar-separator">|</span><span>{d.orientation==="portrait"?"Portrait":"Landscape"} · {d.width} × {d.height}</span></div>
          <div className="cp-workspace-toolbar-actions">
            <button type="button" className="cp-mobile-panel-toggle" aria-expanded={mobilePanel==="tools"} aria-controls="certificate-tools" onClick={()=>setMobilePanel(v=>v==="tools"?"":"tools")}>Tools</button>
            <button type="button" className="cp-mobile-panel-toggle cp-mobile-property-toggle" aria-expanded={mobilePanel==="properties"} aria-controls="certificate-properties" onClick={()=>setMobilePanel(v=>v==="properties"?"":"properties")}>Properties</button>
            <button onClick={()=>change("landscape")} className={d.orientation==="landscape"?"chosen":""}>Landscape</button>
            <button onClick={()=>change("portrait")} className={d.orientation==="portrait"?"chosen":""}>Portrait</button>
          </div>
        </div>
        <div className="cp-canvas-workarea">

          {cur && (cur.type==="text" || cur.type==="attribute") && (
            <div className="cp-inline-toolbar" onMouseDown={e=>e.stopPropagation()}>
              <select aria-label="Font family" value={cur.fontFamily||"Inter"} onChange={e=>patch(cur.id,{fontFamily:e.target.value})}>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
              </select>
              <input aria-label="Font size" type="number" min="6" max="150" value={cur.fontSize||24} onChange={e=>patch(cur.id,{fontSize:Math.max(6,Math.min(150,+e.target.value||6))})}/>
              <input aria-label="Text color" type="color" value={cur.color||"#26334d"} onChange={e=>patch(cur.id,{color:e.target.value})}/>
              <button type="button" className={cur.bold?"active":""} title="Bold" onClick={()=>patch(cur.id,{bold:!cur.bold})}><b>B</b></button>
              <button type="button" className={cur.italic?"active":""} title="Italic" onClick={()=>patch(cur.id,{italic:!cur.italic})}><i>I</i></button>
              <button type="button" className={cur.underline?"active":""} title="Underline" onClick={()=>patch(cur.id,{underline:!cur.underline})}><u>U</u></button>
              <select aria-label="Text alignment" value={cur.align||"center"} onChange={e=>patch(cur.id,{align:e.target.value})}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          )}
          <div className="cp-canvas-caption"><span>Page 1</span><span>Click an element to edit it · Drag to reposition</span></div>
          <div className="cp-canvas-scroll" ref={workspaceRef} onMouseDown={e=>{if(!e.target.closest(".react-rnd"))S(null)}}>
            <div className="cp-canvas-frame" style={{width:d.width*scale,height:d.height*scale}}>
              <div ref={canvas} className="certificate-canvas cp-certificate-canvas" style={{width:d.width,height:d.height,background:d.background,backgroundImage:backgroundImage?`url("${backgroundImage}")`:undefined,backgroundSize:"100% 100%",backgroundPosition:"center",backgroundRepeat:"no-repeat",transform:"scale("+scale+")",transformOrigin:"top left"}}>
                {d.elements.filter(e=>!e.hidden).map(e=><Rnd key={e.id} bounds="parent" scale={scale} enableResizing={selected===e.id && !e.locked ? {
      top:true,
      right:true,
      bottom:true,
      left:true,
      topRight:true,
      bottomRight:true,
      bottomLeft:true,
      topLeft:true
    } : false}
    resizeHandleStyles={{
      top:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",top:0,left:"50%",marginLeft:-5},
      right:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",right:0,top:"50%",marginTop:-5},
      bottom:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",bottom:0,left:"50%",marginLeft:-5},
      left:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",left:0,top:"50%",marginTop:-5},
      topRight:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",right:0,top:0},
      bottomRight:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",right:0,bottom:0},
      bottomLeft:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",left:0,bottom:0},
      topLeft:{width:10,height:10,background:"#ffffff",border:"2px solid #1A4D2E",borderRadius:"50%",left:0,top:0}
    }}
    resizeHandleClasses={{
      top:"cp-resize-handle",
      right:"cp-resize-handle",
      bottom:"cp-resize-handle",
      left:"cp-resize-handle",
      topRight:"cp-resize-handle",
      bottomRight:"cp-resize-handle",
      bottomLeft:"cp-resize-handle",
      topLeft:"cp-resize-handle"
    }} disableDragging={!!e.locked} size={{width:e.width,height:e.height}} position={{x:e.x,y:e.y}} onDragStop={(ev,p)=>{const moved=Math.abs(p.x-e.x)+Math.abs(p.y-e.y);if(moved>4)patch(e.id,{x:p.x,y:p.y});}} onResizeStop={(ev,dir,ref,delta,p)=>patch(e.id,{width:parseInt(ref.style.width),height:parseInt(ref.style.height),x:p.x,y:p.y})} onMouseDown={()=>S(e.id)} style={{border:selected===e.id?"1px dashed #1A4D2E":"1px solid transparent",zIndex:selected===e.id?3:1}}>
                  <div
                    onClick={()=>S(e.id)}
                    data-certificate-text={e.text||""}
                    style={{height:"100%",width:"100%",display:"flex",alignItems:"center",justifyContent:e.align==="left"?"flex-start":e.align==="right"?"flex-end":"center",fontSize:e.fontSize,fontFamily:e.fontFamily||"Inter",fontWeight:e.bold?700:400,fontStyle:e.italic?"italic":"normal",textDecoration:e.underline?"underline":"none",letterSpacing:(e.letterSpacing||0)+"px",lineHeight:e.lineHeight||1.2,textTransform:e.textTransform||"none",color:e.color,textAlign:e.align,overflow:"hidden",whiteSpace:"pre-wrap",padding:3}}
                  >
                    {e.type==="qr"?<QRCodeSVG value={e.qrMode==="automatic"?`https://certifypro.in/verify/${encodeURIComponent(previewCredentialId||"PREVIEW-CREDENTIAL")}`:(e.text||"https://example.com")} size={Math.max(40,Math.min(e.width,e.height)-5)}/>:e.type==="image"?<img src={e.src} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:e.type==="shape"?<ShapeElement element={e}/>:e.text}
                  </div>
                </Rnd>)}
              </div>
            </div>
          </div>
          <div className="cp-canvas-footer"><span>VistaraCertification Studio</span><span>{d.elements.length} elements · {d.width} × {d.height}px</span></div>
        </div>
      </main>
      <aside id="certificate-properties" className={`cp-properties cp-properties-v2 ${mobilePanel==="properties"?"cp-mobile-open":""}`}>
        <div className="cp-properties-heading cp-props-header">
          <span className="cp-props-header-icon"><SlidersHorizontal size={18}/></span>
          <div>
            <span className="cp-kicker">DESIGN INSPECTOR</span>
            <h2>Properties</h2>
            <p>{cur ? "Edit and customise your selected element." : "Configure your certificate design."}</p>
          </div>
          <span className="cp-props-status">{cur ? "OBJECT" : "CANVAS"}</span>
        </div>

        {cur ? <>
          <section className="cp-props-section">
            <div className="cp-props-section-title">
              <strong>Selected element</strong>
              <span>{cur.type || "Element"}</span>
            </div>
            <div className="cp-props-selected">
              <div className="cp-props-selected-icon">
                {cur.type === "qr" ? <QrCode size={19}/> : cur.type === "image" ? <ImageIcon size={19}/> : cur.type === "shape" ? <Shapes size={19}/> : <Type size={19}/>}
              </div>
              <div className="cp-props-selected-info">
                <strong>{cur.type === "qr" ? "QR code" : cur.type === "image" ? "Image" : cur.type === "shape" ? "Shape" : "Text element"}</strong>
                <small>{cur.qrMode === "automatic" ? "Automatic verification QR" : (cur.text || cur.shape || "Selected element").toString().slice(0, 35)}</small>
              </div>
            </div>
          </section>

          <section className="cp-props-section">
            <div className="cp-props-section-title"><strong>Position & size</strong></div>
            <div className="cp-props-grid">
              <label>X position<input type="number" value={Math.round(cur.x || 0)} onChange={e=>patch(cur.id,{x:+e.target.value})}/></label>
              <label>Y position<input type="number" value={Math.round(cur.y || 0)} onChange={e=>patch(cur.id,{y:+e.target.value})}/></label>
              <label>Width<input type="number" min="1" value={Math.round(cur.width || 0)} onChange={e=>patch(cur.id,{width:Math.max(1,+e.target.value)})}/></label>
              <label>Height<input type="number" min="1" value={Math.round(cur.height || 0)} onChange={e=>patch(cur.id,{height:Math.max(1,+e.target.value)})}/></label>
            </div>
          </section>

          {cur.type === "qr" ? (
            <section className="cp-props-section">
              <div className="cp-props-section-title"><strong>QR code settings</strong></div>
              <div className="cp-props-info">
                <strong>{cur.qrMode === "automatic" ? "Automatic verification" : "Custom QR code"}</strong>
                <p>{cur.qrMode === "automatic" ? "A unique verification QR will be generated for each issued credential when the backend is connected." : "This QR code points to the URL entered below."}</p>
              </div>
              {cur.qrMode !== "automatic" && <label className="cp-props-field">Destination URL
                <textarea rows="3" value={cur.text || ""} onChange={e=>patch(cur.id,{text:e.target.value})}/>
              </label>}
            </section>
          ) : null}

          {cur.type === "image" ? (
            <section className="cp-props-section">
              <div className="cp-props-section-title"><strong>Image appearance</strong></div>
              <label className="cp-props-field">Opacity
                <input type="range" min="0" max="1" step="0.05" value={cur.opacity ?? 1} onChange={e=>patch(cur.id,{opacity:+e.target.value})}/>
              </label>
              <p className="cp-props-hint">Resize or reposition the image directly on the canvas.</p>
            </section>
          ) : null}

          {cur.type === "shape" ? (
            <section className="cp-props-section">
              <div className="cp-props-section-title"><strong>Shape appearance</strong></div>
              {!cur.iconName && <>
                <button
                  type="button"
                  className="cp-shape-hollow-toggle"
                  aria-pressed={!cur.fill || cur.fill === "transparent"}
                  onClick={()=>patch(cur.id,{fill:!cur.fill || cur.fill === "transparent" ? "#ffffff" : "transparent"})}
                >
                  {!cur.fill || cur.fill === "transparent" ? "Add fill" : "Make hollow"}
                </button>
                <label className="cp-props-field">Fill colour
                  <input type="color" disabled={!cur.fill || cur.fill === "transparent"} value={cur.fill || "#ffffff"} onChange={e=>patch(cur.id,{fill:e.target.value})}/>
                </label>
              </>}
              <label className="cp-props-field">Border colour
                <input type="color" value={cur.stroke || "#1A4D2E"} onChange={e=>patch(cur.id,{stroke:e.target.value})}/>
              </label>
              <label className="cp-props-field">Border width
                <input type="number" min="0" max="30" value={cur.strokeWidth || 0} onChange={e=>patch(cur.id,{strokeWidth:+e.target.value})}/>
              </label>
              <label className="cp-props-field">Opacity
                <input type="range" min="0" max="1" step="0.05" value={cur.opacity ?? 1} onChange={e=>patch(cur.id,{opacity:+e.target.value})}/>
              </label>
            </section>
          ) : null}

          {cur.type !== "image" && cur.type !== "qr" && cur.type !== "shape" ? <>
            <section className="cp-props-section">
              <div className="cp-props-section-title"><strong>Content</strong></div>
              <label className="cp-props-field">Text or dynamic attribute
                <textarea rows="3" value={cur.text || ""} onChange={e=>patch(cur.id,{text:e.target.value})}/>
              </label>
            </section>

            <section className="cp-props-section">
              <div className="cp-props-section-title"><strong>Typography</strong></div>
              <label className="cp-props-field">Font family
                <select value={cur.fontFamily || "Inter"} onChange={e=>patch(cur.id,{fontFamily:e.target.value})}>
                  {["Inter","Roboto","Open Sans","Poppins","Manrope","Montserrat","Playfair Display","Cormorant Garamond","Merriweather","Georgia","Allura","Great Vibes","Dancing Script"].map(f=><option key={f}>{f}</option>)}
                </select>
              </label>
              <div className="cp-props-grid">
                <label>Font size<input type="number" min="8" max="120" value={cur.fontSize || 24} onChange={e=>patch(cur.id,{fontSize:+e.target.value})}/></label>
                <label>Line height<input type="number" min="0.7" max="3" step="0.1" value={cur.lineHeight || 1.2} onChange={e=>patch(cur.id,{lineHeight:+e.target.value})}/></label>
              </div>
              <label className="cp-props-field">Text colour
                <input type="color" value={cur.color || "#26334d"} onChange={e=>patch(cur.id,{color:e.target.value})}/>
              </label>
              <div className="cp-props-section-title cp-props-subtitle"><strong>Text style</strong></div>
              <div className="cp-type-buttons">
                <button type="button" className={cur.bold ? "active" : ""} aria-label="Bold" aria-pressed={!!cur.bold} onClick={()=>patch(cur.id,{bold:!cur.bold})}><b>B</b></button>
                <button type="button" className={cur.italic ? "active" : ""} aria-label="Italic" aria-pressed={!!cur.italic} onClick={()=>patch(cur.id,{italic:!cur.italic})}><i>I</i></button>
                <button type="button" className={cur.underline ? "active" : ""} aria-label="Underline" aria-pressed={!!cur.underline} onClick={()=>patch(cur.id,{underline:!cur.underline})}><u>U</u></button>
              </div>
              <label className="cp-props-field">Alignment
                <select value={cur.align || "center"} onChange={e=>patch(cur.id,{align:e.target.value})}>
                  <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                </select>
              </label>
              <label className="cp-props-field">Capitalization
                <select value={cur.textTransform || "none"} onChange={e=>patch(cur.id,{textTransform:e.target.value})}>
                  <option value="none">Normal</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option><option value="capitalize">Capitalize</option>
                </select>
              </label>
              <div className="cp-props-grid">
                <label>Letter spacing<input type="number" min="-5" max="30" step="0.5" value={cur.letterSpacing || 0} onChange={e=>patch(cur.id,{letterSpacing:+e.target.value})}/></label>
                <label>Opacity<input type="number" min="0" max="1" step="0.1" value={cur.opacity ?? 1} onChange={e=>patch(cur.id,{opacity:+e.target.value})}/></label>
              </div>
            </section>
          </> : null}

          <button className="danger-button cp-props-delete" onClick={()=>del(cur.id)}><Trash2 size={15}/> Delete element</button>
        </> : (
          <section className="cp-props-section cp-props-canvas-section">
            <div className="cp-props-canvas-icon">✳</div>
            <strong>No element selected</strong>
            <p>Select an element on your certificate to edit its individual properties, or change the overall canvas settings below.</p>
          </section>
        )}

        <section className="cp-props-section cp-props-design-section">
          <div className="cp-props-section-title">
            <strong>Design settings</strong>
            <span>DOCUMENT</span>
          </div>
          <label className="cp-props-field">Design name
            <input value={d.name || ""} onChange={e=>updateDesign(x=>({...x,name:e.target.value}))}/>
          </label>
          <label className="cp-props-field">Canvas background
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(d.background) ? d.background : "#ffffff"} onChange={e=>updateDesign(x=>({...x,background:e.target.value}))}/>
          </label>
          <div className="cp-props-field cp-background-field">
            <span>Background image</span>
            <div className="cp-background-control">
              {backgroundImage ? (
                <div className="cp-background-preview">
                  <img src={backgroundImage} alt="Certificate background preview"/>
                  <div className="cp-background-preview-info">
                    <strong>Background image</strong>
                    <small>Custom image applied</small>
                  </div>
                  <button
                    type="button"
                    className="cp-background-remove"
                    title="Remove background image"
                    aria-label="Remove background image"
                    onClick={()=>{updateDesign(x=>({...x,backgroundImage:""}));setBackgroundImage("");M("Background image removed");setTimeout(()=>M(""),1800);}}
                  >×</button>
                </div>
              ) : (
                <button type="button" className="cp-background-empty" onClick={()=>backgroundInput.current?.click()}>
                  <span className="cp-background-empty-icon">＋</span>
                  <span><strong>Add background image</strong><small>PNG, JPG or WebP · Up to 8 MB</small></span>
                </button>
              )}
              {backgroundImage && (
                <button type="button" className="cp-background-change" onClick={()=>backgroundInput.current?.click()}>
                  Change image
                </button>
              )}
            </div>
            <input
              ref={backgroundInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{display:"none"}}
              onChange={e=>{uploadBackground(e.target.files?.[0]);e.target.value="";}}
            />
          </div>
          <label className="cp-props-field">Page size
            <select value={d.pageSize || "Custom"} onChange={e=>applyPageSize(e.target.value)}>
              <option value="A4">A4</option>
              <option value="US Letter">US Letter</option>
              <option value="Custom">Custom dimensions</option>
            </select>
          </label>
          <div className="cp-props-canvas-meta">
            <span>Canvas dimensions</span>
            <strong>{d.width} × {d.height} px</strong>
          </div>
        </section>
      </aside>
    </div>
    {previewImage && (
      <div
        className="certify-preview-overlay"
        onMouseDown={event=>{
          if(event.target===event.currentTarget)setPreviewImage("");
        }}
      >
        <section
          ref={previewDialogRef}
          className="certify-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="certify-preview-title"
          aria-describedby="certify-preview-description"
        >
          <div className="certify-preview-toolbar">
            <div className="certify-preview-heading">
              <span>CREDENTIAL PREVIEW</span>
              <strong id="certify-preview-title">Preview your credential design</strong>
              <small id="certify-preview-description">See how real data populates the dynamic attribute placeholders.</small>
            </div>
            <div className="certify-preview-buttons">
              <button type="button" className="certify-preview-print" onClick={()=>window.print()}>
                <Printer size={15}/> Print / Save PDF
              </button>
              <button
                ref={previewCloseRef}
                type="button"
                className="certify-preview-close"
                onClick={()=>setPreviewImage("")}
                aria-label="Close preview"
                title="Close preview"
              >
                <X size={17}/>
              </button>
            </div>
          </div>
          <div className="certify-preview-workspace">
            <aside className="certify-preview-data">
              <div className="certify-preview-data-heading">
                <strong>Preview data</strong>
                <span>Sample values</span>
              </div>
              <label>
                <span>Recipient Name</span>
                <input
                  value={previewRecipient}
                  onChange={event=>updateLivePreviewField("recipient",event.target.value)}
                  placeholder="Recipient Name"
                />
              </label>
              <label>
                <span>Certificate UUID</span>
                <input
                  value={previewCredentialId}
                  onChange={event=>updateLivePreviewField("credentialId",event.target.value)}
                  placeholder="Certificate UUID"
                />
              </label>
              <div className="certify-preview-live-status"><span/> Preview updates automatically</div>
              <p>Only preview values are changed. Your design attributes and canvas remain unchanged.</p>
            </aside>
            <div ref={previewStageRef} className="certify-preview-stage">
              <div
                className="certify-preview-canvas-frame"
                style={{width:d.width*previewScale,height:d.height*previewScale}}
              >
                <div
                  className="certify-preview-canvas"
                  style={{
                    width:d.width,
                    height:d.height,
                    background:d.background,
                    backgroundImage:backgroundImage?`url("${backgroundImage}")`:undefined,
                    backgroundSize:"100% 100%",
                    backgroundPosition:"center",
                    backgroundRepeat:"no-repeat",
                    transform:`scale(${previewScale})`,
                    transformOrigin:"top left"
                  }}
                >
                  {d.elements.filter(e=>!e.hidden).map(e=>(
                    <div
                      key={e.id}
                      className="certify-preview-element"
                      style={{
                        left:e.x,
                        top:e.y,
                        width:e.width,
                        height:e.height,
                        zIndex:e.type==="qr"?2:1
                      }}
                    >
                      {e.type==="qr"?(
                        <QRCodeSVG
                          value={e.qrMode==="automatic"?`https://certifypro.in/verify/${encodeURIComponent(previewCredentialId||"PREVIEW-CREDENTIAL")}`:(e.text||"https://example.com")}
                          size={Math.max(40,Math.min(e.width,e.height)-5)}
                        />
                      ):e.type==="image"?(
                        <img src={e.src} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                      ):e.type==="shape"?(
                        <ShapeElement element={e}/>
                      ):(
                        <div style={{
                          height:"100%",
                          width:"100%",
                          display:"flex",
                          alignItems:"center",
                          justifyContent:e.align==="left"?"flex-start":e.align==="right"?"flex-end":"center",
                          fontSize:e.fontSize,
                          fontFamily:e.fontFamily||"Inter",
                          fontWeight:e.bold?700:400,
                          fontStyle:e.italic?"italic":"normal",
                          textDecoration:e.underline?"underline":"none",
                          letterSpacing:(e.letterSpacing||0)+"px",
                          lineHeight:e.lineHeight||1.2,
                          textTransform:e.textTransform||"none",
                          color:e.color,
                          textAlign:e.align,
                          overflow:"hidden",
                          whiteSpace:"pre-wrap",
                          padding:3
                        }}>{getPreviewText(e.text)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <footer className="certify-preview-footer">
            <span>Preview at certificate proportions</span>
            <span>{d.orientation==="portrait"?"Portrait":"Landscape"} · {d.width} × {d.height}</span>
          </footer>
        </section>
      </div>
    )}
    {msg&&<div className="toast">{msg}</div>}
  </div>;
}
