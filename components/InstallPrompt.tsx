'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Monitor, Apple, Chrome } from 'lucide-react';
import { VEGAS_THEME_COLORS } from '@/types/ai-playground';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  autoShow?: boolean;
  showDelay?: number;
  className?: string;
}

interface DeviceInfo {
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';
  isMobile: boolean;
  isPWASupported: boolean;
  isStandalone: boolean;
}

const STORAGE_KEY = 'exprezzzo_install_prompt_dismissed';
const SHOW_AFTER_VISITS = 3;
const VISIT_COUNT_KEY = 'exprezzzo_visit_count';

export default function InstallPrompt({
  autoShow = true,
  showDelay = 5000,
  className = ''
}: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    os: 'unknown',
    browser: 'unknown',
    isMobile: false,
    isPWASupported: false,
    isStandalone: false
  });

  // Detect device and browser information
  const detectDevice = useCallback((): DeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        os: 'unknown',
        browser: 'unknown',
        isMobile: false,
        isPWASupported: false,
        isStandalone: false
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    
    // Detect OS
    let os: DeviceInfo['os'] = 'unknown';
    if (/iphone|ipad|ipod/.test(userAgent)) {
      os = 'ios';
    } else if (/android/.test(userAgent)) {
      os = 'android';
    } else if (/win/.test(platform)) {
      os = 'windows';
    } else if (/mac/.test(platform) && !/iphone|ipad|ipod/.test(userAgent)) {
      os = 'macos';
    } else if (/linux/.test(platform)) {
      os = 'linux';
    }

    // Detect browser
    let browser: DeviceInfo['browser'] = 'unknown';
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) {
      browser = 'chrome';
    } else if (/firefox/.test(userAgent)) {
      browser = 'firefox';
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      browser = 'safari';
    } else if (/edge/.test(userAgent)) {
      browser = 'edge';
    }

    // Detect mobile
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                     window.innerWidth <= 768;

    // Check if PWA is supported
    const isPWASupported = 'serviceWorker' in navigator && 
                          ('BeforeInstallPromptEvent' in window || os === 'ios');

    // Check if already installed/standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        ('standalone' in navigator && (navigator as any).standalone) ||
                        document.referrer.includes('android-app://');

    return {
      os,
      browser,
      isMobile,
      isPWASupported,
      isStandalone
    };
  }, []);

  // Check if user has dismissed the prompt
  const isDismissed = useCallback((): boolean => {
    if (typeof localStorage === 'undefined') return false;
    
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) return false;
    
    const dismissedDate = new Date(dismissed);
    const daysSinceDismissed = Math.floor((Date.now() - dismissedDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Show again after 30 days
    return daysSinceDismissed < 30;
  }, []);

  // Track visit count for smart timing
  const trackVisit = useCallback(() => {
    if (typeof localStorage === 'undefined') return 0;
    
    const currentCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    const newCount = currentCount + 1;
    localStorage.setItem(VISIT_COUNT_KEY, newCount.toString());
    
    return newCount;
  }, []);

  // Initialize device info and check conditions
  useEffect(() => {
    const info = detectDevice();
    setDeviceInfo(info);

    // Don't show if already installed or not supported
    if (info.isStandalone || !info.isPWASupported) {
      return;
    }

    // Don't show if recently dismissed
    if (isDismissed()) {
      return;
    }

    // Track visit and check if should show
    const visitCount = trackVisit();
    
    if (!autoShow || visitCount < SHOW_AFTER_VISITS) {
      return;
    }

    // Smart timing - show after delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [autoShow, showDelay, detectDevice, isDismissed, trackVisit]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle native install
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setShowPrompt(false);
      } else {
        console.log('PWA installation dismissed');
      }
    } catch (error) {
      console.error('Error during PWA installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Handle manual dismiss
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  }, []);

  // Get platform-specific instructions
  const getInstallInstructions = (): {
    title: string;
    steps: string[];
    icon: React.ComponentType<any>;
  } => {
    const { os, browser } = deviceInfo;

    if (os === 'ios') {
      return {
        title: 'Install on iPhone/iPad',
        steps: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ],
        icon: Apple
      };
    }

    if (os === 'android' && browser === 'chrome') {
      return {
        title: 'Install on Android',
        steps: [
          'Tap the menu button (⋮) in Chrome',
          'Select "Add to Home screen"',
          'Tap "Add" to install the app'
        ],
        icon: Chrome
      };
    }

    if (browser === 'chrome' || browser === 'edge') {
      return {
        title: 'Install on Desktop',
        steps: [
          'Click the install button in your address bar',
          'Or go to browser menu → "Install Exprezzzo"',
          'Click "Install" to add to your desktop'
        ],
        icon: Monitor
      };
    }

    return {
      title: 'Install App',
      steps: [
        'Look for install prompts in your browser',
        'Add this site to your home screen',
        'Enjoy the app experience!'
      ],
      icon: Download
    };
  };

  if (!showPrompt || deviceInfo.isStandalone) {
    return null;
  }

  const instructions = getInstallInstructions();
  const Icon = instructions.icon;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} className="text-white/70" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: `${VEGAS_THEME_COLORS.primary}20` }}
          >
            <Icon size={32} color={VEGAS_THEME_COLORS.primary} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Install Exprezzzo
          </h2>
          
          <p className="text-white/70 text-sm">
            Get the full app experience with offline support, push notifications, and faster loading.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <span className="text-sm text-white/70">Offline Mode</span>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            </div>
            <span className="text-sm text-white/70">Notifications</span>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
            </div>
            <span className="text-sm text-white/70">Faster Loading</span>
          </div>
          
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
            </div>
            <span className="text-sm text-white/70">Native Feel</span>
          </div>
        </div>

        {/* Install button or instructions */}
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
            style={{
              background: `linear-gradient(45deg, ${VEGAS_THEME_COLORS.primary}, #FFA500)`
            }}
          >
            {isInstalling ? 'Installing...' : 'Install Now'}
          </button>
        ) : (
          <div>
            <h3 className="font-semibold text-white mb-3 text-center">
              {instructions.title}
            </h3>
            
            <ol className="space-y-2 text-sm text-white/80">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: VEGAS_THEME_COLORS.primary, color: '#000' }}
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <button
            onClick={handleDismiss}
            className="text-white/50 text-sm hover:text-white/70 transition-colors"
          >
            Maybe later
          </button>
          
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Smartphone size={12} />
            {deviceInfo.isMobile ? 'Mobile' : 'Desktop'} • {deviceInfo.browser}
          </div>
        </div>
      </div>

      {/* Platform-specific hints */}
      {deviceInfo.os === 'ios' && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-400 text-sm">
            <Apple size={16} />
            Look for the Share button in Safari
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}