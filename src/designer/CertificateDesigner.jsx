import {useEffect,useRef,useState} from "react";
import {Rnd} from "react-rnd";
import {QRCodeSVG} from "qrcode.react";
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
    {id:id(),type:"text",text:"✦",x:cx-30,y:portrait?100:65,width:60,height:45,fontSize:30,color:p.accent,align:"center"},
    {id:id(),type:"text",text:p.title,x:80,y:titleY,width:w-160,height:75,fontSize:portrait?27:34,color:p.accent,bold:true,align:"center"},
    {id:id(),type:"text",text:p.subtitle,x:100,y:titleY+95,width:w-200,height:45,fontSize:19,color:"#64748b",align:"center"},
    {id:id(),type:"attribute",text:"{{recipient_name}}",x:100,y:titleY+175,width:w-200,height:85,fontSize:portrait?34:42,color:p.accent,bold:true,align:"center"},
    {id:id(),type:"text",text:"For successfully completing the programme",x:110,y:titleY+290,width:w-220,height:45,fontSize:17,color:"#475569",align:"center"},
    {id:id(),type:"attribute",text:"{{issue_date}}",x:cx-160,y:h-145,width:320,height:35,fontSize:15,color:"#64748b",align:"center"},
    {id:id(),type:"text",text:"AUTHORISED SIGNATURE",x:cx-120,y:h-85,width:240,height:30,fontSize:12,color:"#64748b",align:"center"}
  ];
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
    setHistoryCounts({undo:undoStack.current.length,redo:redoStack.current.length});
  };

  const redo=()=>{
    if(!redoStack.current.length)return;
    const next=redoStack.current.pop();
    undoStack.current.push(designRef.current);
    designRef.current=next;
    D(next);
    setHistoryCounts({undo:undoStack.current.length,redo:redoStack.current.length});
  };

  const [tool,T]=useState("Templates");
  const [mobilePanel,setMobilePanel]=useState("");
  const [selected,S]=useState(null);
  const selectedRef=useRef(selected);
  useEffect(()=>{selectedRef.current=selected;},[selected]);
  const [uploads,U]=useState([]);
  const [backgroundImage,setBackgroundImage]=useState(initial.backgroundImage || "");
  const [msg,M]=useState("");
  const [previewImage,setPreviewImage]=useState("");
  const [zoom,Z]=useState(65);
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
    if(f.size>8*1024*1024){M("Image must be under 8 MB");return}
    const src=await new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=j;fr.readAsDataURL(f)});
    U(x=>[src,...x]);add("image","Image",{src,width:260,height:160});
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
  const applyTemplate=(p,orientation)=>{
    const selectedOrientation=p.orientation || orientation || "landscape";
    const portrait=selectedOrientation==="portrait";
    setBackgroundImage(p.backgroundImage || "");
    updateDesign(x=>({...x,name:p.name || x.name,orientation:selectedOrientation,width:p.width || (portrait?790:1120),height:p.height || (portrait?1120:790),background:p.background || p.bg || "#ffffff",elements:Array.isArray(p.elements)&&p.elements.length>0?p.elements:templateElements(p,portrait)}));
    S(null);M((p.name || "Certificate")+" template applied");setTimeout(()=>M(""),1800);
  };

  const previewCertificate=async()=>{
    try {
      const { default: html2canvas } = await import("html2canvas");
      M("Preparing preview...");
      const imageCanvas=await html2canvas(canvas.current,{
        scale:2,
        backgroundColor:"#ffffff",
        useCORS:true,
        logging:false,
        onclone:clonedDocument=>{
          clonedDocument.querySelectorAll(".react-resizable-handle").forEach(el=>el.remove());
          clonedDocument.querySelectorAll(".react-draggable").forEach(el=>{
            el.style.border="none";
            el.style.outline="none";
          });
        }
      });
      setPreviewImage(imageCanvas.toDataURL("image/png"));
      M("");
    } catch(error) {
      console.error("Preview generation error:",error);
      M("Preview failed to generate");
    }
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
    ?<TemplatesPanel design={d} onChange={change} onApply={applyTemplate}/>
    :tool==="Attributes"?<AttributesPanel onAdd={v=>add("attribute",v)}/>
    :tool==="Text"?<TextPanel onAdd={(v,style)=>add("text",v,style||{})}/>
    :tool==="Uploads"?<UploadsPanel onUpload={upload} images={uploads}/>
    :tool==="QR Codes"?<QRCodesPanel onAdd={(v,extra)=>add("qr",v,extra||{})}/>
    :tool==="Layers"?<LayersPanel elements={d.elements} selected={selected} onSelect={S} onDelete={del} onMove={move}/>
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
        <button className="cp-top-button cp-preview-button" onClick={previewCertificate}>◉ Preview</button>
        <button className="btn-secondary" onClick={exportPDF}>↓ Export PDF</button>
        <button className="btn-primary" onClick={()=>{onSave({...d,backgroundImage});M("Design saved");setTimeout(()=>M(""),1800)}}>Save design</button>
      </div>
    </header>

    <div className="cp-editor-body">
      <ToolRail active={tool} onSelect={nextTool=>{T(nextTool);S(null);setMobilePanel("tools")}}/>
      <aside className={`cp-editor-panel ${mobilePanel==="tools"?"cp-mobile-open":""}`}>{panel}</aside>
      {mobilePanel && <button type="button" className="cp-mobile-drawer-backdrop" aria-label="Close panel" onClick={()=>setMobilePanel("")}/>}
      <main className="cp-workspace">
        <div className="cp-workspace-toolbar">
          <div><span className="cp-live-dot"/> <b>{d.name||"Untitled certificate"}</b><span className="cp-toolbar-separator">|</span><span>{d.orientation==="portrait"?"Portrait":"Landscape"} · {d.width} × {d.height}</span></div>
          <div className="cp-workspace-toolbar-actions">
            <button type="button" className="cp-mobile-panel-toggle" onClick={()=>setMobilePanel(v=>v==="tools"?"":"tools")}>Tools</button>
            <button type="button" className="cp-mobile-panel-toggle" onClick={()=>setMobilePanel(v=>v==="properties"?"":"properties")}>Properties</button>
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
                {d.elements.map(e=><Rnd key={e.id} bounds="parent" scale={scale} enableResizing={selected===e.id ? {
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
      top:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",top:-5},
      right:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",right:-5},
      bottom:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",bottom:-5},
      left:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",left:-5},
      topRight:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",right:-5,top:-5},
      bottomRight:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",right:-5,bottom:-5},
      bottomLeft:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",left:-5,bottom:-5},
      topLeft:{width:10,height:10,background:"#ffffff",border:"2px solid #315eea",borderRadius:"50%",left:-5,top:-5}
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
    }} size={{width:e.width,height:e.height}} position={{x:e.x,y:e.y}} onDragStop={(ev,p)=>{const moved=Math.abs(p.x-e.x)+Math.abs(p.y-e.y);if(moved>4)patch(e.id,{x:p.x,y:p.y});}} onResizeStop={(ev,dir,ref,delta,p)=>patch(e.id,{width:parseInt(ref.style.width),height:parseInt(ref.style.height),x:p.x,y:p.y})} onMouseDown={()=>S(e.id)} style={{border:selected===e.id?"1px dashed #315eea":"1px solid transparent",zIndex:selected===e.id?3:1}}>
                  <div onClick={()=>S(e.id)} style={{height:"100%",width:"100%",display:"flex",alignItems:"center",justifyContent:e.align==="left"?"flex-start":e.align==="right"?"flex-end":"center",fontSize:e.fontSize,fontFamily:e.fontFamily||"Inter",fontWeight:e.bold?700:400,fontStyle:e.italic?"italic":"normal",textDecoration:e.underline?"underline":"none",letterSpacing:(e.letterSpacing||0)+"px",lineHeight:e.lineHeight||1.2,textTransform:e.textTransform||"none",color:e.color,textAlign:e.align,overflow:"hidden",whiteSpace:"pre-wrap",padding:3}}>
                    {e.type==="qr"?<QRCodeSVG value={e.qrMode==="automatic"?"https://certifypro.in/verify/PREVIEW-CREDENTIAL":(e.text||"https://example.com")} size={Math.max(40,Math.min(e.width,e.height)-5)}/>:e.type==="image"?<img src={e.src} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:e.type==="shape"?<div style={{width:"100%",height:"100%",boxSizing:"border-box",background:e.fill||"transparent",border:e.shape==="border"?"8px double "+(e.stroke||"#c5a45c"):e.shape==="corner"?"4px solid "+(e.stroke||"#c5a45c"):e.strokeWidth?e.strokeWidth+"px "+(e.shape==="dashed"?"dashed":"solid")+" "+(e.stroke||"#315eea"):"none",borderRadius:e.shape==="circle"?"50%":e.shape==="rounded"?"14px":0,clipPath:e.shape==="triangle"?"polygon(50% 0, 0 100%, 100% 100%)":e.shape==="star"?"polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)":e.shape==="diamond"?"polygon(50% 0,100% 50%,50% 100%,0 50%)":e.shape==="corner"?"polygon(0 0,100% 0,100% 15%,15% 15%,15% 100%,0 100%)":"none",opacity:e.opacity??1}}/>:e.text}
                  </div>
                </Rnd>)}
              </div>
            </div>
          </div>
          <div className="cp-canvas-footer"><span>CertifyPro Studio</span><span>{d.elements.length} elements · {d.width} × {d.height}px</span></div>
        </div>
      </main>
      <aside className={`cp-properties cp-properties-v2 ${mobilePanel==="properties"?"cp-mobile-open":""}`}>
        <div className="cp-properties-heading cp-props-header">
          <div>
            <span className="cp-kicker">DESIGN INSPECTOR</span>
            <h2>Properties</h2>
            <p>{cur ? "Edit and customise your selected element." : "Configure your certificate design."}</p>
          </div>
          <span className="cp-props-status">{cur ? "ELEMENT" : "CANVAS"}</span>
        </div>

        {cur ? <>
          <section className="cp-props-section">
            <div className="cp-props-section-title">
              <strong>Selected element</strong>
              <span>{cur.type || "Element"}</span>
            </div>
            <div className="cp-props-selected">
              <div className="cp-props-selected-icon">
                {cur.type === "qr" ? "▦" : cur.type === "image" ? "▧" : cur.type === "shape" ? "◇" : "T"}
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
              <label className="cp-props-field">Fill colour
                <input type="color" value={cur.fill || "#ffffff"} onChange={e=>patch(cur.id,{fill:e.target.value})}/>
              </label>
              <label className="cp-props-field">Border colour
                <input type="color" value={cur.stroke || "#315eea"} onChange={e=>patch(cur.id,{stroke:e.target.value})}/>
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
                <button className={cur.bold ? "active" : ""} onClick={()=>patch(cur.id,{bold:!cur.bold})}><b>B</b></button>
                <button className={cur.italic ? "active" : ""} onClick={()=>patch(cur.id,{italic:!cur.italic})}><i>I</i></button>
                <button className={cur.underline ? "active" : ""} onClick={()=>patch(cur.id,{underline:!cur.underline})}><u>U</u></button>
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

          <button className="danger-button cp-props-delete" onClick={()=>del(cur.id)}>Delete element</button>
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
          <div className="cp-props-canvas-meta">
            <span>Canvas dimensions</span>
            <strong>{d.width} × {d.height} px</strong>
          </div>
        </section>
      </aside>
    </div>
    {previewImage && (
      <div className="certify-preview-overlay" onClick={()=>setPreviewImage("")}>
        <div className="certify-preview-modal" onClick={e=>e.stopPropagation()}>
          <div className="certify-preview-toolbar">
            <strong>Certificate Preview</strong>
            <div className="certify-preview-buttons">
              <button type="button" onClick={()=>window.print()}>Print / Save PDF</button>
              <button type="button" className="certify-preview-close" onClick={()=>setPreviewImage("")}>Close Preview ✕</button>
            </div>
          </div>
          <div className="certify-preview-stage">
            <img src={previewImage} alt="Certificate preview" />
          </div>
        </div>
      </div>
    )}
    {msg&&<div className="toast">{msg}</div>}
  </div>;
}
