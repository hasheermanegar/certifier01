import { useRef, useState } from "react";
import { ImagePlus, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export default function UploadsPanel({ onUpload, onUse, onRemove, images = [] }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");

  const selectFiles = async fileList => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const supported = files.filter(file => file.type.startsWith("image/"));
    const valid = supported.filter(file => file.size <= MAX_FILE_SIZE);
    if (valid.length !== files.length) {
      setMessage("Some files were skipped. Use images up to 8 MB each.");
    } else {
      setMessage("");
    }

    for (const file of valid) {
      try {
        await onUpload(file);
      } catch (error) {
        console.error("Could not upload image:", error);
        setMessage(`Could not upload ${file.name || "image"}. Please try again.`);
      }
    }
  };

  return (
    <div className="designer-panel cp-uploads-panel">
      <div className="cp-panel-heading">
        <div>
          <span className="cp-panel-eyebrow">YOUR ASSETS</span>
          <h3>Uploads</h3>
          <p>Add logos, signatures and images to your certificate.</p>
        </div>
        <span className="cp-panel-heading-icon"><ImagePlus size={19}/></span>
      </div>

      <button
        type="button"
        className={`cp-upload-dropzone ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          void selectFiles(e.dataTransfer.files);
        }}
      >
        <span className="cp-upload-icon"><Upload size={22}/></span>
        <strong>Drag and drop images</strong>
        <span>or <b>browse files</b></span>
        <small>PNG, JPG, WebP or SVG · Up to 8 MB each</small>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        multiple
        hidden
        onChange={e => {
          void selectFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {message && <p className="cp-upload-message" role="status">{message}</p>}

      <div className="cp-assets-heading">
        <strong>Your assets</strong>
        <span>{images.length} {images.length === 1 ? "image" : "images"}</span>
      </div>

      {images.length === 0 ? (
        <div className="cp-assets-empty">
          <ImageIcon size={25}/>
          <strong>No assets yet</strong>
          <p>Upload an image to add it to the canvas or reuse it later.</p>
        </div>
      ) : (
        <div className="cp-assets-grid">
          {images.map((asset, i) => (
            <article className="cp-asset-card" key={asset.id}>
              <div className="cp-asset-image">
                <img src={asset.src} alt={asset.name || `Uploaded asset ${i + 1}`}/>
              </div>
              <span title={asset.name}>{asset.name || `Image ${images.length - i}`}</span>
              <div className="cp-asset-actions">
                <button type="button" onClick={() => onUse?.(asset)} aria-label={`Add ${asset.name || "image"} to canvas`}>
                  <Plus size={12}/> Add to canvas
                </button>
                <button type="button" className="remove" onClick={() => onRemove?.(asset.id)} aria-label={`Remove ${asset.name || "image"} from uploads`}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
