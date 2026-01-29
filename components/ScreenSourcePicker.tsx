
import React from 'react';
import { ScreenSource } from '../types';

interface ScreenSourcePickerProps {
  sources: ScreenSource[];
  onSelect: (sourceId: string) => void;
  onCancel: () => void;
}

const ScreenSourcePicker: React.FC<ScreenSourcePickerProps> = ({ sources, onSelect, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl text-center">
        <h2 className="text-xl font-bold uppercase tracking-widest text-cyan-400">Selecionar Fonte Visual</h2>
        <p className="text-slate-400 mt-2">Escolha uma janela ou tela para compartilhar com o Córtex Visual.</p>
      </div>

      <div className="flex-1 w-full max-w-6xl overflow-y-auto custom-scrollbar p-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sources.map(source => (
            <div
              key={source.id}
              onClick={() => onSelect(source.id)}
              className="group aspect-video rounded-lg overflow-hidden border-2 border-white/10 hover:border-cyan-500/80 bg-[#0B1221] cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 bg-cover bg-center" style={{ backgroundImage: `url(${source.thumbnailURL})` }}></div>
                <div className="p-3 bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                  <p className="text-xs text-slate-300 group-hover:text-cyan-300 truncate font-bold" title={source.name}>
                    {source.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={onCancel}
        className="mt-8 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/20 hover:bg-white/10 text-slate-300 transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
};

export default ScreenSourcePicker;
