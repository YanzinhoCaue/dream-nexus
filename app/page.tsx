// @ts-nocheck
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyNodeChanges, 
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Lock, LogOut, Loader2, Cloud, Plus, ArrowLeft, Trash2, FolderOpen, LayoutGrid, User, Globe } from 'lucide-react';

import DreamNode from '../components/DreamNode';
import DreamModal from '../components/DreamModal';
import NeuralBackground from '../components/NeuralBackground';
import { supabase } from '../components/supabaseClient';
import { LanguageProvider, useLanguage } from '../components/LanguageContext';

const nodeTypes = { dreamNode: DreamNode };

const defaultStartNode = [
  { 
    id: '1', 
    type: 'dreamNode', 
    position: { x: 0, y: 0 }, 
    data: { label: 'MAIN GOAL', image: '', progress: 0 } 
  },
];

const DreamApp = () => {
  const { t, lang, setLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [view, setView] = useState('login'); 
  const viewRef = useRef('login'); // Ref para rastrear a tela atual e evitar redirects errados

  const [projects, setProjects] = useState([]); 
  const [currentProject, setCurrentProject] = useState(null); 
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [modalData, setModalData] = useState({ isOpen: false, node: null });
  
  const [saveStatus, setSaveStatus] = useState('saved'); 
  const saveTimeoutRef = useRef(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Sincroniza o Ref com o State (para usar dentro de listeners)
  useEffect(() => { viewRef.current = view; }, [view]);

  // --- SESSÃO E CORREÇÃO DO REDIRECT ---
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
        
        // CORREÇÃO CRÍTICA DO MINIMIZAR:
        // Se o usuário deslogar, vai pro login.
        if (event === 'SIGNED_OUT') {
            setView('login');
            setProjects([]);
        } 
        // Se logar explicitamente (ex: botão google), carrega projetos.
        // MAS se for só um refresh de token (acontece ao minimizar/voltar), NÃO faz nada se já estivermos logados.
        else if (event === 'SIGNED_IN' && viewRef.current === 'login') {
            fetchProjects(session.user.id);
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- DASHBOARD ---
  const fetchProjects = async (userId) => {
    const { data } = await supabase.from('dream_trees').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (data) {
        setProjects(data);
        setView('dashboard'); // Só muda para dashboard aqui
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

  const deleteProject = async (e, projectId) => {
    e.stopPropagation();
    if(!confirm("Delete this dream forever?")) return;
    await supabase.from('dream_trees').delete().eq('id', projectId);
    setProjects(projects.filter(p => p.id !== projectId));
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

  // --- EDITOR & AUTOSAVE ---
  const forceSave = async () => {
      if (!user || !currentProject) return;
      setSaveStatus('saving');
      const rootNode = nodes.find(n => n.id === '1' || nodes.length > 0);
      const dynamicTitle = rootNode ? (rootNode.data.label || 'Untitled') : 'Empty Dream';
      await supabase.from('dream_trees').update({ nodes: nodes, edges: edges, title: dynamicTitle, updated_at: new Date() }).eq('id', currentProject.id);
      setSaveStatus('saved');
  };

  useEffect(() => {
    if (view !== 'editor' || !currentProject) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { forceSave(); }, 2000);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [nodes, edges]);

  // --- FLUXO DA ÁRVORE (AGORA COM DIREÇÃO) ---
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: '#00E5FF', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const addNode = (parentId, direction = 'DOWN') => {
    const parentNode = nodes.find(n => n.id === parentId);
    
    // Calcula posição baseada na direção escolhida
    let position = { x: 0, y: 0 };
    if (parentNode) {
        const offset = 350; // Distância entre blocos
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
      data: { label: 'NEW STEP', progress: 0 }
    };
    setNodes((nds) => [...nds, newNode]);
    
    if (parentId) {
        setEdges((eds) => [...eds, { id: `e${parentId}-${newNodeId}`, source: parentId, target: newNodeId, type: 'smoothstep', animated: true, style: { stroke: '#00E5FF', strokeWidth: 2, strokeDasharray: '5,5' } }]);
    }
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

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
        <button 
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="w-10 h-10 rounded-full bg-black/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
        >
            <Globe size={20} />
        </button>
        
        {langMenuOpen && (
            <div className="absolute top-12 right-0 bg-black/90 border border-cyan-500/30 rounded-lg p-2 flex flex-col gap-1 backdrop-blur-md animate-in fade-in slide-in-from-top-2 w-32 shadow-xl">
                {[
                    { code: 'en', label: 'English' },
                    { code: 'pt', label: 'Português' },
                    { code: 'es', label: 'Español' },
                    { code: 'cn', label: '中文' },
                    { code: 'jp', label: '日本語' }
                ].map((l) => (
                    <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                        className={`text-left px-3 py-2 text-xs font-oxanium tracking-wider hover:bg-cyan-500/20 rounded transition-colors cursor-pointer ${lang === l.code ? 'text-cyan-400 font-bold' : 'text-gray-400'}`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>
        )}
    </div>
  );

  // ================= RENDER =================
  // 1. LOGIN
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
                <h1 className="text-5xl font-oxanium font-bold text-white mb-2 tracking-wider drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">
                    DREAM <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">NEXUS</span>
                </h1>
                <p className="text-cyan-600 text-xs tracking-[0.4em] font-bold mb-8 text-center uppercase">{t('login_title')}</p>
                <button onClick={handleGoogleLogin} disabled={loading} className="px-8 py-3 bg-black border border-cyan-500 text-white hover:bg-cyan-950/50 hover:border-cyan-400 rounded-lg transition-all font-oxanium tracking-widest text-sm flex items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : t('login_btn')}
                </button>
            </div>
        </div>
    );
  }

  // 2. DASHBOARD
  if (view === 'dashboard') {
    return (
        <div className="w-screen h-screen text-white overflow-hidden font-inter relative flex flex-col">
            <NeuralBackground />
            <div className="p-8 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md z-50 relative">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-500/50">
                        <LayoutGrid className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="font-oxanium text-2xl font-bold tracking-wide">{t('projects')}</h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{projects.length} {t('active_dreams')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                     <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-cyan-500/50 transition-colors">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-green-500" />
                        ) : (
                            <div className="w-8 h-8 rounded-full border border-green-500 bg-green-900/20 flex items-center justify-center"><User size={16}/></div>
                        )}
                        <span className="text-sm font-bold text-gray-300 font-oxanium uppercase tracking-wider">
                            {user?.user_metadata?.full_name || 'Dreamer'}
                        </span>
                     </div>
                     <LanguageSelector />
                     <button onClick={handleLogout} className="text-red-500 hover:text-white transition-colors"><LogOut size={20}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 z-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    <button onClick={createNewProject} disabled={loading} className="group h-64 border-2 border-dashed border-gray-800 hover:border-cyan-500 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-cyan-950/10 transition-all">
                        <div className="w-16 h-16 rounded-full bg-gray-900 group-hover:bg-cyan-500 flex items-center justify-center transition-colors">
                            <Plus size={32} className="text-gray-500 group-hover:text-black" />
                        </div>
                        <span className="font-oxanium font-bold text-gray-500 group-hover:text-cyan-400 tracking-widest">{t('create_new')}</span>
                    </button>

                    {projects.map((proj) => (
                        <div key={proj.id} onClick={() => openProject(proj)} className="group h-64 bg-gray-900/50 border border-white/5 hover:border-cyan-500 rounded-xl relative overflow-hidden cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col">
                            <div className="flex-1 bg-black/50 relative">
                                {proj.nodes?.[0]?.data?.image ? (
                                    <img src={proj.nodes[0].data.image} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 group-hover:text-cyan-900/50"><FolderOpen size={48} /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                            </div>
                            <div className="p-5 relative">
                                <h3 className="font-oxanium font-bold text-lg truncate text-white group-hover:text-cyan-400 transition-colors">{proj.title || t('untitled')}</h3>
                                <p className="text-xs text-gray-500 mt-1">{new Date(proj.updated_at).toLocaleDateString()}</p>
                                <button onClick={(e) => deleteProject(e, proj.id)} className="absolute bottom-5 right-5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
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
        <Background color="#000" gap={30} size={1} style={{opacity: 0.1}} />
        <Controls className="!bg-black !border-cyan-900 !m-4 !rounded-lg overflow-hidden" showInteractive={false} />
      </ReactFlow>

      {modalData.isOpen && modalData.node && (
        <DreamModal isOpen={modalData.isOpen} nodeData={modalData.node.data} onClose={() => setModalData({ ...modalData, isOpen: false })} onSave={onSaveModal} />
      )}
    </div>
  );
};

export default function DreamSystem() {
  return (
    <LanguageProvider>
      <DreamApp />
    </LanguageProvider>
  );
}