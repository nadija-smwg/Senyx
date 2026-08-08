"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

interface FileUploadProps {
  ownerType: string;
  ownerId: string;
  onUploadComplete?: (document: any) => void;
  maxSizeMB?: number;
}

export function FileUpload({ ownerType, ownerId, onUploadComplete, maxSizeMB = 10 }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    setSuccess(false);
    
    // Validate size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ownerType', ownerType);
    formData.append('ownerId', ownerId);

    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 90));
      }, 200);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload');
      }

      setSuccess(true);
      if (onUploadComplete) {
        onUploadComplete(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during upload');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-md">
      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip"
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
              <UploadCloud className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOC, XLS, images, or ZIP (max {maxSizeMB}MB)</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => inputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <File className="w-5 h-5" />
              </div>
              <div className="max-w-[200px] sm:max-w-[260px]">
                <p className="text-sm font-medium text-slate-700 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && !success && (
              <button 
                onClick={reset}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-center text-xs text-rose-600 bg-rose-50 p-2 rounded">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-3 flex items-center text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              File uploaded successfully
            </div>
          )}

          {uploading && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {!uploading && !success && !error && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleUpload}>
                Upload File
              </Button>
            </div>
          )}
          
          {error && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="w-full" onClick={reset}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
