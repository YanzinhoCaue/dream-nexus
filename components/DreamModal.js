import React, { useState, useRef } from 'react';
import { X, CheckCircle, Circle, GripVertical, Trash2, ChevronUp, ChevronDown, Plus, Upload, Save } from 'lucide-react';

const DreamModal = ({ isOpen, onClose, nodeData, onSave }) => {
  if (!isOpen || !nodeData) return null;

  const [title, setTitle] = useState(nodeData.label);
  const [steps, setSteps] = useState(nodeData.steps || []);
  const [imagePreview, setImagePreview] = useState(nodeData.image || '');
  const fileInputRef = useRef(null);

  const addStep = () => {
    setSteps([...steps, { id: Date.now(), text: '', done: false }]);
  };

  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    }
    setSteps(newSteps);
  };

  // Lógica para ler arquivo do PC
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Converte para base64 para exibir
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({ ...nodeData, label: title, steps, image: imagePreview });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#05050a] w-full max-w-3xl h-[90vh] rounded-none border border-cyan-500/50 shadow-[0_0_100px_rgba(0,229,255,0.15)] flex flex-col overflow-hidden relative">
        
        {/* Detalhes Decorativos Tech */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>

        {/* Header Modal */}
        <div className="p-6 border-b border-cyan-900/50 flex justify-between items-center bg-cyan-950/10">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-400 font-oxanium text-sm tracking-[0.2em] uppercase">System Configuration // {nodeData.id}</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            
            {/* Área de Upload de Imagem */}
            <div className="space-y-3">
                <label className="text-xs text-cyan-600 uppercase tracking-widest font-bold">Visual Database</label>
                
                <div 
                    onClick={() => fileInputRef.current.click()}
                    className="relative w-full h-48 border-2 border-dashed border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/10 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center group overflow-hidden"
                >
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2"><Upload size={16}/> Change Image</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-gray-500 group-hover:text-cyan-400 transition-colors">
                            <Upload size={32} className="mb-2" />
                            <span className="text-sm font-oxanium uppercase tracking-widest">Upload from System</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*"
                        className="hidden"
                    />
                </div>
            </div>

            {/* Título Editável */}
            <div className="space-y-2">
                <label className="text-xs text-cyan-600 uppercase tracking-widest font-bold">Dream Identifier</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-700 focus:border-cyan-500 text-3xl font-oxanium font-bold text-white placeholder-gray-700 focus:outline-none py-2 transition-colors uppercase"
                    placeholder="ENTER TITLE..."
                />
            </div>

            {/* Lista de Passos */}
            <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                    <h4 className="text-cyan-400 font-oxanium uppercase text-sm tracking-widest">Execution Steps</h4>
                    <span className="text-xs text-gray-600">{steps.filter(s => s.done).length} / {steps.length} COMPLETED</span>
                </div>
                
                <div className="space-y-2">
                    {steps.map((step, index) => (
                        <div key={step.id} className="group flex items-center gap-4 bg-gray-900/50 p-4 border-l-2 border-transparent hover:border-cyan-500 hover:bg-cyan-950/10 transition-all">
                            {/* Controles */}
                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => moveStep(index, 'up')}><ChevronUp size={12} className="text-gray-600 hover:text-cyan-400"/></button>
                                <GripVertical size={12} className="text-gray-700 my-0.5"/>
                                <button onClick={() => moveStep(index, 'down')}><ChevronDown size={12} className="text-gray-600 hover:text-cyan-400"/></button>
                            </div>

                            {/* Checkbox Neon */}
                            <button onClick={() => {
                                const newSteps = [...steps];
                                newSteps[index].done = !newSteps[index].done;
                                setSteps(newSteps);
                            }}>
                                {step.done ? 
                                    <CheckCircle className="text-cyan-400 drop-shadow-[0_0_5px_#00E5FF]" size={20} /> : 
                                    <Circle className="text-gray-700 group-hover:text-cyan-600 transition-colors" size={20} />
                                }
                            </button>

                            <input 
                                value={step.text}
                                onChange={(e) => {
                                    const newSteps = [...steps];
                                    newSteps[index].text = e.target.value;
                                    setSteps(newSteps);
                                }}
                                className={`flex-1 bg-transparent focus:outline-none font-mono text-sm ${step.done ? 'text-gray-600 line-through decoration-cyan-900' : 'text-gray-300'}`}
                                placeholder="DEFINE SUB-TASK..."
                            />

                            <button onClick={() => setSteps(steps.filter((_, i) => i !== index))} className="opacity-0 group-hover:opacity-100 text-red-900 hover:text-red-500 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={addStep}
                    className="w-full py-3 border border-dashed border-gray-800 hover:border-cyan-500/50 text-gray-500 hover:text-cyan-400 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Add Sequence Node
                </button>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-cyan-900/30 flex justify-end gap-4 bg-black/40">
            <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:text-white font-oxanium text-sm uppercase tracking-wider transition-colors">Abort</button>
            <button 
                onClick={handleSave} 
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-oxanium text-sm uppercase tracking-widest clip-path-polygon hover:shadow-[0_0_20px_#00E5FF] transition-all flex items-center gap-2"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%)' }}
            >
                <Save size={16} /> Save Data
            </button>
        </div>

      </div>
    </div>
  );
};

export default DreamModal;