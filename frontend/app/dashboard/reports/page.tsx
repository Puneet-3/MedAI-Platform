"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  ShieldAlert,
  ArrowRight,
  Download,
  Eye,
  FileBadge,
  Activity
} from "lucide-react";

interface Report {
  id: string;
  userId: string;
  fileUrl: string;
  reportType: string;
  cnnLabel: string | null;
  cnnConfidence: number | null;
  status: "PENDING" | "ANALYZED" | "REVIEWED";
  doctorNotes: string | null;
}

export default function ReportsHubPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportType, setReportType] = useState("Chest X-Ray");
  const [loading, setLoading] = useState(true);
  
  // Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reports.");
      setReports(data.reports || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch medical reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    setError(null);
    setUploadSuccess(false);

    // Simulate progress ticks
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev < 80 ? prev + 15 : prev));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reportType", reportType);

      const res = await fetch("/api/upload-report", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Refresh reports archive
      fetchReports();
      
      // Clear success banner after 4 seconds
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            <Clock className="w-3 h-3" /> Awaiting Analysis
          </span>
        );
      case "ANALYZED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
            <Activity className="w-3 h-3" /> AI Analyzed
          </span>
        );
      case "REVIEWED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="w-3 h-3" /> Clinically Reviewed
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        <span className="text-xs font-semibold text-neutral-500">Loading records archive...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Diagnostic Records Hub</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Upload clinical files or chest X-rays to generate AI classifications and submit for clinical physician reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload zone */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Upload New Document
              </h3>
              <p className="text-xs text-neutral-500">
                Select category and drag file to begin upload
              </p>
            </div>

            {/* Dropdown Select Report Type */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-widest">
                Document Classification
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-neutral-850"
              >
                <option value="Chest X-Ray">Chest X-Ray (CNN Compatible)</option>
                <option value="Complete Blood Count">Complete Blood Count</option>
                <option value="Urinalysis Report">Urinalysis Report</option>
                <option value="MRI / CT Scan">MRI / CT Scan</option>
                <option value="Other Medical Report">Other Medical Report</option>
              </select>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/40 hover:bg-neutral-50/30 dark:hover:bg-neutral-950/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-450 mb-4">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-neutral-750 dark:text-neutral-250">
                Drag and drop your file here
              </h4>
              <p className="text-[10px] text-neutral-450 mt-1 max-w-[200px] leading-relaxed mx-auto">
                Supports PDF documents, JPG, or PNG images (up to 10MB)
              </p>
            </div>

            {/* Uploading progress bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                  <span>Uploading file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Feedback Notifications */}
            {uploadSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Document uploaded successfully!</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-250/30 text-red-800 dark:text-red-400 text-xs font-bold flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Reports List Archive */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-4">
              <FileBadge className="w-4.5 h-4.5 text-neutral-500" />
              Document Records Archive
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {reports.length > 0 ? (
                reports.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 border border-neutral-100 dark:border-neutral-850 bg-neutral-50/10 dark:bg-neutral-950/10 rounded-2xl space-y-4"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-black text-neutral-800 dark:text-neutral-205">
                          {r.reportType}
                        </h4>
                        <p className="text-[9px] text-neutral-450 mt-0.5">
                          ID: {r.id.toUpperCase().substring(0, 8)}
                        </p>
                      </div>
                      {getStatusBadge(r.status)}
                    </div>

                    {/* Results / Details block based on status */}
                    {(r.status === "ANALYZED" || r.status === "REVIEWED") && (
                      <div className="space-y-3 pt-3 border-t border-neutral-150/40 dark:border-neutral-800/40">
                        {/* CNN classifier prediction (only if it was run) */}
                        {r.cnnLabel && (
                          <div className="p-3 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/15 border border-indigo-200/20">
                            <span className="block text-[8px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-0.5">
                              Neural Classifier Classification
                            </span>
                            <div className="flex justify-between items-center text-xs font-bold text-neutral-800 dark:text-neutral-250">
                              <span>{r.cnnLabel}</span>
                              <span className="text-[10px] text-indigo-650 dark:text-indigo-400">
                                {Math.round((r.cnnConfidence || 0) * 100)}% Confidence
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Doctor notes if clinically reviewed */}
                        {r.status === "REVIEWED" && r.doctorNotes && (
                          <div className="p-3.5 bg-emerald-50/10 dark:bg-emerald-950/10 border border-emerald-100/35 rounded-xl">
                            <span className="block text-[8px] font-black text-emerald-650 uppercase tracking-widest mb-1.5">
                              Clinical Physician Review Notes
                            </span>
                            <p className="text-xs text-neutral-750 dark:text-neutral-350 leading-relaxed italic">
                              "{r.doctorNotes}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-2 border-t border-neutral-150/20 dark:border-neutral-800/20">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-150 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-[10px] font-bold rounded-xl transition-all"
                      >
                        <Eye className="w-3 h-3" /> View
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-neutral-500 space-y-2">
                  <div className="p-3 w-fit h-fit rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold">Archive is Empty</h4>
                  <p className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                    You have not uploaded any medical reports yet. Drag a chest X-Ray file to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
