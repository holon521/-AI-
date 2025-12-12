
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useZiaOS } from './hooks/useZiaOS';
import { PYTHON_WORKER_SCRIPT } from './03_NERVES/zia_worker_script'; 

// Components
import { Header } from './components/layout/Header';
import { LeftPanel } from './components/layout/LeftPanel';
import { RightPanel } from './components/layout/RightPanel';
import { ChatInterface } from './components/features/ChatInterface';
import { SettingsModal } from './components/features/SettingsModal';
import { ArtifactCanvas } from './components/features/ArtifactCanvas';
import { BlueprintViewer } from './components/shared/BlueprintViewer';
import { RemoteDesktop } from './components/shared/RemoteDesktop';

const App = () => {
  // Use the OS Kernel Hook
  const os = useZiaOS();
  
  // UI-only state
  const [showSpec, setShowSpec] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');

  if (os.showRemoteDesktop && os.remoteUrl) {
      return <RemoteDesktop url={os.remoteUrl} onClose={() => os.setShowRemoteDesktop(false)} />;
  }

  // --- DYNAMIC THEMING ENGINE ---
  const getThemeColors = () => {
      switch (os.systemDNA.themeColor) {
          case 'emerald': return 'selection:bg-emerald-500/30';
          case 'rose': return 'selection:bg-rose-500/30';
          case 'violet': return 'selection:bg-violet-500/30';
          case 'cyan': default: return 'selection:bg-cyan-500/30';
      }
  };

  const getLayoutClasses = () => {
      // Polymorphic Layout logic
      const base = "flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden transition-colors duration-700";
      if (os.systemDNA.layoutMode === 'CODER') return `${base} font-mono bg-[#0d1117]`; 
      if (os.systemDNA.layoutMode === 'WRITER') return `${base} font-serif bg-[#1c1917]`;
      return base;
  };

  return (
    <div className={`${getLayoutClasses()} ${getThemeColors()}`}>
      <Header 
        isSwarmActive={os.isSwarmActive} 
        onShowSettings={() => setShowSettings(true)} 
        onShowSpec={() => setShowSpec(true)} 
      />
      
      {os.systemDNA.layoutMode !== 'FOCUS' && (
          <LeftPanel nodes={os.graphNodes} />
      )}
      
      <ChatInterface 
        messages={os.messages} 
        isThinking={os.isThinking} 
        onSendMessage={(text, attachment) => os.handleSendMessage(text, attachment, () => setShowSettings(true))}
        isMuted={os.isMuted}
        onToggleMute={() => os.setIsMuted(!os.isMuted)}
      />
      
      {os.systemDNA.layoutMode !== 'FOCUS' && os.systemDNA.layoutMode !== 'WRITER' && (
          <RightPanel 
            memoryStats={os.memoryStats} 
            activeSectors={os.activeSectors} 
            isSwarmActive={os.isSwarmActive} 
            swarmMemoryStatus={os.swarmMemoryStatus} 
            swarmVectorCount={os.swarmVectorCount} 
          />
      )}
      
      <ArtifactCanvas 
        isOpen={os.showCanvas || os.systemDNA.layoutMode === 'CODER'} // Auto-open in Coder mode if content exists
        content={os.canvasContent} 
        visualArtifact={os.visualArtifact} 
        onClose={() => os.setShowCanvas(false)} 
        onSignal={os.handleArtifactSignal} // [NEW] Bi-directional Bridge
      />
      
      <BlueprintViewer isOpen={showSpec} onClose={() => setShowSpec(false)} />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        clientId={googleClientId} 
        setClientId={setGoogleClientId}
        apiKey={os.apiKey} 
        setApiKey={os.setApiKey}
        activeModel={os.activeModel}
        setActiveModel={os.setActiveModel}
        isDriveConnected={os.isDriveConnected} 
        onSimulateConnection={() => os.setIsDriveConnected(true)}
        onDisconnect={() => os.setIsDriveConnected(false)}
        onGetScript={() => { os.setCanvasContent(PYTHON_WORKER_SCRIPT); os.setShowCanvas(true); }}
        onCloudBackup={os.handleCloudBackup} 
        onCloudRestore={os.handleCloudRestore}
        onTestBrain={os.testBrainConnection}
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
