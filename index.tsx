
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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-cyan-500/30">
      <Header 
        isSwarmActive={os.isSwarmActive} 
        onShowSettings={() => setShowSettings(true)} 
        onShowSpec={() => setShowSpec(true)} 
      />
      
      <LeftPanel nodes={os.graphNodes} />
      
      <ChatInterface 
        messages={os.messages} 
        isThinking={os.isThinking} 
        onSendMessage={(text) => os.handleSendMessage(text, () => setShowSettings(true))} 
      />
      
      <RightPanel 
        memoryStats={os.memoryStats} 
        activeSectors={os.activeSectors} 
        isSwarmActive={os.isSwarmActive} 
        swarmMemoryStatus={os.swarmMemoryStatus} 
        swarmVectorCount={os.swarmVectorCount} 
      />
      
      <ArtifactCanvas 
        isOpen={os.showCanvas} 
        content={os.canvasContent} 
        visualArtifact={os.visualArtifact} 
        onClose={() => os.setShowCanvas(false)} 
      />
      
      <BlueprintViewer isOpen={showSpec} onClose={() => setShowSpec(false)} />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        clientId={googleClientId} 
        setClientId={setGoogleClientId}
        apiKey={os.apiKey} 
        setApiKey={os.setApiKey}
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
