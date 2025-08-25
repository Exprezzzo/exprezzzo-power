// components/ProjectSidebar.tsx
// Project list with search/filter, drag-drop upload, and context visualization

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Project, 
  ProjectAsset,
  PlaygroundSession 
} from '@/types/ai-playground';
import { usePlaygroundStorage } from '@/hooks/usePlaygroundStorage';

interface ProjectSidebarProps {
  currentProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
  className?: string;
}

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  currentProject,
  onProjectSelect,
  onCreateProject,
  className = ''
}) => {
  const { 
    projects, 
    sessions,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createSession
  } = usePlaygroundStorage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [showArchived, setShowArchived] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [contextExpanded, setContextExpanded] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Search filter
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !project.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0 && 
          !selectedTags.some(tag => project.tags?.includes(tag))) {
        return false;
      }

      // Archive filter
      if (!showArchived && project.isArchived) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  // Get unique tags from all projects
  const allTags = Array.from(new Set(
    projects.flatMap(project => project.tags || [])
  )).sort();

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!currentProject) {
      // Create new project for files
      const newProject = await createProject('New Project with Files');
      onProjectSelect(newProject);
      // Continue with file processing for new project
    }

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [currentProject, createProject, onProjectSelect]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = ''; // Reset input
  }, []);

  const processFiles = async (files: File[]) => {
    if (!currentProject) return;

    const newUploads: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadIndex = uploadProgress.length + i;

      try {
        // Update progress
        setUploadProgress(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { ...upload, progress: 25, status: 'processing' } : upload
        ));

        // Read file content
        const content = await readFileContent(file);
        
        // Create project asset
        const asset: ProjectAsset = {
          id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: getFileType(file),
          size: file.size,
          content,
          mimeType: file.type,
          uploadedAt: new Date(),
          uploadedBy: 'current-user', // Would get from auth context
          projectId: currentProject.id
        };

        // Update progress
        setUploadProgress(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { ...upload, progress: 75 } : upload
        ));

        // Add to project context if it's a text file
        if (isTextFile(file)) {
          const response = await fetch(`/api/projects/${currentProject.id}/context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `File: ${file.name}\n\n${content}`,
              type: 'file',
              source: 'upload',
              tags: [getFileType(file)],
              autoOptimize: true
            })
          });

          if (!response.ok) {
            throw new Error('Failed to add file to context');
          }
        }

        // Update project with new asset
        const updatedAssets = [...(currentProject.assets || []), asset];
        await updateProject(currentProject.id, { assets: updatedAssets });

        // Complete upload
        setUploadProgress(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { ...upload, progress: 100, status: 'complete' } : upload
        ));

      } catch (error) {
        console.error('File upload failed:', error);
        setUploadProgress(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { 
            ...upload, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : upload
        ));
      }
    }

    // Clear completed uploads after delay
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(upload => upload.status !== 'complete'));
    }, 3000);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const getFileType = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'react',
      'tsx': 'react',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'html': 'html',
      'css': 'css',
      'scss': 'sass',
      'md': 'markdown',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'txt': 'text',
      'csv': 'data',
      'sql': 'sql'
    };

    return typeMap[extension || ''] || 'file';
  };

  const isTextFile = (file: File): boolean => {
    return file.type.startsWith('text/') || 
           ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.html', '.css', '.scss', '.md', '.json', '.xml', '.yaml', '.yml', '.txt', '.sql'].some(ext => 
             file.name.toLowerCase().endsWith(ext)
           );
  };

  const formatTokenCount = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const getContextUsageColor = (usage: number): string => {
    if (usage < 50) return 'text-green-400';
    if (usage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const toggleContextExpanded = (projectId: string) => {
    setContextExpanded(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  return (
    <div className={`flex flex-col h-full bg-vegas-gradient ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-vegas-gradient">Projects</h2>
          <button
            onClick={onCreateProject}
            className="btn-vegas-secondary px-3 py-1 text-sm"
            title="Create new project"
          >
            <span className="mr-1">+</span>
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-vegas w-full text-sm pl-8"
          />
          <svg className="absolute left-2.5 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'name')}
            className="input-vegas text-xs flex-1"
          >
            <option value="updated">Last Updated</option>
            <option value="created">Date Created</option>
            <option value="name">Name</option>
          </select>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1 rounded-lg text-xs transition-all ${
              showArchived 
                ? 'bg-[var(--glass-bg-active)] text-[var(--vegas-gold)]' 
                : 'bg-[var(--glass-bg)] text-[var(--text-secondary)]'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 6).map(tag => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(prev => prev.filter(t => t !== tag));
                  } else {
                    setSelectedTags(prev => [...prev, tag]);
                  }
                }}
                className={`px-2 py-0.5 rounded-md text-xs transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-[var(--vegas-gold)] text-[var(--vegas-black)]'
                    : 'bg-[var(--glass-bg)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--vegas-gold)]"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-8 px-4">
            {searchTerm ? 'No projects match your search' : 'No projects yet'}
            <div className="mt-2">
              <button onClick={onCreateProject} className="btn-vegas-secondary text-sm">
                Create your first project
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredProjects.map(project => {
              const contextUsage = project.contextTokens ? 
                (project.contextTokens / 200000) * 100 : 0;
              const sessionCount = sessions.filter(s => 
                project.sessions.some(ps => ps.id === s.id)
              ).length;

              return (
                <div
                  key={project.id}
                  className={`glass-card p-3 cursor-pointer transition-all ${
                    currentProject?.id === project.id 
                      ? 'ring-2 ring-[var(--vegas-gold)] bg-[var(--glass-bg-active)]' 
                      : 'hover:bg-[var(--glass-bg-hover)]'
                  }`}
                  onClick={() => onProjectSelect(project)}
                >
                  {/* Project Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-[var(--text-primary)] truncate flex-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      {project.isPublic && (
                        <div className="w-2 h-2 rounded-full bg-green-400" title="Public project" />
                      )}
                      {project.isArchived && (
                        <div className="w-2 h-2 rounded-full bg-gray-400" title="Archived" />
                      )}
                    </div>
                  </div>

                  {/* Project Description */}
                  {project.description && (
                    <p className="text-xs text-[var(--text-secondary)] mb-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Context Usage Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-muted)]">Context</span>
                      <span className={`text-xs ${getContextUsageColor(contextUsage)}`}>
                        {formatTokenCount(project.contextTokens || 0)}/200K
                      </span>
                    </div>
                    <div className="w-full bg-[var(--glass-border)] rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(contextUsage, 100)}%`,
                          backgroundColor: contextUsage < 50 ? '#10B981' : 
                                         contextUsage < 80 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                    </div>
                  </div>

                  {/* Project Stats */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-3">
                      <span>{sessionCount} sessions</span>
                      <span>{project.assetCount || 0} files</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleContextExpanded(project.id);
                      }}
                      className="hover:text-[var(--vegas-gold)] transition-colors"
                    >
                      {contextExpanded[project.id] ? '▼' : '▶'}
                    </button>
                  </div>

                  {/* Expanded Context Preview */}
                  {contextExpanded[project.id] && project.contextSummary && (
                    <div className="mt-2 pt-2 border-t border-[var(--glass-border)] space-y-1">
                      {project.contextSummary.slice(0, 3).map((context: any) => (
                        <div key={context.id} className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)] capitalize">
                              {context.type}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {formatTokenCount(context.tokens)}
                            </span>
                          </div>
                          <div className="text-[var(--text-muted)] truncate mt-0.5">
                            {context.content.substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-[var(--glass-bg)] text-xs text-[var(--text-muted)] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-[var(--text-muted)]">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drop Zone Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 text-center max-w-sm">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-[var(--vegas-gold)] mb-2">
              Drop Files Here
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Files will be added to {currentProject?.name || 'a new project'}
            </p>
          </div>
        </div>
      )}

      {/* File Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="border-t border-[var(--glass-border)] p-3 space-y-2">
          {uploadProgress.map((upload, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-primary)] truncate flex-1">
                  {upload.file.name}
                </span>
                <span className="text-[var(--text-muted)] ml-2">
                  {upload.progress}%
                </span>
              </div>
              <div className="w-full bg-[var(--glass-border)] rounded-full h-1">
                <div 
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${upload.progress}%`,
                    backgroundColor: upload.status === 'error' ? '#EF4444' :
                                   upload.status === 'complete' ? '#10B981' : '#F59E0B'
                  }}
                />
              </div>
              {upload.error && (
                <div className="text-xs text-red-400">{upload.error}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Upload Area */}
      <div 
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-t border-[var(--glass-border)] p-3"
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full btn-vegas-secondary text-sm py-2"
          disabled={!currentProject}
        >
          <span className="mr-2">📁</span>
          {currentProject ? 'Add Files' : 'Select project to add files'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.html,.css,.scss,.md,.json,.xml,.yaml,.yml,.txt,.csv,.sql"
        />
      </div>
    </div>
  );
};

export default ProjectSidebar;