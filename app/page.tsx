// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  // Controls, <--- REMOVIDO (Passo 1)
  applyNodeChanges, 
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  getRectOfNodes,        // Necessário para o PDF HD
  getTransformForBounds  // Necessário para o PDF HD
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Lock, LogOut, Loader2, Cloud, Plus, ArrowLeft, Trash2, FolderOpen, LayoutGrid, User, Globe, Edit3, Save, Printer } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import DreamNode from '../components/DreamNode';
import DreamModal from '../components/DreamModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import NeuralBackground from '../components/NeuralBackground';
import { supabase } from '../components/supabaseClient';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';

const nodeTypes = { dreamNode: DreamNode };

const defaultStartNode = [
  { id: '1', type: 'dreamNode', position: { x: 0, y: 0 }, data: { label: 'MAIN GOAL', image: '', progress: 0 } },
];

const DreamApp = () => {
  const { t, lang, setLang } = useLanguage();
  // Adicionado setViewport para controlar a câmera no PDF HD
  const { getNode, getEdges, getNodes, fitView, setViewport } = useReactFlow(); 
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [view, setView] = useState('login'); 
  const viewRef = useRef('login');

  const [projects, setProjects] = useState([]); 
  const [currentProject, setCurrentProject] = useState(null); 
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [modalData, setModalData] = useState({ isOpen: false, node: null });
  
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null, projectTitle: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');

  const [saveStatus, setSaveStatus] = useState('saved'); 
  const saveTimeoutRef = useRef(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { viewRef.current = view; }, [view]);

  // --- SESSÃO ---
  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            fetchProjects(session.user.id);
        } else {
            setView('login');
        }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
            setView('login');
            setProjects([]);
        } else if (event === 'SIGNED_IN' && viewRef.current === 'login') {
            fetchProjects(session.user.id);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FUNÇÃO DE EXPORTAR PDF (AGORA EM HD 4K) ---
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
        // 1. Definir uma resolução alvo bem alta (4K)
        const imageWidth = 3840;
        const imageHeight = 2160;

        // 2. Calcular os limites exatos de todos os nós presentes
        const nodesBounds = getRectOfNodes(getNodes());
        
        // 3. Calcular o zoom e posição perfeitos para encaixar tudo na resolução 4K com uma pequena margem (0.1)
        const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 0.1, 2);

        // 4. Forçar a câmera do React Flow para essa posição exata instantaneamente
        setViewport({ x: transform[0], y: transform[1], zoom: transform[2] });

        // Espera um breve momento para o React Flow renderizar os nós na nova posição (importante se tiver imagens)
        await new Promise(resolve => setTimeout(resolve, 200));

        // 5. Gera a imagem em ALTA DEFINIÇÃO usando a viewport específica
        // O segredo da qualidade é pixelRatio: 2 (dobra a densidade de pixels) e forçar o tamanho 4K
        const dataUrl = await toPng(document.querySelector('.react-flow__viewport'), {
            backgroundColor: '#05050a', // Fundo Cyberpunk
            width: imageWidth,
            height: imageHeight,
            pixelRatio: 2, // Super nitidez
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                // Força a transformação calculada para garantir que a "foto" saia correta
                transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
            }
        });

        // 6. Cria o PDF no tamanho exato da imagem 4K
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [imageWidth, imageHeight] 
        });
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
        pdf.save(`Dream-Nexus-${currentProject?.title || 'Project'}.pdf`);
        
        // 7. Restaura a visão normal para o usuário com uma animação suave
        await fitView({ padding: 0.2, duration: 800 });

    } catch (error) {
        console.error("Erro ao exportar:", error);
        alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
        setIsExporting(false);
    }
  };

  // --- DASHBOARD ---
  const fetchProjects = async (userId) => {
    const { data } = await supabase.from('dream_trees').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (data) {
        setProjects(data);
        setView('dashboard');
    }
  };

  const createNewProject = async () => {
    if (!user) return;
    setLoading(true);
    const newProject = { user_id: user.id, title: 'Untitled Dream', nodes: defaultStartNode, edges: [] };
    const { data } = await supabase.from('dream_trees').insert(newProject).select().single();
    if (data) {
        setProjects([data, ...projects]);
        openProject(data);
    }
    setLoading(false);
  };

  const requestDeleteProject = (e, project) => {
    e.stopPropagation(); 
    e.preventDefault();
    const displayTitle = project.title || t('untitled');
    setDeleteModal({ isOpen: true, projectId: project.id, projectTitle: displayTitle });
  };

  const confirmDeleteProject = async () => {
    if (!deleteModal.projectId) return;
    await supabase.from('dream_trees').delete().eq('id', deleteModal.projectId);
    setProjects(projects.filter(p => p.id !== deleteModal.projectId));
    setDeleteModal({ isOpen: false, projectId: null, projectTitle: '' });
  };

  const startEditingProject = (e, project) => {
    e.stopPropagation();
    setEditingProject(project.id);
    setEditName(project.title);
  };

  const saveProjectName = async (e) => {
    e.stopPropagation();
    if (!editingProject) return;
    await supabase.from('dream_trees').update({ title: editName }).eq('id', editingProject);
    setProjects(projects.map(p => p.id === editingProject ? { ...p, title: editName } : p));
    setEditingProject(null);
  };

  const openProject = (project) => {
    setCurrentProject(project);
    setNodes(project.nodes || []);
    setEdges(project.edges || []);
    setView('editor');
  };

  const exitEditor = async () => {
    await forceSave();
    fetchProjects(user.id); 
    setView('dashboard');
    setCurrentProject(null);
  };

  const forceSave = async () => {
      if (!user || !currentProject) return;
      setSaveStatus('saving');
      await supabase.from('dream_trees').update({ nodes: nodes, edges: edges, updated_at: new Date() }).eq('id', currentProject.id);
      setSaveStatus('saved');
  };

  useEffect(() => {
    if (view !== 'editor' || !currentProject) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { forceSave(); }, 2000);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [nodes, edges]);

  // --- LÓGICA DE NÓS ---
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: '#00E5FF', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const addNode = useCallback((parentId, direction = 'DOWN') => {
    const parentNode = getNode(parentId) || nodes.find(n => n.id === parentId);
    if (!parentNode && parentId !== null) return;
    
    let position = { x: 0, y: 0 };
    if (parentNode) {
        const offset = 350;
        if (direction === 'DOWN') position = { x: parentNode.position.x, y: parentNode.position.y + offset };
        if (direction === 'UP') position = { x: parentNode.position.x, y: parentNode.position.y - offset };
        if (direction === 'RIGHT') position = { x: parentNode.position.x + offset, y: parentNode.position.y };
        if (direction === 'LEFT') position = { x: parentNode.position.x - offset, y: parentNode.position.y };
    }

    const newNodeId = `${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'dreamNode',
      position: position,
      data: { label: 'NEW STEP', description: '', progress: 0 }
    };

    setNodes((nds) => [...nds, newNode]);
    
    if (parentId) {
        setEdges((eds) => [...eds, { 
            id: `e${parentId}-${newNodeId}`, 
            source: parentId, 
            target: newNodeId, 
            type: 'smoothstep', 
            animated: true, 
            style: { stroke: '#00E5FF', strokeWidth: 2, strokeDasharray: '5,5' } 
        }]);
    }
  }, [getNode, nodes, setNodes, setEdges]); 

  const deleteNode = useCallback((nodeId) => {
    const currentEdges = getEdges(); 
    const incomingEdges = currentEdges.filter(e => e.target === nodeId);
    const outgoingEdges = currentEdges.filter(e => e.source === nodeId);

    const bridgeEdges = [];
    incomingEdges.forEach(inEdge => {
        outgoingEdges.forEach(outEdge => {
            bridgeEdges.push({
                id: `e${inEdge.source}-${outEdge.target}-${Date.now()}`,
                source: inEdge.source,
                target: outEdge.target,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#00E5FF', strokeWidth: 2, strokeDasharray: '5,5' }
            });
        });
    });

    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => {
        const remainingEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        return [...remainingEdges, ...bridgeEdges];
    });

  }, [getEdges, setNodes, setEdges]);

  const nodesWithFunctions = nodes.map(n => ({
    ...n,
    data: { ...n.data, onAdd: addNode, onDelete: deleteNode, onNodeClick: () => setModalData({ isOpen: true, node: n }) }
  }));

  const onSaveModal = (updatedData) => {
    setNodes((nds) => nds.map((n) => {
        if (n.id === modalData.node.id) {
            const total = updatedData.steps.length;
            const done = updatedData.steps.filter(s => s.done).length;
            const progress = total === 0 ? 0 : Math.round((done / total) * 100);
            return { ...n, data: { ...updatedData, progress } };
        }
        return n;
    }));
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { queryParams: { access_type: 'offline', prompt: 'consent' } },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
  };

  const LanguageSelector = ({ className = "" }) => (
    <div className={`relative flex flex-col items-end z-[100] ${className}`}>
        <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="w-10 h-10 rounded-full bg-black/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <Globe size={20} />
        </button>
        {langMenuOpen && (
            <div className="absolute top-12 right-0 bg-black/90 border border-cyan-500/30 rounded-lg p-2 flex flex-col gap-1 backdrop-blur-md animate-in fade-in slide-in-from-top-2 w-32 shadow-xl">
                {[{ code: 'en', label: 'English' }, { code: 'pt', label: 'Português' }, { code: 'es', label: 'Español' }, { code: 'cn', label: '中文' }, { code: 'jp', label: '日本語' }].map((l) => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangMenuOpen(false); }} className={`text-left px-3 py-2 text-xs font-oxanium tracking-wider hover:bg-cyan-500/20 rounded transition-colors cursor-pointer ${lang === l.code ? 'text-cyan-400 font-bold' : 'text-gray-400'}`}>
                        {l.label}
                    </button>
                ))}
            </div>
        )}
    </div>
  );

  // ================= RENDER =================
  if (view === 'login') {
    return (
        <div className="w-screen h-screen flex items-center justify-center font-inter relative overflow-hidden">
            <NeuralBackground />
            <LanguageSelector className="absolute top-6 right-6" />
            <div className="relative z-10 bg-[#05050a]/90 backdrop-blur-xl p-10 rounded-xl border border-white/10 shadow-2xl flex flex-col items-center">
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-[30px] opacity-40 rounded-full"></div>
                    <Lock size={40} className="text-cyan-400 relative z-10" />
                </div>
                <h1 className="text-5xl font-oxanium font-bold text-white mb-2 tracking-wider drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">DREAM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">NEXUS</span></h1>
                <p className="text-cyan-600 text-xs tracking-[0.4em] font-bold mb-8 text-center uppercase">{t('login_title')}</p>
                <button onClick={handleGoogleLogin} disabled={loading} className="px-8 py-3 bg-black border border-cyan-500 text-white hover:bg-cyan-950/50 hover:border-cyan-400 rounded-lg transition-all font-oxanium tracking-widest text-sm flex items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : t('login_btn')}
                </button>
            </div>
        </div>
    );
  }

  if (view === 'dashboard') {
    return (
        <div className="w-screen h-screen text-white overflow-hidden font-inter relative flex flex-col">
            <NeuralBackground />
            
            <DeleteConfirmationModal 
                isOpen={deleteModal.isOpen} 
                projectTitle={deleteModal.projectTitle}
                onClose={() => setDeleteModal({ isOpen: false, projectId: null, projectTitle: '' })}
                onConfirm={confirmDeleteProject}
            />

            <div className="p-8 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md z-50 relative">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-500/50"><LayoutGrid className="text-cyan-400" /></div>
                    <div><h2 className="font-oxanium text-2xl font-bold tracking-wide">{t('projects')}</h2><p className="text-xs text-gray-500 uppercase tracking-widest">{projects.length} {t('active_dreams')}</p></div>
                </div>
                <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-cyan-500/50 transition-colors">
                        {user?.user_metadata?.avatar_url ? (<img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-green-500" />) : (<div className="w-8 h-8 rounded-full border border-green-500 bg-green-900/20 flex items-center justify-center"><User size={16}/></div>)}
                        <span className="text-sm font-bold text-gray-300 font-oxanium uppercase tracking-wider">{user?.user_metadata?.full_name || 'Dreamer'}</span>
                     </div>
                     <LanguageSelector />
                     <button onClick={handleLogout} className="text-red-500 hover:text-white transition-colors"><LogOut size={20}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 z-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    <button onClick={createNewProject} disabled={loading} className="group h-64 border-2 border-dashed border-gray-800 hover:border-cyan-500 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-cyan-950/10 transition-all">
                        <div className="w-16 h-16 rounded-full bg-gray-900 group-hover:bg-cyan-500 flex items-center justify-center transition-colors"><Plus size={32} className="text-gray-500 group-hover:text-black" /></div>
                        <span className="font-oxanium font-bold text-gray-500 group-hover:text-cyan-400 tracking-widest">{t('create_new')}</span>
                    </button>

                    {projects.map((proj) => (
                        <div key={proj.id} onClick={() => openProject(proj)} className="group h-64 bg-gray-900/50 border border-white/5 hover:border-cyan-500 rounded-xl relative overflow-hidden cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col">
                            <div className="flex-1 bg-black/50 relative">
                                {proj.nodes?.[0]?.data?.image ? (<img src={proj.nodes[0].data.image} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />) : (<div className="w-full h-full flex items-center justify-center text-gray-700 group-hover:text-cyan-900/50"><FolderOpen size={48} /></div>)}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                            </div>
                            <div className="p-5 relative">
                                {editingProject === proj.id ? (
                                    <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-black/80 border border-cyan-500 text-white px-2 py-1 text-sm rounded w-full focus:outline-none" autoFocus />
                                        <button onClick={saveProjectName} className="text-cyan-400 hover:text-white"><Save size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-oxanium font-bold text-lg truncate text-white group-hover:text-cyan-400 transition-colors max-w-[80%]">{proj.title || t('untitled')}</h3>
                                        <button onClick={(e) => startEditingProject(e, proj)} className="text-gray-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16}/></button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{new Date(proj.updated_at).toLocaleDateString()}</p>
                                <button onClick={(e) => requestDeleteProject(e, proj)} className="absolute bottom-5 right-5 text-gray-500 hover:text-red-500 transition-colors z-50 p-2 hover:bg-red-950/30 rounded-full" title="Delete Project"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  // 3. EDITOR
  return (
    <div className="w-screen h-screen text-white overflow-hidden font-inter animate-in fade-in duration-500 relative">
      <NeuralBackground />

      <div className="absolute top-6 left-8 z-10 flex items-center gap-6">
        <button onClick={exitEditor} className="w-10 h-10 rounded-full bg-black/50 border border-white/10 hover:border-cyan-500 text-gray-400 hover:text-cyan-400 flex items-center justify-center transition-all"><ArrowLeft size={20} /></button>
        <div>
            <h1 className="text-2xl font-oxanium font-bold text-white drop-shadow-[0_0_10px_#00E5FF]">{currentProject?.title || 'DREAM NEXUS'}</h1>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-cyan-700 text-[10px] tracking-[0.3em] font-bold">{t('editor_active')}</p>
            </div>
        </div>
      </div>

      <div className="absolute top-6 right-8 z-50 flex items-center gap-4">
        {/* BOTÃO EXPORTAR PDF (Agora com Loader) */}
        <button 
            onClick={exportToPDF} 
            disabled={isExporting}
            className="flex items-center gap-2 font-oxanium text-xs tracking-widest uppercase bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 px-4 py-2 rounded border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-50 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]"
        >
            {isExporting ? <Loader2 size={14} className="animate-spin"/> : <Printer size={16} />}
            <span>{isExporting ? 'GENERATING 4K PDF...' : 'EXPORT PDF'}</span>
        </button>

        <div className="flex items-center gap-2 font-oxanium text-xs tracking-widest uppercase bg-black/50 px-3 py-1 rounded border border-white/5">
            {saveStatus === 'saving' ? (<><Loader2 size={12} className="text-cyan-400 animate-spin" /><span className="text-cyan-400">{t('syncing')}</span></>) : (<><Cloud size={14} className="text-gray-500" /><span className="text-gray-500">{t('saved')}</span></>)}
        </div>
        <LanguageSelector />
      </div>

      {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <button onClick={() => addNode(null, 'DOWN')} className="pointer-events-auto bg-black/80 backdrop-blur border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 text-cyan-400 hover:text-white px-10 py-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(0,229,255,0.2)]">
                  <Plus size={40} /><span className="font-oxanium font-bold tracking-widest text-lg">{t('create_root')}</span>
              </button>
          </div>
      )}

      <ReactFlow
        nodes={nodesWithFunctions}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
        minZoom={0.1}
      >
        {/* Controls REMOVIDO AQUI (Passo 1) */}
      </ReactFlow>

      {modalData.isOpen && modalData.node && (
        <DreamModal isOpen={modalData.isOpen} nodeData={modalData.node.data} onClose={() => setModalData({ ...modalData, isOpen: false })} onSave={onSaveModal} />
      )}
    </div>
  );
};

// --- WRAPPER OBRIGATÓRIO ---
export default function DreamSystem() {
  return (
    <ReactFlowProvider>
      <LanguageProvider>
        <DreamApp />
      </LanguageProvider>
    </ReactFlowProvider>
  );
}