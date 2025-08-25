'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, FolderOpen, Plus, Search, Settings, Trash2,
  ChevronRight, ChevronDown, Hash, Clock, Star, Archive,
  GitBranch, Download, Upload, Sparkles, Users, Zap
} from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import type { Conversation } from '@/lib/stores/chat';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ChatSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  const {
    conversations,
    projects,
    activeConversationId,
    activeProjectId,
    createConversation,
    createProject,
    setActiveConversation,
    setActiveProject,
    deleteConversation,
    searchConversations,
    getRecentConversations
  } = useChatStore();

  // Group conversations by time
  const groupedConversations = useMemo(() => {
    const filtered = searchQuery
      ? searchConversations(searchQuery)
      : Object.values(conversations);

    const groups = {
      today: [] as typeof filtered,
      yesterday: [] as typeof filtered,
      thisWeek: [] as typeof filtered,
      older: [] as typeof filtered,
    };

    filtered.forEach(conv => {
      const date = new Date(conv.updatedAt);
      if (isToday(date)) {
        groups.today.push(conv);
      } else if (isYesterday(date)) {
        groups.yesterday.push(conv);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    // Sort each group by most recent first
    Object.values(groups).forEach(group => 
      group.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );

    return groups;
  }, [conversations, searchQuery, searchConversations]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleCreateProject = () => {
    const name = prompt('Project name:');
    if (name?.trim()) {
      createProject(name.trim());
    }
  };

  return (
    <motion.aside
      initial={{ x: -320 }}
      animate={{ x: 0, width: isCollapsed ? 60 : 320 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        "h-screen bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-black/95",
        "border-r border-white/10 backdrop-blur-xl",
        "flex flex-col overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-white">EXPREZZZO</span>
              <span className="text-xs text-purple-400 font-medium">POWER</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronRight className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              !isCollapsed && "rotate-180"
            )} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg
                         text-sm text-white placeholder-gray-500 focus:outline-none
                         focus:border-purple-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 flex gap-2 border-b border-white/10">
            <button
              onClick={() => createConversation()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2
                       bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                       text-white rounded-lg transition-all shadow-lg hover:shadow-purple-500/25"
              title="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Chat</span>
            </button>
            <button
              onClick={handleCreateProject}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
              title="Create new project"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-all"
              title="Team features (coming soon)"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Projects Section */}
          {Object.keys(projects).length > 0 && (
            <div className="p-3 border-b border-white/10">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Projects</div>
              {Object.values(projects).map(project => (
                <div key={project.id} className="mb-1">
                  <button
                    onClick={() => toggleProject(project.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all",
                      "hover:bg-white/5 text-left",
                      activeProjectId === project.id && "bg-white/10"
                    )}
                  >
                    <ChevronRight className={cn(
                      "w-3 h-3 text-gray-500 transition-transform",
                      expandedProjects.has(project.id) && "rotate-90"
                    )} />
                    <FolderOpen className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-300 truncate">{project.name}</span>
                    <span className="ml-auto text-xs text-gray-600">
                      {project.conversations.length}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {expandedProjects.has(project.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-6 overflow-hidden"
                      >
                        {project.conversations.map(convId => {
                          const conv = conversations[convId];
                          if (!conv) return null;
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setActiveConversation(conv.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1 rounded text-left",
                                "hover:bg-white/5 transition-all",
                                activeConversationId === conv.id && "bg-white/10"
                              )}
                            >
                              <MessageSquare className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-400 truncate">{conv.title}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Today */}
            {groupedConversations.today.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Today</div>
                {groupedConversations.today.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))}
              </div>
            )}

            {/* Yesterday */}
            {groupedConversations.yesterday.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Yesterday</div>
                {groupedConversations.yesterday.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))}
              </div>
            )}

            {/* This Week */}
            {groupedConversations.thisWeek.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">This Week</div>
                {groupedConversations.thisWeek.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))}
              </div>
            )}

            {/* Older */}
            {groupedConversations.older.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Older</div>
                {groupedConversations.older.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {Object.keys(conversations).length === 0 && !searchQuery && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">No conversations yet</p>
                <button
                  onClick={() => createConversation()}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Start your first chat
                </button>
              </div>
            )}

            {/* No Search Results */}
            {searchQuery && Object.values(groupedConversations).every(group => group.length === 0) && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No conversations found</p>
                <p className="text-xs text-gray-600 mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <button 
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              title="Export conversations"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              title="Import conversations"
            >
              <Upload className="w-3 h-3" />
              Import
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              title="Archive old conversations"
            >
              <Archive className="w-3 h-3" />
              Archive
            </button>
          </div>
        </>
      )}
    </motion.aside>
  );
}

// Conversation Item Component
function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false);
  const { branchConversation } = useChatStore();

  const handleBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      branchConversation(conversation.id, lastMessage.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDelete();
    }
  };
  
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left group mb-1",
        "hover:bg-white/5",
        isActive && "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20"
      )}
    >
      <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-300 truncate">{conversation.title}</div>
        <div className="text-xs text-gray-600">
          {conversation.messages.length} messages • {format(new Date(conversation.updatedAt), 'HH:mm')}
        </div>
      </div>
      
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={handleBranch}
              className="p-1 hover:bg-white/10 rounded"
              title="Branch conversation"
            >
              <GitBranch className="w-3 h-3 text-gray-500" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-500/20 rounded"
              title="Delete conversation"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}