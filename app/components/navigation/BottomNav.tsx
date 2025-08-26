'use client';

import { useState } from 'react';
import { MessageSquare, Clock, Brain, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TouchButton } from '../ui/TouchButton';

interface BottomNavigationProps {
  onTabChange?: (tabId: string) => void;
  activeTab?: string;
}

export function BottomNavigation({ onTabChange, activeTab: controlledActiveTab }: BottomNavigationProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('chat');
  
  // Use controlled or internal state
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const tabs = [
    { 
      id: 'chat', 
      icon: MessageSquare, 
      label: 'Chat',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50' 
    },
    { 
      id: 'history', 
      icon: Clock, 
      label: 'History',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50' 
    },
    { 
      id: 'models', 
      icon: Brain, 
      label: 'Models',
      color: 'text-green-600',
      bgColor: 'bg-green-50' 
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50' 
    }
  ];

  const handleTabClick = (tabId: string) => {
    if (!controlledActiveTab) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
    console.log('Bottom nav tab changed:', tabId);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 z-40 md:hidden mobile-bottom-nav"
    >
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <TouchButton
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 flex-1 rounded-none",
                "min-h-[56px] transition-all duration-200 relative",
                isActive 
                  ? "text-purple-400" 
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-full" />
              )}
              
              {/* Icon with background for active state */}
              <div className={cn(
                "rounded-lg p-1.5 transition-all duration-200 mb-1",
                isActive ? "bg-purple-500/20 scale-110" : ""
              )}>
                <Icon size={18} />
              </div>
              
              {/* Label */}
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                isActive ? "text-purple-300" : ""
              )}>
                {tab.label}
              </span>
              
              {/* Subtle glow effect for active tab */}
              {isActive && (
                <div className="absolute inset-0 rounded-lg bg-purple-500/5 -z-10" />
              )}
            </TouchButton>
          );
        })}
      </div>
      
      {/* Optional: Add EXPREZZZO branding */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-gray-300 tracking-wider">EXPREZZZO</span>
      </div>
    </nav>
  );
}

// Export default for easier imports
export default BottomNavigation;