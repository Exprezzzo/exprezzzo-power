'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Image, Music, Video, FileText, X, CheckCircle } from 'lucide-react';
import { VEGAS_THEME_COLORS } from '@/types/ai-playground';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  processed?: any;
  uploading?: boolean;
  error?: string;
}

export function FileUploadZone({ onFilesProcessed }: { onFilesProcessed?: (files: UploadedFile[]) => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    for (const file of acceptedFiles) {
      const tempId = crypto.randomUUID();
      
      // Add to UI immediately
      setFiles(prev => [...prev, {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        uploading: true
      }]);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          setFiles(prev => prev.map(f => 
            f.id === tempId 
              ? { ...f, ...data, uploading: false }
              : f
          ));
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { ...f, uploading: false, error: error.message }
            : f
        ));
      }
    }
    
    setUploading(false);
    if (onFilesProcessed) {
      onFilesProcessed(files);
    }
  }, [files, onFilesProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className='w-4 h-4' />;
    if (type.startsWith('audio/')) return <Music className='w-4 h-4' />;
    if (type.startsWith('video/')) return <Video className='w-4 h-4' />;
    if (type.includes('pdf')) return <FileText className='w-4 h-4' />;
    return <File className='w-4 h-4' />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className='w-full'>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer
          ${isDragActive 
            ? 'border-[#FFD700] bg-[#FFD700]/10' 
            : 'border-[#FFD700]/30 hover:border-[#FFD700]/50 bg-black/30'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className='flex flex-col items-center justify-center gap-4'>
          <Upload className={`w-12 h-12 ${isDragActive ? 'text-[#FFD700]' : 'text-[#FFD700]/60'}`} />
          
          <div className='text-center'>
            <p className='text-white font-medium'>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className='text-gray-400 text-sm mt-1'>
              or click to browse (Max 50MB)
            </p>
          </div>
          
          <div className='flex gap-2 flex-wrap justify-center'>
            <span className='px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] text-xs rounded'>Images</span>
            <span className='px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] text-xs rounded'>PDFs</span>
            <span className='px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] text-xs rounded'>Audio</span>
            <span className='px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] text-xs rounded'>Video</span>
            <span className='px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] text-xs rounded'>CSV/Excel</span>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className='mt-4 space-y-2'>
          {files.map(file => (
            <div
              key={file.id}
              className='flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-[#FFD700]/20'
            >
              {getFileIcon(file.type)}
              
              <div className='flex-1 min-w-0'>
                <p className='text-white text-sm font-medium truncate'>{file.name}</p>
                <p className='text-gray-400 text-xs'>{formatFileSize(file.size)}</p>
              </div>
              
              {file.uploading && (
                <div className='w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin' />
              )}
              
              {!file.uploading && !file.error && (
                <CheckCircle className='w-4 h-4 text-green-500' />
              )}
              
              {file.error && (
                <span className='text-red-500 text-xs'>{file.error}</span>
              )}
              
              <button
                onClick={() => removeFile(file.id)}
                className='p-1 hover:bg-red-500/20 rounded transition-colors'
              >
                <X className='w-4 h-4 text-red-500' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}