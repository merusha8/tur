"use client";

import { useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export function ImageUploadField({
  value,
  onChange,
  multiple = false,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const res = await adminApi.uploadImage(file);
        urls.push(res.data.url);
      }
      onChange(multiple ? [...value, ...urls] : [urls[0]]);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange(multiple ? [...value, urlInput.trim()] : [urlInput.trim()]);
    setUrlInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative h-16 w-20 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              className="absolute right-0 top-0 bg-black/60 p-0.5 text-white"
              onClick={() => onChange(value.filter((u) => u !== url))}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => upload(e.target.files)} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" /> {uploading ? "Uploading..." : "Upload image"}
        </Button>
        <Input placeholder="Or paste image URL" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={addUrl}>Add URL</Button>
      </div>
    </div>
  );
}
