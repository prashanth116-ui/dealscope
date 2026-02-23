"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";

type DocType = "om" | "rentroll" | "t12";
type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";

const DOC_TYPES: { label: string; value: DocType; description: string }[] = [
  { label: "Offering Memorandum", value: "om", description: "Full property package with financials" },
  { label: "Rent Roll", value: "rentroll", description: "Current tenant and rent data" },
  { label: "Trailing 12 (T12)", value: "t12", description: "12-month income/expense statement" },
];

export default function UploadPage() {
  const router = useRouter();
  const { dispatch } = useWizard();
  const [docType, setDocType] = useState<DocType>("om");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setError(null);

    try {
      // Simulate upload - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatus("processing");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setStatus("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-primary mb-4">Upload Document</h2>

      {/* Document Type */}
      <div className="space-y-2 mb-6">
        {DOC_TYPES.map((dt) => (
          <button
            key={dt.value}
            className={`w-full text-left p-3 rounded-lg border-2 transition ${
              docType === dt.value ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setDocType(dt.value)}
          >
            <div className="text-sm font-semibold">{dt.label}</div>
            <div className="text-xs text-muted-foreground">{dt.description}</div>
          </button>
        ))}
      </div>

      {/* File Drop Zone */}
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition mb-4">
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to select or drop a file</span>
            <span className="text-xs text-muted-foreground">PDF, up to 25MB</span>
          </>
        )}
        <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
      </label>

      {/* Status */}
      {status === "uploading" && (
        <div className="flex items-center gap-2 text-sm text-primary mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />Uploading...
        </div>
      )}
      {status === "processing" && (
        <div className="flex items-center gap-2 text-sm text-primary mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />Extracting data...
        </div>
      )}
      {status === "complete" && (
        <div className="flex items-center gap-2 text-sm text-success mb-4">
          <CheckCircle className="h-4 w-4" />Extraction complete
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-destructive mb-4">
          <XCircle className="h-4 w-4" />{error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          Skip
        </Button>
        <Button
          className="flex-1"
          disabled={!file || status === "uploading" || status === "processing"}
          onClick={status === "complete" ? () => router.push("/analysis/new") : handleUpload}
        >
          {status === "complete" ? "Apply & Continue" : "Upload & Extract"}
        </Button>
      </div>
    </div>
  );
}
