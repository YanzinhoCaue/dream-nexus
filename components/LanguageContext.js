import React, { createContext, useState, useContext } from 'react';

// Dicionário de Traduções
const translations = {
  en: {
    login_title: 'SECURE NEURAL LINK',
    login_btn: 'ACCESS SYSTEM',
    loading: 'CONNECTING...',
    projects: 'MY PROJECTS',
    active_dreams: 'DREAMS ACTIVE',
    create_new: 'CREATE NEW DREAM',
    untitled: 'UNTITLED DREAM',
    system_online: 'SYSTEM ONLINE',
    editor_active: 'EDITOR ACTIVE',
    saved: 'SAVED',
    syncing: 'SYNCING...',
    create_root: 'CREATE ROOT NODE',
    save_data: 'SAVE DATA',
    abort: 'ABORT',
    upload_system: 'UPLOAD FROM SYSTEM',
    change_image: 'CHANGE IMAGE',
    dream_id: 'DREAM IDENTIFIER',
    enter_title: 'ENTER TITLE...',
    steps: 'EXECUTION STEPS',
    completed: 'COMPLETED',
    add_node: 'ADD SEQUENCE NODE',
    visual_db: 'VISUAL DATABASE',
    uploading: 'UPLOADING...'
  },
  pt: {
    login_title: 'LINK NEURAL SEGURO',
    login_btn: 'ACESSAR SISTEMA',
    loading: 'CONECTANDO...',
    projects: 'MEUS PROJETOS',
    active_dreams: 'SONHOS ATIVOS',
    create_new: 'CRIAR NOVO SONHO',
    untitled: 'SONHO SEM TÍTULO',
    system_online: 'SISTEMA ONLINE',
    editor_active: 'EDITOR ATIVO',
    saved: 'SALVO',
    syncing: 'SINCRONIZANDO...',
    create_root: 'CRIAR NÓ RAIZ',
    save_data: 'SALVAR DADOS',
    abort: 'CANCELAR',
    upload_system: 'ENVIAR DO SISTEMA',
    change_image: 'TROCAR IMAGEM',
    dream_id: 'IDENTIFICADOR DO SONHO',
    enter_title: 'DIGITE O TÍTULO...',
    steps: 'PASSOS DE EXECUÇÃO',
    completed: 'CONCLUÍDOS',
    add_node: 'ADICIONAR NÓ DE SEQUÊNCIA',
    visual_db: 'BANCO DE DADOS VISUAL',
    uploading: 'ENVIANDO...'
  },
  cn: {
    login_title: '安全神经链接',
    login_btn: '访问系统',
    loading: '连接中...',
    projects: '我的项目',
    active_dreams: '活跃梦想',
    create_new: '创建新梦想',
    untitled: '无标题梦想',
    system_online: '系统在线',
    editor_active: '编辑器激活',
    saved: '已保存',
    syncing: '同步中...',
    create_root: '创建根节点',
    save_data: '保存数据',
    abort: '中止',
    upload_system: '从系统上传',
    change_image: '更改图像',
    dream_id: '梦想标识符',
    enter_title: '输入标题...',
    steps: '执行步骤',
    completed: '已完成',
    add_node: '添加序列节点',
    visual_db: '视觉数据库',
    uploading: '上传中...'
  },
  jp: {
    login_title: 'セキュア・ニューラル・リンク',
    login_btn: 'システムアクセス',
    loading: '接続中...',
    projects: 'マイプロジェクト',
    active_dreams: 'アクティブな夢',
    create_new: '新しい夢を作成',
    untitled: '無題の夢',
    system_online: 'システムオンライン',
    editor_active: 'エディタ起動中',
    saved: '保存済み',
    syncing: '同期中...',
    create_root: 'ルートノード作成',
    save_data: 'データ保存',
    abort: '中止',
    upload_system: 'システムからアップロード',
    change_image: '画像を変更',
    dream_id: 'ドリーム識別子',
    enter_title: 'タイトルを入力...',
    steps: '実行ステップ',
    completed: '完了',
    add_node: 'シーケンスノードを追加',
    visual_db: '視覚データベース',
    uploading: 'アップロード中...'
  },
  es: {
    login_title: 'ENLACE NEURONAL SEGURO',
    login_btn: 'ACCEDER AL SISTEMA',
    loading: 'CONECTANDO...',
    projects: 'MIS PROYECTOS',
    active_dreams: 'SUEÑOS ACTIVOS',
    create_new: 'CREAR NUEVO SUEÑO',
    untitled: 'SUEÑO SIN TÍTULO',
    system_online: 'SISTEMA EN LÍNEA',
    editor_active: 'EDITOR ACTIVO',
    saved: 'GUARDADO',
    syncing: 'SINCRONIZANDO...',
    create_root: 'CREAR NODO RAÍZ',
    save_data: 'GUARDAR DATOS',
    abort: 'CANCELAR',
    upload_system: 'SUBIR DEL SISTEMA',
    change_image: 'CAMBIAR IMAGEN',
    dream_id: 'IDENTIFICADOR DE SUEÑO',
    enter_title: 'INGRESAR TÍTULO...',
    steps: 'PASOS DE EJECUCIÓN',
    completed: 'COMPLETADOS',
    add_node: 'AÑADIR NODO DE SECUENCIA',
    visual_db: 'BASE DE DATOS VISUAL',
    uploading: 'SUBIENDO...'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('pt'); // Padrão PT-BR

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);