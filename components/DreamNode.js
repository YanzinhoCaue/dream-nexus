import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, X, Image as ImageIcon, Zap } from 'lucide-react';

const DreamNode = ({ data, id }) => {
  return (
    <div className="relative group">
      {/* Conector Superior (Input) - Invisível até passar o mouse */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-cyan-400 !w-3 !h-3 !border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
      />

      {/* O Card do Sonho */}
      <div 
        className="w-72 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-lg overflow-hidden transition-all duration-300
                   hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] group-hover:z-50 cursor-move
                   shadow-[0_0_10px_rgba(0,229,255,0.05)] relative"
        onClick={() => data.onNodeClick(data)}
      >
        {/* Capa da Imagem */}
        <div className="h-40 w-full bg-gray-900 relative border-b border-cyan-500/30 group">
          {data.image ? (
            <img 
              src={data.image} 
              alt={data.label} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-cyan-900 bg-gradient-to-b from-gray-900 to-black pointer-events-none">
              <ImageIcon size={40} className="mb-2 opacity-50" />
            </div>
          )}
          
          {/* Botão Deletar (X) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
            className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-600 border border-red-500 text-red-100 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all z-20"
          >
            <X size={14} />
          </button>

          {/* Badge de Progresso */}
          <div className="absolute bottom-2 right-2 bg-black/80 border border-cyan-500/50 px-2 py-0.5 rounded text-[10px] text-cyan-400 font-oxanium font-bold tracking-wider pointer-events-none">
            {data.progress || 0}%
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-4 bg-gradient-to-b from-black to-cyan-950/20 pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-yellow-400" fill="currentColor" />
                <span className="text-[10px] text-cyan-600 uppercase tracking-widest font-bold">Dream Protocol</span>
            </div>
            <h3 className="text-white font-oxanium font-bold text-lg uppercase tracking-wide truncate">
                {data.label}
            </h3>
        </div>
      </div>

      {/* Botão Adicionar Filho (+) - Só aparece no hover */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-50 pt-2">
        <button 
            onClick={(e) => {
                e.stopPropagation();
                data.onAdd(id);
            }}
            className="bg-black border border-cyan-400 text-cyan-400 p-1.5 rounded-full shadow-[0_0_15px_#00E5FF] hover:bg-cyan-400 hover:text-black transition-colors"
        >
            <Plus size={20} />
        </button>
      </div>

      {/* Conector Inferior (Output) - Invisível até passar o mouse */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-cyan-400 !w-3 !h-3 !border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
      />
    </div>
  );
};

export default memo(DreamNode);