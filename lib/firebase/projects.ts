// lib/firebase/projects.ts
// Firestore project schema and operations with real-time sync and collaboration

import { 
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  enableNetwork,
  disableNetwork,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Project, 
  ProjectAsset, 
  PlaygroundSession,
  ProjectTemplate 
} from '@/types/ai-playground';

export interface ProjectSchema {
  // Core fields
  name: string;
  description?: string;
  owner: string;
  collaborators: string[];
  
  // Content
  sessions: string[]; // Session IDs
  contextTokens: number;
  assetCount: number;
  
  // Metadata
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastActivity: any; // Firestore Timestamp
  
  // Settings
  isPublic: boolean;
  isArchived: boolean;
  tags: string[];
  template?: string;
  
  // Real-time collaboration
  activeCollaborators: Array<{
    userId: string;
    userName: string;
    lastSeen: any; // Firestore Timestamp
    cursor?: {
      sessionId?: string;
      messageId?: string;
    };
  }>;
  
  // Version tracking
  version: number;
  lastModifiedBy: string;
}

export interface ContextItemSchema {
  content: string;
  type: 'message' | 'file' | 'summary' | 'reference' | 'note';
  priority: number;
  tokens: number;
  relevanceScore?: number;
  embedding?: number[];
  source: string;
  sessionId?: string;
  createdAt: any;
  updatedAt?: any;
  tags: string[];
  compressed: boolean;
  originalLength?: number;
  
  // Real-time collaboration
  editedBy?: string;
  editedAt?: any;
  locked?: boolean;
  lockedBy?: string;
  lockedAt?: any;
}

export interface ProjectAssetSchema {
  name: string;
  type: string;
  size: number;
  mimeType: string;
  content?: string; // For text files
  url?: string; // For uploaded files
  uploadedAt: any;
  uploadedBy: string;
  
  // Metadata
  checksum?: string;
  version: number;
  tags: string[];
  
  // Access tracking
  lastAccessed?: any;
  accessCount: number;
}

// Project templates
export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  'coding-assistant': {
    id: 'coding-assistant',
    name: 'Coding Assistant',
    description: 'AI-powered coding companion with file analysis',
    initialContext: [
      'You are an expert programming assistant. Help with code review, debugging, and optimization.',
      'Focus on clean, maintainable code and best practices.'
    ],
    suggestedTags: ['coding', 'development', 'ai-assistant'],
    defaultSettings: {
      temperature: 0.3,
      maxTokens: 4000,
      modelId: 'gpt-4o',
      systemPrompt: 'You are a professional software engineer assistant.'
    }
  },
  'research-project': {
    id: 'research-project',
    name: 'Research Project',
    description: 'Academic or business research with document analysis',
    initialContext: [
      'This is a research project for analyzing documents and extracting insights.',
      'Focus on thorough analysis and evidence-based conclusions.'
    ],
    suggestedTags: ['research', 'analysis', 'academic'],
    defaultSettings: {
      temperature: 0.7,
      maxTokens: 6000,
      modelId: 'claude-3-5-sonnet',
      systemPrompt: 'You are a research assistant specializing in document analysis.'
    }
  },
  'creative-writing': {
    id: 'creative-writing',
    name: 'Creative Writing',
    description: 'Storytelling and creative content generation',
    initialContext: [
      'This is a creative writing project for developing stories and content.',
      'Focus on creativity, narrative flow, and engaging prose.'
    ],
    suggestedTags: ['creative', 'writing', 'storytelling'],
    defaultSettings: {
      temperature: 0.9,
      maxTokens: 8000,
      modelId: 'claude-3-opus',
      systemPrompt: 'You are a creative writing assistant with expertise in storytelling.'
    }
  },
  'data-analysis': {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Statistical analysis and data science workflows',
    initialContext: [
      'This is a data analysis project for processing and interpreting datasets.',
      'Focus on statistical accuracy and clear visualizations.'
    ],
    suggestedTags: ['data', 'analysis', 'statistics', 'science'],
    defaultSettings: {
      temperature: 0.2,
      maxTokens: 5000,
      modelId: 'gpt-4o',
      systemPrompt: 'You are a data scientist assistant specializing in statistical analysis.'
    }
  }
};

export class FirebaseProjectsManager {
  private unsubscribes: Map<string, () => void> = new Map();

  /**
   * Create a new project
   */
  async createProject(
    userId: string,
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Project> {
    const projectRef = doc(collection(db, 'projects'));
    
    const schema: ProjectSchema = {
      name: projectData.name,
      description: projectData.description,
      owner: userId,
      collaborators: projectData.collaborators || [],
      sessions: [],
      contextTokens: 0,
      assetCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      isPublic: projectData.isPublic || false,
      isArchived: false,
      tags: projectData.tags || [],
      template: projectData.template,
      activeCollaborators: [],
      version: 1,
      lastModifiedBy: userId
    };

    await setDoc(projectRef, schema);

    // Initialize with template if specified
    if (projectData.template && PROJECT_TEMPLATES[projectData.template]) {
      await this.initializeFromTemplate(projectRef.id, projectData.template, userId);
    }

    return {
      id: projectRef.id,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    } as Project;
  }

  /**
   * Get projects for a user
   */
  async getUserProjects(
    userId: string,
    options: {
      includeArchived?: boolean;
      includePublic?: boolean;
      limit?: number;
      tags?: string[];
    } = {}
  ): Promise<Project[]> {
    let projectsQuery = query(
      collection(db, 'projects'),
      where('owner', '==', userId),
      orderBy('lastActivity', 'desc')
    );

    if (options.limit) {
      projectsQuery = query(projectsQuery, limit(options.limit));
    }

    const snapshot = await getDocs(projectsQuery);
    const projects: Project[] = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as ProjectSchema;
      
      // Apply filters
      if (!options.includeArchived && data.isArchived) continue;
      if (options.tags?.length && !options.tags.some(tag => data.tags.includes(tag))) continue;

      projects.push(this.transformProjectData(docSnapshot.id, data));
    }

    // Include public projects if requested
    if (options.includePublic) {
      const publicQuery = query(
        collection(db, 'projects'),
        where('isPublic', '==', true),
        orderBy('lastActivity', 'desc'),
        limit(20)
      );
      
      const publicSnapshot = await getDocs(publicQuery);
      for (const docSnapshot of publicSnapshot.docs) {
        const data = docSnapshot.data() as ProjectSchema;
        if (data.owner !== userId) { // Don't duplicate user's own projects
          projects.push(this.transformProjectData(docSnapshot.id, data));
        }
      }
    }

    return projects;
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    
    if (!projectDoc.exists()) {
      return null;
    }

    return this.transformProjectData(projectId, projectDoc.data() as ProjectSchema);
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<Project>
  ): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    
    const updateData: Partial<ProjectSchema> = {
      ...updates,
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      lastModifiedBy: userId,
      version: increment(1)
    };

    await updateDoc(projectRef, updateData);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, permanent: boolean = false): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);

    if (permanent) {
      const batch = writeBatch(db);
      
      // Delete context items
      const contextSnapshot = await getDocs(
        collection(db, 'projects', projectId, 'context')
      );
      contextSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete assets
      const assetsSnapshot = await getDocs(
        collection(db, 'projects', projectId, 'assets')
      );
      assetsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete project
      batch.delete(projectRef);
      
      await batch.commit();
    } else {
      // Soft delete
      await updateDoc(projectRef, {
        isArchived: true,
        updatedAt: serverTimestamp()
      });
    }
  }

  /**
   * Add collaborator to project
   */
  async addCollaborator(
    projectId: string,
    userId: string,
    collaboratorId: string
  ): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    
    await updateDoc(projectRef, {
      collaborators: arrayUnion(collaboratorId),
      updatedAt: serverTimestamp(),
      lastModifiedBy: userId
    });
  }

  /**
   * Remove collaborator from project
   */
  async removeCollaborator(
    projectId: string,
    userId: string,
    collaboratorId: string
  ): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    
    await updateDoc(projectRef, {
      collaborators: arrayRemove(collaboratorId),
      updatedAt: serverTimestamp(),
      lastModifiedBy: userId
    });
  }

  /**
   * Subscribe to project changes
   */
  subscribeToProject(
    projectId: string,
    callback: (project: Project | null) => void
  ): () => void {
    const projectRef = doc(db, 'projects', projectId);
    
    const unsubscribe = onSnapshot(projectRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const project = this.transformProjectData(projectId, docSnapshot.data() as ProjectSchema);
        callback(project);
      } else {
        callback(null);
      }
    });

    this.unsubscribes.set(projectId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to user's projects
   */
  subscribeToUserProjects(
    userId: string,
    callback: (projects: Project[]) => void
  ): () => void {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('owner', '==', userId),
      orderBy('lastActivity', 'desc')
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as ProjectSchema;
        projects.push(this.transformProjectData(doc.id, data));
      });
      callback(projects);
    });

    return unsubscribe;
  }

  /**
   * Update user presence in project
   */
  async updateUserPresence(
    projectId: string,
    userId: string,
    userName: string,
    cursor?: { sessionId?: string; messageId?: string }
  ): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    
    // First, remove user from active collaborators
    const projectDoc = await getDoc(projectRef);
    if (projectDoc.exists()) {
      const data = projectDoc.data() as ProjectSchema;
      const activeCollaborators = (data.activeCollaborators || [])
        .filter(collab => collab.userId !== userId);
      
      // Add user with updated presence
      activeCollaborators.push({
        userId,
        userName,
        lastSeen: serverTimestamp(),
        cursor
      });

      await updateDoc(projectRef, {
        activeCollaborators,
        lastActivity: serverTimestamp()
      });
    }
  }

  /**
   * Remove user presence from project
   */
  async removeUserPresence(projectId: string, userId: string): Promise<void> {
    const projectRef = doc(db, 'projects', projectId);
    
    const projectDoc = await getDoc(projectRef);
    if (projectDoc.exists()) {
      const data = projectDoc.data() as ProjectSchema;
      const activeCollaborators = (data.activeCollaborators || [])
        .filter(collab => collab.userId !== userId);

      await updateDoc(projectRef, {
        activeCollaborators
      });
    }
  }

  /**
   * Context management
   */
  async addContextItem(
    projectId: string,
    userId: string,
    contextData: Omit<ContextItemSchema, 'createdAt' | 'editedBy' | 'editedAt'>
  ): Promise<string> {
    const contextRef = doc(collection(db, 'projects', projectId, 'context'));
    
    const contextItem: ContextItemSchema = {
      ...contextData,
      createdAt: serverTimestamp(),
      editedBy: userId,
      editedAt: serverTimestamp()
    };

    await setDoc(contextRef, contextItem);

    // Update project token count
    await updateDoc(doc(db, 'projects', projectId), {
      contextTokens: increment(contextData.tokens),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      lastModifiedBy: userId
    });

    return contextRef.id;
  }

  async updateContextItem(
    projectId: string,
    contextId: string,
    userId: string,
    updates: Partial<ContextItemSchema>
  ): Promise<void> {
    const contextRef = doc(db, 'projects', projectId, 'context', contextId);
    
    await updateDoc(contextRef, {
      ...updates,
      editedBy: userId,
      editedAt: serverTimestamp()
    });
  }

  async deleteContextItem(projectId: string, contextId: string, userId: string): Promise<void> {
    const contextRef = doc(db, 'projects', projectId, 'context', contextId);
    
    // Get token count before deletion
    const contextDoc = await getDoc(contextRef);
    const tokens = contextDoc.exists() ? contextDoc.data()?.tokens || 0 : 0;
    
    await deleteDoc(contextRef);

    // Update project token count
    await updateDoc(doc(db, 'projects', projectId), {
      contextTokens: increment(-tokens),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      lastModifiedBy: userId
    });
  }

  /**
   * Asset management
   */
  async addAsset(
    projectId: string,
    userId: string,
    assetData: Omit<ProjectAssetSchema, 'uploadedAt' | 'uploadedBy' | 'version' | 'accessCount'>
  ): Promise<string> {
    const assetRef = doc(collection(db, 'projects', projectId, 'assets'));
    
    const asset: ProjectAssetSchema = {
      ...assetData,
      uploadedAt: serverTimestamp(),
      uploadedBy: userId,
      version: 1,
      accessCount: 0
    };

    await setDoc(assetRef, asset);

    // Update project asset count
    await updateDoc(doc(db, 'projects', projectId), {
      assetCount: increment(1),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      lastModifiedBy: userId
    });

    return assetRef.id;
  }

  /**
   * Enable offline support
   */
  async enableOffline(): Promise<void> {
    await disableNetwork(db);
  }

  /**
   * Disable offline support
   */
  async disableOffline(): Promise<void> {
    await enableNetwork(db);
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes.clear();
  }

  // Private helper methods

  private transformProjectData(id: string, data: ProjectSchema): Project {
    return {
      id,
      name: data.name,
      description: data.description,
      owner: data.owner,
      collaborators: data.collaborators || [],
      sessions: [], // Would need to fetch separately
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      isPublic: data.isPublic || false,
      isArchived: data.isArchived || false,
      tags: data.tags || [],
      contextTokens: data.contextTokens || 0,
      assetCount: data.assetCount || 0,
      template: data.template,
      version: data.version || 1,
      activeCollaborators: data.activeCollaborators?.map(collab => ({
        ...collab,
        lastSeen: collab.lastSeen?.toDate() || new Date()
      })) || []
    } as Project;
  }

  private async initializeFromTemplate(
    projectId: string,
    templateId: string,
    userId: string
  ): Promise<void> {
    const template = PROJECT_TEMPLATES[templateId];
    if (!template) return;

    const batch = writeBatch(db);

    // Add initial context items
    if (template.initialContext) {
      for (let i = 0; i < template.initialContext.length; i++) {
        const contextRef = doc(collection(db, 'projects', projectId, 'context'));
        const contextItem: ContextItemSchema = {
          content: template.initialContext[i],
          type: 'reference',
          priority: 90 - i * 5,
          tokens: this.estimateTokens(template.initialContext[i]),
          source: 'template',
          createdAt: serverTimestamp(),
          editedBy: userId,
          editedAt: serverTimestamp(),
          tags: ['template', ...template.suggestedTags],
          compressed: false
        };
        batch.set(contextRef, contextItem);
      }
    }

    await batch.commit();
  }

  private estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    const characters = text.length;
    return Math.ceil(Math.max(words * 1.3, characters / 3.5));
  }
}

// Export singleton instance
export const firebaseProjectsManager = new FirebaseProjectsManager();

// Utility functions
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Project name must be less than 100 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(name)) {
    return { valid: false, error: 'Project name contains invalid characters' };
  }
  
  return { valid: true };
}

export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function calculateProjectHealth(project: Project): {
  score: number; // 0-100
  factors: {
    activity: number;
    contextUtilization: number;
    collaboration: number;
    organization: number;
  };
  recommendations: string[];
} {
  const factors = {
    activity: 0,
    contextUtilization: 0,
    collaboration: 0,
    organization: 0
  };

  const recommendations: string[] = [];

  // Activity score (based on last update)
  const daysSinceUpdate = (Date.now() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  factors.activity = Math.max(0, 100 - daysSinceUpdate * 5);
  
  if (daysSinceUpdate > 7) {
    recommendations.push('Project has been inactive for over a week');
  }

  // Context utilization (sweet spot around 60-80%)
  const utilizationPercent = (project.contextTokens || 0) / 200000 * 100;
  if (utilizationPercent < 20) {
    factors.contextUtilization = utilizationPercent * 2; // Penalty for underuse
    recommendations.push('Consider adding more context to improve AI responses');
  } else if (utilizationPercent > 90) {
    factors.contextUtilization = (100 - utilizationPercent) * 10; // Penalty for overuse
    recommendations.push('Context is nearly full - consider optimization');
  } else {
    factors.contextUtilization = 100;
  }

  // Collaboration score
  const collaboratorCount = project.collaborators?.length || 0;
  const activeCollaborators = project.activeCollaborators?.length || 0;
  factors.collaboration = Math.min(100, (collaboratorCount * 20) + (activeCollaborators * 30));

  if (collaboratorCount === 0) {
    recommendations.push('Consider adding collaborators to improve productivity');
  }

  // Organization score (tags, description, structure)
  let orgScore = 0;
  if (project.description) orgScore += 30;
  if (project.tags && project.tags.length > 0) orgScore += 40;
  if (project.assetCount && project.assetCount > 0) orgScore += 30;
  factors.organization = orgScore;

  if (!project.description) {
    recommendations.push('Add a project description to improve organization');
  }
  if (!project.tags || project.tags.length === 0) {
    recommendations.push('Add tags to categorize and find this project easily');
  }

  const averageScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / 4;

  return {
    score: Math.round(averageScore),
    factors,
    recommendations: recommendations.slice(0, 3) // Limit to top 3 recommendations
  };
}