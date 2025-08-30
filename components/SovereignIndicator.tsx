/**
 * 🏠 HOUSE PREP: Sovereign Mode Indicator
 * Shows when running with EXPRESSO LLM HOUSE
 * Hidden by default until HOUSE is deployed
 */

'use client';

import { useEffect, useState } from 'react';
import { Shield, Cloud } from 'lucide-react';
import { isSovereignMode } from '@/lib/flags';
import { HouseConnector } from '@/lib/sovereign/house-connector';

export function SovereignIndicator() {
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    if (!isSovereignMode()) return;
    
    const connector = HouseConnector.getInstance();
    setStatus(connector.getStatus());
    
    // Poll status every 5 seconds
    const interval = setInterval(() => {
      setStatus(connector.getStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isSovereignMode() || !status) return null;
  
  return (
    <div className={`
      fixed bottom-4 right-4 p-3 rounded-lg
      ${status.connected 
        ? 'bg-sovereign text-white' 
        : 'bg-gray-500 text-white opacity-50'
      }
      flex items-center gap-2 text-sm
      animate-sovereign-glow
    `}>
      {status.connected ? (
        <>
          <Shield className="w-4 h-4" />
          <span>Sovereign Mode</span>
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4" />
          <span>Cloud Mode (HOUSE Prep)</span>
        </>
      )}
    </div>
  );
}