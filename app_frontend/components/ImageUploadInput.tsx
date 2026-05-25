"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { uploadImage } from "@/lib/api";

type ImageUploadInputProps = {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  hint?: string;
  height?: number;
};

export function ImageUploadInput({
  label,
  value,
  onChange,
  folder = "branding",
  hint = "JPG, PNG o WebP",
  height = 140,
}: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err: any) {
      alert(err?.message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="label" style={{ marginBottom: 8 }}>{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {value ? (
        <div style={{ position: "relative", height, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(0,0,0,0.45)" }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="btn btn-primary btn-sm" style={{ borderRadius: 12 }}>
              {uploading ? <Loader2 className="spin-icon" size={14} /> : <Upload size={14} />} Cambiar
            </button>
            <button type="button" onClick={() => onChange("")} disabled={uploading} className="btn btn-secondary btn-sm" style={{ borderRadius: 12 }}>
              <Trash2 size={14} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%",
            height,
            borderRadius: 16,
            border: "1px dashed var(--border)",
            background: "rgba(255,255,255,0.03)",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          {uploading ? <Loader2 className="spin-icon" size={24} color="var(--primary)" /> : <ImagePlus size={24} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{uploading ? "Subiendo..." : "Elegir imagen"}</span>
          <span style={{ fontSize: 10 }}>{hint}</span>
        </button>
      )}
    </div>
  );
}
