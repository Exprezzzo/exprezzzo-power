// app/api/projects/route.ts
// CRUD operations for Claude-style Projects with 200K token context management

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { 
  Project, 
  ProjectAsset, 
  ProjectContext,
  APIResponse 
} from '@/types/ai-playground';

export const runtime = 'nodejs';

const MAX_CONTEXT_TOKENS = 200000; // 200K token limit
const SUMMARIZATION_THRESHOLD = 180000; // Start summarizing at 180K tokens

interface CreateProjectRequest {
  name: string;
  description?: string;
  template?: string;
  initialContext?: string[];
  assets?: ProjectAsset[];
  isPublic?: boolean;
  tags?: string[];
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  archived?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includePublic = searchParams.get('includePublic') === 'true';
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User ID required' }
      } as APIResponse, { status: 401 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    let projectsQuery = db.collection('projects');

    // Build query based on parameters
    if (!includePublic) {
      projectsQuery = projectsQuery.where('owner', '==', userId);
    } else {
      projectsQuery = projectsQuery.where('isPublic', '==', true);
    }

    if (tags.length > 0) {
      projectsQuery = projectsQuery.where('tags', 'array-contains-any', tags);
    }

    // Order by most recently updated
    projectsQuery = projectsQuery.orderBy('updatedAt', 'desc').limit(limit);

    const snapshot = await projectsQuery.get();
    const projects: Project[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Filter by search term if provided
      if (search && !data.name.toLowerCase().includes(search.toLowerCase()) &&
          !data.description?.toLowerCase().includes(search.toLowerCase())) {
        continue;
      }

      // Get project context summary
      const contextSnapshot = await db.collection('projects')
        .doc(doc.id)
        .collection('context')
        .orderBy('priority', 'desc')
        .limit(5)
        .get();

      const contextSummary = contextSnapshot.docs.map(contextDoc => ({
        id: contextDoc.id,
        ...contextDoc.data()
      }));

      projects.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        owner: data.owner,
        collaborators: data.collaborators || [],
        sessions: data.sessions || [],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        isPublic: data.isPublic || false,
        tags: data.tags || [],
        contextTokens: data.contextTokens || 0,
        contextSummary: contextSummary,
        assetCount: data.assetCount || 0,
        template: data.template
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        projects,
        totalCount: projects.length,
        hasMore: projects.length === limit
      },
      metadata: {
        requestId: `projects_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch projects'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectRequest = await request.json();
    const { name, description, template, initialContext, assets, isPublic, tags } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Project name is required' }
      } as APIResponse, { status: 400 });
    }

    // Get user ID from authorization header or request
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
      } as APIResponse, { status: 401 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    const projectRef = db.collection('projects').doc();

    // Calculate initial context tokens
    let initialTokens = 0;
    if (initialContext && initialContext.length > 0) {
      initialTokens = estimateTokens(initialContext.join('\n'));
    }

    // Create project data
    const projectData: Partial<Project> = {
      name: name.trim(),
      description: description?.trim(),
      owner: userId,
      collaborators: [],
      sessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: isPublic || false,
      tags: tags || [],
      contextTokens: initialTokens,
      assetCount: assets?.length || 0,
      template: template
    };

    // Create project
    await projectRef.set(projectData);

    // Add initial context if provided
    if (initialContext && initialContext.length > 0) {
      const contextBatch = db.batch();
      
      initialContext.forEach((content, index) => {
        const contextRef = projectRef.collection('context').doc();
        contextBatch.set(contextRef, {
          content,
          type: 'initial',
          priority: 100 - index, // Higher priority for earlier items
          tokens: estimateTokens(content),
          createdAt: new Date(),
          source: 'user'
        });
      });

      await contextBatch.commit();
    }

    // Add initial assets if provided
    if (assets && assets.length > 0) {
      const assetBatch = db.batch();
      
      assets.forEach(asset => {
        const assetRef = projectRef.collection('assets').doc();
        assetBatch.set(assetRef, {
          ...asset,
          uploadedAt: new Date(),
          uploadedBy: userId
        });
      });

      await assetBatch.commit();
    }

    // Get the created project
    const createdProject = await projectRef.get();
    const project: Project = {
      id: createdProject.id,
      ...createdProject.data() as Partial<Project>
    } as Project;

    return NextResponse.json({
      success: true,
      data: project,
      metadata: {
        requestId: `create_project_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create project'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_PROJECT_ID', message: 'Project ID is required' }
      } as APIResponse, { status: 400 });
    }

    const body: UpdateProjectRequest = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
      } as APIResponse, { status: 401 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    const projectRef = db.collection('projects').doc(projectId);

    // Check if project exists and user has permission
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      } as APIResponse, { status: 404 });
    }

    const projectData = projectDoc.data();
    if (projectData?.owner !== userId && !projectData?.collaborators?.includes(userId)) {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to update this project' }
      } as APIResponse, { status: 403 });
    }

    // Update project
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    await projectRef.update(updateData);

    // Get updated project
    const updatedProject = await projectRef.get();
    const project: Project = {
      id: updatedProject.id,
      ...updatedProject.data() as Partial<Project>
    } as Project;

    return NextResponse.json({
      success: true,
      data: project,
      metadata: {
        requestId: `update_project_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update project'
      }
    } as APIResponse, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const permanent = searchParams.get('permanent') === 'true';
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_PROJECT_ID', message: 'Project ID is required' }
      } as APIResponse, { status: 400 });
    }

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
      } as APIResponse, { status: 401 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      throw new Error('Firebase admin not initialized');
    }

    const db = getFirestore(adminApp);
    const projectRef = db.collection('projects').doc(projectId);

    // Check if project exists and user has permission
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      } as APIResponse, { status: 404 });
    }

    const projectData = projectDoc.data();
    if (projectData?.owner !== userId) {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only project owner can delete projects' }
      } as APIResponse, { status: 403 });
    }

    if (permanent) {
      // Permanently delete project and all subcollections
      const batch = db.batch();

      // Delete context
      const contextSnapshot = await projectRef.collection('context').get();
      contextSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete assets
      const assetsSnapshot = await projectRef.collection('assets').get();
      assetsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete sessions
      const sessionsSnapshot = await projectRef.collection('sessions').get();
      sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete project
      batch.delete(projectRef);

      await batch.commit();

    } else {
      // Soft delete - mark as archived
      await projectRef.update({
        archived: true,
        archivedAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      data: { 
        projectId, 
        deleted: permanent,
        archived: !permanent
      },
      metadata: {
        requestId: `delete_project_${Date.now()}`,
        timestamp: new Date()
      }
    } as APIResponse);

  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete project'
      }
    } as APIResponse, { status: 500 });
  }
}

// Helper function to estimate token count
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // More accurate for code and structured content
  const words = text.split(/\s+/).length;
  const characters = text.length;
  
  // Use a more conservative estimate
  return Math.ceil(Math.max(words * 1.3, characters / 3.5));
}
// 
// // Helper function to check if context needs summarization
// async function checkContextLimits(projectId: string): Promise<{
//   needsSummarization: boolean;
//   currentTokens: number;
//   exceedsLimit: boolean;
// }> {
//   const adminApp = getAdminApp();
//   if (!adminApp) {
//     throw new Error('Firebase admin not initialized');
//   }
// 
//   const db = getFirestore(adminApp);
//   const projectRef = db.collection('projects').doc(projectId);
//   const projectDoc = await projectRef.get();
//   
//   if (!projectDoc.exists) {
//     throw new Error('Project not found');
//   }
// 
//   const currentTokens = projectDoc.data()?.contextTokens || 0;
//   
//   return {
//     needsSummarization: currentTokens >= SUMMARIZATION_THRESHOLD,
//     currentTokens,
//     exceedsLimit: currentTokens >= MAX_CONTEXT_TOKENS
//   };
// }