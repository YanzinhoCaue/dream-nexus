import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, X, Image as ImageIcon, Zap } from 'lucide-react';

const DreamNode = ({ data, id }) => {
  
  // Função auxiliar para os botões
  const AddButton = ({ positionClass, direction }) => (
    <button 
      className={`nodrag absolute ${positionClass} bg-black border border-cyan-500/50 text-cyan-500 p-1 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.2)] hover:bg-cyan-500 hover:text-black hover:scale-110 transition-all z-50 opacity-0 group-hover:opacity-100 cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation(); // Impede que o clique passe para o card
        e.preventDefault();
        console.log(`Botão ${direction} clicado no nó ${id}`); // Debug no console
        
        if (data.onAdd) {
            data.onAdd(id, direction);
        } else {
            console.error('ERRO: Função onAdd não foi passada para este nó!');
        }
      }}
      title={`Add ${direction}`}
    >
      <Plus size={14} />
    </button>
  );

  return (
    <div className="relative group">
      {/* Handles (Conectores) */}
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2 !border-0 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2 !border-0 opacity-0" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2 !border-0 opacity-0" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-2 !h-2 !border-0 opacity-0" />

      {/* BOTÕES COM A CLASSE NODRAG (CORREÇÃO AQUI) */}
      <AddButton positionClass="-top-4 left-1/2 -translate-x-1/2" direction="UP" />
      <AddButton positionClass="-bottom-4 left-1/2 -translate-x-1/2" direction="DOWN" />
      <AddButton positionClass="-left-4 top-1/2 -translate-y-1/2" direction="LEFT" />
      <AddButton positionClass="-right-4 top-1/2 -translate-y-1/2" direction="RIGHT" />

      {/* Card Principal */}
      <div 
        className="w-72 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-lg overflow-hidden transition-all duration-300
                   hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] group-hover:z-40 cursor-move
                   shadow-[0_0_10px_rgba(0,229,255,0.05)] relative"
        onClick={() => data.onNodeClick(data)}
      >
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
          
          <button 
            className="nodrag absolute top-2 right-2 bg-red-500/20 hover:bg-red-600 border border-red-500 text-red-100 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
          >
            <X size={14} />
          </button>

          <div className="absolute bottom-2 right-2 bg-black/80 border border-cyan-500/50 px-2 py-0.5 rounded text-[10px] text-cyan-400 font-oxanium font-bold tracking-wider pointer-events-none">
            {data.progress || 0}%
          </div>
        </div>

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
    </div>
  );
};

export default memo(DreamNode);