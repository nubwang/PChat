// src/global.d.ts
interface Window {
  electronAPI: {
    navigate: (path: string, action?: 'push' | 'replace') => void;
    onNavigate: (callback: (data: { path: string; action: string }) => void) => void;
  };
}