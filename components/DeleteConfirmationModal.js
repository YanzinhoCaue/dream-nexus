import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, projectTitle }) => {
  const [typedName, setTypedName] = useState('');

  if (!isOpen) return null;

  const isMatch = typedName === projectTitle;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0a0505] w-full max-w-md rounded-lg border border-red-900/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden relative">
        
        {/* Header de Perigo */}
        <div className="bg-red-950/30 p-6 border-b border-red-900/30 flex items-center gap-4">
            <div className="p-3 bg-red-900/20 rounded-full border border-red-500/50">
                <AlertTriangle className="text-red-500" size={32} />
            </div>
            <div>
                <h2 className="text-white font-oxanium font-bold text-xl uppercase tracking-wider">Danger Zone</h2>
                <p className="text-red-400 text-xs uppercase tracking-widest">Irreversible Action</p>
            </div>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-6">
            <p className="text-gray-400 text-sm leading-relaxed">
                This action cannot be undone. This will permanently delete the dream protocol <strong className="text-white">"{projectTitle}"</strong> and all associated neural data.
            </p>

            <div className="space-y-2">
                <label className="text-[10px] text-red-500 uppercase tracking-widest font-bold">
                    Type <span className="text-white select-all">"{projectTitle}"</span> to confirm:
                </label>
                <input 
                    type="text" 
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full bg-black border border-red-900 focus:border-red-500 text-white p-3 rounded font-mono text-sm focus:outline-none focus:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all"
                    placeholder={projectTitle}
                    onPaste={(e) => e.preventDefault()} // Bloqueia colar para forçar digitar (opcional, mas mais seguro)
                />
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-red-950/20 border-t border-red-900/30 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:text-white font-oxanium text-sm uppercase tracking-wider transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => {
                    if (isMatch) {
                        onConfirm();
                        setTypedName('');
                    }
                }}
                disabled={!isMatch}
                className={`px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold font-oxanium text-sm uppercase tracking-widest flex items-center gap-2 rounded transition-all ${!isMatch ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-[0_0_20px_#dc2626]'}`}
            >
                <Trash2 size={16} /> Delete Forever
            </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;