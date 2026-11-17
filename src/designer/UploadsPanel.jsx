import React, { useRef, useState } from "react";
import { ImagePlus, Upload, Image as ImageIcon } from "lucide-react";

export default function UploadsPanel({ onUpload, images = [] }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const selectFile = file => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      return;
    }
    onUpload(file);
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
          selectFile(e.dataTransfer.files?.[0]);
        }}
      >
        <span className="cp-upload-icon"><Upload size={22}/></span>
        <strong>Drag and drop your image</strong>
        <span>or <b>browse files</b></span>
        <small>PNG, JPG, WebP or SVG · Maximum 8 MB</small>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        hidden
        onChange={e => {
          selectFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="cp-assets-heading">
        <strong>Uploaded assets</strong>
        <span>{images.length} files</span>
      </div>

      {images.length === 0 ? (
        <div className="cp-assets-empty">
          <ImageIcon size={25}/>
          <strong>No uploads yet</strong>
          <p>Your uploaded images will appear here.</p>
        </div>
      ) : (
        <div className="cp-assets-grid">
          {images.map((src, i) => (
            <div className="cp-asset-card" key={`${i}-${src.slice(0, 24)}`}>
              <div className="cp-asset-image">
                <img src={src} alt={`Uploaded asset ${i + 1}`}/>
              </div>
              <span>Image {images.length - i}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
