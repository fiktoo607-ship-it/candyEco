"use client";

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Check if already in standalone mode
    const standaloneMode =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser from automatically showing the prompt
      e.preventDefault();
      // Store prompt event
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsReadyToInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsReadyToInstall(false);
      setIsStandalone(true);
      console.log('App was successfully installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Trigger prompt
    await deferredPrompt.prompt();

    // Check user decision
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice: ${outcome}`);

    // Clear deferred prompt
    setDeferredPrompt(null);
    setIsReadyToInstall(false);
  };

  // Render nothing if already installed or prompt hasn't fired
  if (isStandalone || !isReadyToInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className="inline-flex items-center gap-xs rounded-full border border-primary/20 bg-primary/5 px-md py-sm text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-all duration-200 select-none cursor-pointer"
    >
      <span className="material-symbols-outlined text-base select-none notranslate" translate="no">
        download
      </span>
      Installer
    </button>
  );
}
