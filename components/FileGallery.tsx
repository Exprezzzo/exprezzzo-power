'use client';

import React, { useState, useEffect } from 'react';
import { Grid3X3, List, Download, Trash2, Eye, Share2 } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  thumbnail?: string;
}

export function FileGallery() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files/list');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    
    try {
      await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const shareFile = async (file: FileItem) => {
    const shareUrl = `${window.location.origin}/files/${file.id}`;
    
    if (navigator.share) {
      await navigator.share({
        title: file.name,
        url: shareUrl
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied!');
    }
  };

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-[#FFD700]'>File Gallery</h2>
        
        <div className='flex gap-2'>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#FFD700] text-black' : 'bg-black/30 text-[#FFD700]'}`}
          >
            <Grid3X3 className='w-5 h-5' />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#FFD700] text-black' : 'bg-black/30 text-[#FFD700]'}`}
          >
            <List className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {files.map(file => (
            <div
              key={file.id}
              className='group relative bg-black/30 rounded-lg overflow-hidden border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all'
            >
              {/* Preview */}
              <div className='aspect-square bg-black/50 flex items-center justify-center'>
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className='w-full h-full object-cover' />
                ) : (
                  <div className='text-[#FFD700]/30 text-4xl'>📄</div>
                )}
              </div>
              
              {/* Info */}
              <div className='p-3'>
                <p className='text-white text-sm truncate'>{file.name}</p>
                <p className='text-gray-400 text-xs'>{new Date(file.uploadedAt).toLocaleDateString()}</p>
              </div>
              
              {/* Actions */}
              <div className='absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                <button
                  onClick={() => setSelectedFile(file)}
                  className='p-1 bg-black/80 rounded hover:bg-[#FFD700]/20'
                >
                  <Eye className='w-4 h-4 text-white' />
                </button>
                <button
                  onClick={() => shareFile(file)}
                  className='p-1 bg-black/80 rounded hover:bg-[#FFD700]/20'
                >
                  <Share2 className='w-4 h-4 text-white' />
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  className='p-1 bg-black/80 rounded hover:bg-red-500/20'
                >
                  <Trash2 className='w-4 h-4 text-red-500' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className='space-y-2'>
          {files.map(file => (
            <div
              key={file.id}
              className='flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all'
            >
              <div className='flex-1'>
                <p className='text-white font-medium'>{file.name}</p>
                <p className='text-gray-400 text-sm'>
                  {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className='flex gap-2'>
                <button className='p-2 hover:bg-[#FFD700]/20 rounded'>
                  <Download className='w-4 h-4 text-[#FFD700]' />
                </button>
                <button className='p-2 hover:bg-[#FFD700]/20 rounded'>
                  <Share2 className='w-4 h-4 text-[#FFD700]' />
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  className='p-2 hover:bg-red-500/20 rounded'
                >
                  <Trash2 className='w-4 h-4 text-red-500' />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}