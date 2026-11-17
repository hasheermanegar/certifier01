import React,{useRef,useState} from "react";
import {Rnd} from "react-rnd";
import {QRCodeSVG} from "qrcode.react";
import html2canvas from "html2canvas";
import {jsPDF} from "jspdf";
import ToolRail from "./ToolRail";
import TemplatesPanel from "./TemplatesPanel";
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
  const [d,D]=useState(()=>({...initial,elements:initial.elements||[]}));
  const [tool,T]=useState("Templates");
  const [selected,S]=useState(null);
  const [uploads,U]=useState([]);
  const [msg,M]=useState("");
  const [zoom,Z]=useState(65);
  const canvas=useRef(null);
  const cur=d.elements.find(e=>e.id===selected);
  const patch=(i,v)=>D(x=>({...x,elements:x.elements.map(e=>e.id===i?{...e,...v}:e)}));
  const add=(type,text,extra={})=>{
    const e={id:id(),type,text,x:100,y:150,width:type==="qr"?120:500,height:type==="qr"?120:60,fontSize:24,color:"#26334d",align:"center",...extra};
    D(x=>({...x,elements:[...x.elements,e]}));S(e.id);
  };
  const del=i=>{D(x=>({...x,elements:x.elements.filter(e=>e.id!==i)}));S(null)};
  const move=(i,delta)=>D(x=>{
    const a=[...x.elements],n=a.findIndex(e=>e.id===i),j=Math.max(0,Math.min(a.length-1,n+delta));
    if(n<0)return x;const [v]=a.splice(n,1);a.splice(j,0,v);return{...x,elements:a};
  });
  const upload=async f=>{
    if(f.size>8*1024*1024){M("Image must be under 8 MB");return}
    const src=await new Promise((r,j)=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=j;fr.readAsDataURL(f)});
    U(x=>[src,...x]);add("image","Image",{src,width:260,height:160});
  };
  const change=v=>{
    if(v==="landscape"||v==="portrait")D(x=>({...x,orientation:v,width:v==="landscape"?1120:790,height:v==="landscape"?790:1120}));
    else D(x=>({...x,background:v}));
  };
  const applyTemplate=(p,orientation)=>{
    const portrait=orientation==="portrait";
    D(x=>({...x,name:p.name,orientation,width:portrait?790:1120,height:portrait?1120:790,background:p.bg,elements:templateElements(p,portrait)}));
    S(null);M(p.name+" template applied");setTimeout(()=>M(""),1800);
  };
  const exportPDF=async()=>{
    try{
      M("Preparing PDF…");
      const c=await html2canvas(canvas.current,{scale:2,backgroundColor:null});
      const pdf=new jsPDF({orientation:d.orientation,unit:"px",format:[d.width,d.height]});
      pdf.addImage(c.toDataURL("image/png"),"PNG",0,0,d.width,d.height);
      pdf.save((d.name||"certificate")+".pdf");M("PDF exported");
    }catch(e){console.error(e);M("PDF export failed")}
    setTimeout(()=>M(""),2500);
  };
  const panel=tool==="Templates"
    ?<TemplatesPanel design={d} onChange={change} onApplyTemplate={applyTemplate}/>
    :tool==="Attributes"?<AttributesPanel onAdd={v=>add("attribute",v)}/>
    :tool==="Text"?<TextPanel onAdd={v=>add("text",v)}/>
    :tool==="Uploads"?<UploadsPanel onUpload={upload} images={uploads}/>
    :tool==="QR Codes"?<QRCodesPanel onAdd={v=>add("qr",v)}/>
    :tool==="Layers"?<LayersPanel elements={d.elements} selected={selected} onSelect={S} onDelete={del} onMove={move}/>
    :<div className="designer-panel cp-simple-panel"><h3>Elements</h3><p>Add items to your certificate.</p><button className="panel-option" onClick={()=>add("text","New text")}>＋ Add text</button><button className="panel-option" onClick={()=>add("qr","https://example.com/verify")}>＋ QR code</button><button className="panel-option" onClick={()=>add("shape","")}>＋ Shape placeholder</button></div>;

  const scale=Math.min(1,Math.max(.2,zoom/100),850/d.width,650/d.height);

  return <div className="designer-page cp-designer">
    <header className="cp-designer-top">
      <div className="cp-top-left">
        <button className="cp-back" onClick={onClose}>← <span>Back</span></button>
        <span className="cp-breadcrumb">/</span>
        <div className="cp-design-heading"><b>{d.name||"Untitled certificate"}</b><small>Certificate designer</small></div>
      </div>
      <div className="cp-top-actions">
        <button className="cp-top-button" onClick={()=>Z(Math.max(25,zoom-10))}>−</button>
        <span className="cp-zoom-label">{zoom}%</span>
        <button className="cp-top-button" onClick={()=>Z(Math.min(100,zoom+10))}>＋</button>
        <button className="cp-top-button cp-preview-button" onClick={()=>window.print()}>◉ Preview</button>
        <button className="btn-secondary" onClick={exportPDF}>↓ Export PDF</button>
        <button className="btn-primary" onClick={()=>{onSave(d);M("Design saved");setTimeout(()=>M(""),1800)}}>Save design</button>
      </div>
    </header>

    <div className="cp-editor-body">
      <ToolRail active={tool} onSelect={T}/>
      <aside className="cp-editor-panel">{panel}</aside>
      <main className="cp-workspace">
        <div className="cp-workspace-toolbar">
          <div><span className="cp-live-dot"/> <b>{d.name||"Untitled certificate"}</b><span className="cp-toolbar-separator">|</span><span>{d.orientation==="portrait"?"Portrait":"Landscape"} · {d.width} × {d.height}</span></div>
          <div><button onClick={()=>change("landscape")} className={d.orientation==="landscape"?"chosen":""}>Landscape</button><button onClick={()=>change("portrait")} className={d.orientation==="portrait"?"chosen":""}>Portrait</button></div>
        </div>
        <div className="cp-canvas-workarea">
          <div className="cp-canvas-caption"><span>Page 1</span><span>Click an element to edit it · Drag to reposition</span></div>
          <div className="cp-canvas-scroll">
            <div className="cp-canvas-frame" style={{width:d.width*scale,height:d.height*scale}}>
              <div ref={canvas} className="certificate-canvas cp-certificate-canvas" style={{width:d.width,height:d.height,background:d.background,transform:"scale("+scale+")",transformOrigin:"top left"}}>
                {d.elements.map(e=><Rnd key={e.id} bounds="parent" size={{width:e.width,height:e.height}} position={{x:e.x,y:e.y}} onDragStop={(ev,p)=>patch(e.id,{x:p.x,y:p.y})} onResizeStop={(ev,dir,ref,delta,p)=>patch(e.id,{width:parseInt(ref.style.width),height:parseInt(ref.style.height),x:p.x,y:p.y})} onMouseDown={()=>S(e.id)} style={{border:selected===e.id?"1px dashed #315eea":"1px solid transparent",zIndex:selected===e.id?3:1}}>
                  <div onClick={()=>S(e.id)} style={{height:"100%",width:"100%",display:"flex",alignItems:"center",justifyContent:e.align==="left"?"flex-start":e.align==="right"?"flex-end":"center",fontSize:e.fontSize,color:e.color,fontWeight:e.bold?700:400,textAlign:e.align,overflow:"hidden",whiteSpace:"pre-wrap",padding:3}}>
                    {e.type==="qr"?<QRCodeSVG value={e.text||"https://example.com"} size={Math.min(e.width,e.height)-5}/>:e.type==="image"?<img src={e.src} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:e.text}
                  </div>
                </Rnd>)}
              </div>
            </div>
          </div>
          <div className="cp-canvas-footer"><span>CertifyPro Studio</span><span>{d.elements.length} elements · {d.width} × {d.height}px</span></div>
        </div>
      </main>
      <aside className="cp-properties">
        <div className="cp-properties-heading"><span className="cp-kicker">EDIT DESIGN</span><h2>Properties</h2><p>{cur?"Customize the selected element.":"Select an element on the canvas to edit it."}</p></div>
        {cur?<>
          <label>Content<textarea rows="3" value={cur.text||""} onChange={e=>patch(cur.id,{text:e.target.value})}/></label>
          {cur.type!=="image"&&cur.type!=="qr"&&<>
            <label>Font size<input type="number" min="8" max="120" value={cur.fontSize||24} onChange={e=>patch(cur.id,{fontSize:+e.target.value})}/></label>
            <label>Text colour<input type="color" value={cur.color||"#26334d"} onChange={e=>patch(cur.id,{color:e.target.value})}/></label>
            <label>Alignment<select value={cur.align||"center"} onChange={e=>patch(cur.id,{align:e.target.value})}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
            <label className="cp-check"><input type="checkbox" checked={!!cur.bold} onChange={e=>patch(cur.id,{bold:e.target.checked})}/> Bold text</label>
          </>}
          <div className="cp-property-divider"/>
          <div className="cp-property-row"><label>Width<input type="number" value={Math.round(cur.width)} onChange={e=>patch(cur.id,{width:+e.target.value})}/></label><label>Height<input type="number" value={Math.round(cur.height)} onChange={e=>patch(cur.id,{height:+e.target.value})}/></label></div>
          <button className="danger-button" onClick={()=>del(cur.id)}>Delete element</button>
        </>:<div className="cp-selection-empty"><span>✳</span><b>Nothing selected</b><p>Select an element on your certificate to edit its properties.</p></div>}
        <div className="cp-property-divider"/>
        <label>Design name<input value={d.name||""} onChange={e=>D(x=>({...x,name:e.target.value}))}/></label>
        <label>Canvas background<input type="color" value={/^#[0-9a-f]{6}$/i.test(d.background)?d.background:"#ffffff"} onChange={e=>D(x=>({...x,background:e.target.value}))}/></label>
      </aside>
    </div>
    {msg&&<div className="toast">{msg}</div>}
  </div>;
}
