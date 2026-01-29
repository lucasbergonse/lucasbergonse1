
import React from 'react';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="glass-card rounded-2xl shadow-2xl border border-white/10 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">Instalar Nova Pro</h3>
          <p className="text-xs text-slate-400 mt-1">Acesse rapidamente da sua área de trabalho.</p>
        </div>
        <div className="flex flex-col gap-2">
            <button
                onClick={onInstall}
                className="px-4 py-1.5 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
                Instalar
            </button>
            <button
                onClick={onDismiss}
                className="px-4 py-1.5 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase transition-colors"
            >
                Agora não
            </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
