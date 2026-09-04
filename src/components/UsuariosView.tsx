import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  UserCog, 
  KeyRound, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  UserCheck, 
  Shield, 
  BadgeCheck, 
  Sparkles,
  RefreshCw,
  Lock,
  ChevronRight,
  BriefcaseBusiness,
  X,
  LogOut,
  Clock,
  ArrowUpDown,
  Power
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '../types';
import { formatDateTimeBR, getSaoPauloISOString } from '../utils/cpf';
import { PresenceUser } from '../lib/supabase';

interface UsuariosViewProps {
  usuarios: Usuario[];
  currentUser?: Usuario | null;
  onlineUsersMap?: Record<string, PresenceUser>;
  onSaveUsuario: (usuario: Usuario) => void;
  onDeleteUsuario: (id: string) => void;
  onLogoutUsuario?: (id: string) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  currentUser,
  onlineUsersMap = {},
  onSaveUsuario,
  onDeleteUsuario,
  onLogoutUsuario,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<PerfilUsuario>('Operador');
  const [supervisor, setSupervisor] = useState('');
  const [matricula, setMatricula] = useState('');
  const [emailCorporativo, setEmailCorporativo] = useState('');
  const [ativo, setAtivo] = useState(true);

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Table Filters & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState<string>('Todos');
  const [filterOnline, setFilterOnline] = useState<string>('Todos'); // 'Todos' | 'Online' | 'Offline'
  const [sortBy, setSortBy] = useState<'online' | 'ultimoLogin' | 'nome'>('online');

  // Helper to determine if user is online
  const isUserOnline = (u: Usuario): boolean => {
    if (currentUser && (currentUser.id === u.id || currentUser.usuario.toLowerCase() === u.usuario.toLowerCase())) {
      return true;
    }
    const cleanUser = u.usuario.toLowerCase();
    if (onlineUsersMap && (onlineUsersMap[cleanUser] || (u.id && onlineUsersMap[u.id]))) {
      return true;
    }
    return Boolean(u.isOnline);
  };

  // Helper to get last login timestamp
  const getUserLastLogin = (u: Usuario): string | undefined => {
    const cleanUser = u.usuario.toLowerCase();
    if (currentUser && (currentUser.id === u.id || currentUser.usuario.toLowerCase() === cleanUser)) {
      return u.ultimoLogin || currentUser.ultimoLogin || getSaoPauloISOString();
    }
    if (onlineUsersMap) {
      const presence = onlineUsersMap[cleanUser] || (u.id ? onlineUsersMap[u.id] : null);
      if (presence && presence.onlineAt) {
        return presence.onlineAt;
      }
    }
    return u.ultimoLogin;
  };

  // Lista apenas dos supervisores realmente cadastrados no banco
  const supervisoresDisponiveis = useMemo(() => {
    const fromList = usuarios
      .filter((u) => u.perfil === 'Supervisor' && u.ativo !== false)
      .map((u) => u.nome.trim())
      .filter(Boolean);

    return Array.from(new Set(fromList) as Set<string>).sort((a: string, b: string) => a.localeCompare(b));
  }, [usuarios]);

  // Open Modal for New User
  const handleOpenNewUserModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Handle Edit User
  const handleStartEdit = (user: Usuario) => {
    setEditingId(user.id);
    setNome(user.nome);
    setUsuario(user.usuario);
    setSenha(user.senha);
    setPerfil(user.perfil);
    setSupervisor(user.supervisor || '');
    setMatricula(user.matricula || '');
    setEmailCorporativo(user.emailCorporativo || '');
    setAtivo(user.ativo !== false);
    setFormFeedback(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setUsuario('');
    setSenha('');
    setPerfil('Operador');
    setSupervisor(supervisoresDisponiveis[0] || '');
    setMatricula('');
    setEmailCorporativo('');
    setAtivo(true);
    setShowPassword(false);
    setFormFeedback(null);
  };

  // Auto-generate username suggestion from name
  const handleNomeChange = (newNome: string) => {
    const nomeUpper = newNome.toUpperCase();
    setNome(nomeUpper);

    if (!editingId && (!usuario || usuario.includes('.'))) {
      const parts = nomeUpper.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        setUsuario(`${parts[0]}.${parts[parts.length - 1]}`);
      } else if (parts.length === 1 && parts[0]) {
        setUsuario(parts[0]);
      }
    }
  };

  // Submit User
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    // Basic Validation
    if (!nome.trim()) {
      setFormFeedback({ type: 'error', message: 'O campo NOME é obrigatório.' });
      return;
    }
    if (!usuario.trim()) {
      setFormFeedback({ type: 'error', message: 'O campo USUÁRIO (login) é obrigatório.' });
      return;
    }
    if (!senha.trim()) {
      setFormFeedback({ type: 'error', message: 'O campo SENHA é obrigatório.' });
      return;
    }

    // Check unique username (except when editing self)
    const normalizedUser = usuario.trim().toLowerCase();
    const existing = usuarios.find(
      (u) => u.usuario.toLowerCase() === normalizedUser && u.id !== editingId
    );
    if (existing) {
      setFormFeedback({
        type: 'error',
        message: `O login de usuário "${usuario}" já está em uso por outro colaborador.`,
      });
      return;
    }

    // Supervisor validation: required only for Operador
    if (perfil === 'Operador' && !supervisor.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Para o perfil de Operador, é necessário informar o SUPERVISOR responsável.',
      });
      return;
    }

    const currentRecord = editingId ? usuarios.find(u => u.id === editingId) : null;

    const novoUsuario: Usuario = {
      id: editingId || `usr-${Date.now()}`,
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      senha: senha.trim(),
      perfil: perfil,
      // If not Operador, supervisor is strictly null/undefined
      supervisor: perfil === 'Operador' ? supervisor.trim() : undefined,
      ativo: ativo,
      matricula: matricula.trim() || undefined,
      emailCorporativo: emailCorporativo.trim() || undefined,
      ultimoLogin: currentRecord?.ultimoLogin,
      isOnline: currentRecord?.isOnline,
      createdAt: currentRecord?.createdAt || getSaoPauloISOString(),
    };

    onSaveUsuario(novoUsuario);
    setFormFeedback({
      type: 'success',
      message: editingId
        ? `Usuário "${novoUsuario.nome}" atualizado com sucesso!`
        : `Usuário "${novoUsuario.nome}" cadastrado com sucesso!`,
    });

    setTimeout(() => {
      handleCloseModal();
    }, 1000);
  };

  // Copy login credentials to clipboard
  const handleCopyCredentials = (u: Usuario) => {
    const text = `Acesso Sistema de Tabulação:\nNome: ${u.nome}\nUsuário: ${u.usuario}\nSenha: ${u.senha}\nPerfil: ${u.perfil}${u.supervisor ? `\nSupervisor: ${u.supervisor}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Force disconnect / logout user
  const handleForceLogout = (u: Usuario) => {
    if (!onLogoutUsuario) return;
    const isSelf = currentUser?.id === u.id;
    const msg = isSelf 
      ? 'Deseja realmente encerrar a sua sessão atual?' 
      : `Deseja realmente deslogar o usuário "${u.nome}"? Ele será desconectado da sessão ativa.`;

    if (window.confirm(msg)) {
      onLogoutUsuario(u.id);
      setActionFeedback(`Sessão de ${u.nome} foi finalizada.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Filtered & Sorted Users List
  const filteredUsuarios = useMemo(() => {
    const filtered = usuarios.filter((u) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        u.nome.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        (u.supervisor && u.supervisor.toLowerCase().includes(q)) ||
        (u.matricula && u.matricula.toLowerCase().includes(q));

      const matchPerfil = filterPerfil === 'Todos' || u.perfil === filterPerfil;

      const onlineStatus = isUserOnline(u);
      const matchOnline = 
        filterOnline === 'Todos' ||
        (filterOnline === 'Online' && onlineStatus) ||
        (filterOnline === 'Offline' && !onlineStatus);

      return matchSearch && matchPerfil && matchOnline;
    });

    // Sorting (Online first by default, then latest login, then name)
    return [...filtered].sort((a, b) => {
      if (sortBy === 'online') {
        const aOnline = isUserOnline(a) ? 1 : 0;
        const bOnline = isUserOnline(b) ? 1 : 0;
        if (aOnline !== bOnline) return bOnline - aOnline; // Online first
        
        const aTime = getUserLastLogin(a) ? new Date(getUserLastLogin(a)!).getTime() : 0;
        const bTime = getUserLastLogin(b) ? new Date(getUserLastLogin(b)!).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.nome.localeCompare(b.nome);
      }
      if (sortBy === 'ultimoLogin') {
        const aTime = getUserLastLogin(a) ? new Date(getUserLastLogin(a)!).getTime() : 0;
        const bTime = getUserLastLogin(b) ? new Date(getUserLastLogin(b)!).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.nome.localeCompare(b.nome);
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [usuarios, searchTerm, filterPerfil, filterOnline, sortBy, currentUser, onlineUsersMap]);

  // Metrics
  const metrics = useMemo(() => {
    const total = usuarios.length;
    const online = usuarios.filter((u) => isUserOnline(u)).length;
    const operadores = usuarios.filter((u) => u.perfil === 'Operador').length;
    const supervisores = usuarios.filter((u) => u.perfil === 'Supervisor').length;
    const gerenciais = usuarios.filter((u) => u.perfil === 'Gerencial').length;
    const adms = usuarios.filter((u) => u.perfil === 'ADM').length;
    const clientes = usuarios.filter((u) => u.perfil === 'Cliente').length;
    return { total, online, operadores, supervisores, gerenciais, adms, clientes };
  }, [usuarios, currentUser, onlineUsersMap]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <UserCog className="w-3.5 h-3.5" />
              <span>Controle de Acesso & Sessões Ativas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Gestão de Usuários
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitore status em tempo real (online/logados), data e hora de último acesso e controle permissões entre <strong>Operador</strong>, <strong>Supervisor</strong>, <strong>Gerencial</strong>, <strong>Cliente</strong> e <strong>ADM</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Quick Metric Badge - Logados Only */}
            <button 
              type="button"
              id="btn-filtro-logados"
              onClick={() => setFilterOnline(filterOnline === 'Online' ? 'Todos' : 'Online')}
              className={`px-4 py-2.5 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-between sm:justify-center gap-3 ${
                filterOnline === 'Online' 
                  ? 'bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-400/50 shadow-md shadow-emerald-950/40' 
                  : 'bg-slate-800/80 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
              }`}
              title="Clique para filtrar apenas usuários conectados"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Logados</span>
              </div>
              <p className="text-base font-extrabold text-white">
                {metrics.online} <span className="text-xs text-slate-400 font-normal">/ {metrics.total}</span>
              </p>
            </button>

            {/* Cadastrar Novo Usuário Button */}
            <button
              type="button"
              id="btn-abrir-cadastro-usuario"
              onClick={handleOpenNewUserModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Usuário</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-md flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content: Users Management Table */}
      <div className="space-y-4">
        
        {/* Filter, Search, Classify and Action Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, usuário, supervisor ou matrícula..."
              className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all"
            />
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Online Filter Pill */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className={`inline-flex rounded-full h-2 w-2 ${filterOnline === 'Online' ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-400'}`}></span>
              </span>
              <select
                value={filterOnline}
                onChange={(e) => setFilterOnline(e.target.value)}
                className="text-xs bg-transparent outline-none font-semibold text-slate-700 cursor-pointer py-1"
              >
                <option value="Todos">Status: Todos</option>
                <option value="Online">Apenas Logados ({metrics.online})</option>
                <option value="Offline">Apenas Desconectados ({metrics.total - metrics.online})</option>
              </select>
            </div>

            {/* Profile Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterPerfil}
                onChange={(e) => setFilterPerfil(e.target.value)}
                className="text-xs bg-transparent outline-none font-semibold text-slate-700 cursor-pointer py-1"
              >
                <option value="Todos">Todos os Perfis ({usuarios.length})</option>
                <option value="Operador">Operadores ({metrics.operadores})</option>
                <option value="Supervisor">Supervisores ({metrics.supervisores})</option>
                <option value="Gerencial">Gerencial ({metrics.gerenciais})</option>
                <option value="Cliente">Clientes ({metrics.clientes})</option>
                <option value="ADM">ADMs ({metrics.adms})</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-transparent outline-none font-semibold text-slate-700 cursor-pointer py-1"
              >
                <option value="online">Classificar: Logados Primeiro</option>
                <option value="ultimoLogin">Classificar: Último Login</option>
                <option value="nome">Classificar: Nome (A-Z)</option>
              </select>
            </div>

            {/* New User Button */}
            <button
              type="button"
              onClick={handleOpenNewUserModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 font-bold text-xs rounded-xl transition-all border border-indigo-200/80 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          </div>

        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Usuários Registrados ({filteredUsuarios.length})
              </h3>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {metrics.online} logado(s) agora
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Logado
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span> Offline
              </span>
            </div>
          </div>

          {filteredUsuarios.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <UserCog className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Nenhum usuário encontrado</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Nenhum usuário corresponde aos critérios de pesquisa aplicados.' 
                  : 'Nenhum usuário cadastrado neste filtro. Clique no botão abaixo para adicionar.'}
              </p>
              <button
                type="button"
                onClick={handleOpenNewUserModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastrar Novo Usuário</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Status & Nome</th>
                    <th className="py-3.5 px-4">Usuário (Login)</th>
                    <th className="py-3.5 px-4">Perfil</th>
                    <th className="py-3.5 px-4">Supervisor</th>
                    <th className="py-3.5 px-4">Último Login</th>
                    <th className="py-3.5 px-4 text-right">Ações & Sessão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsuarios.map((u) => {
                    const online = isUserOnline(u);
                    const lastLogin = getUserLastLogin(u);
                    const isCurrentUser = currentUser?.id === u.id;

                    return (
                      <tr 
                        key={u.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          online ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {/* 1. Status & Nome */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            
                            {/* Avatar com badge online */}
                            <div className="relative">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                u.perfil === 'ADM'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : u.perfil === 'Supervisor'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : u.perfil === 'Gerencial'
                                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}>
                                {u.nome.charAt(0).toUpperCase()}
                              </div>

                              {/* Ícone Verde de Logado (com pulso) ou cinza offline */}
                              {online ? (
                                <span 
                                  className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center bg-white rounded-full p-0.5 shadow-xs" 
                                  title="Usuário logado no sistema"
                                >
                                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                              ) : (
                                <span 
                                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-slate-300 border-2 border-white rounded-full" 
                                  title="Offline / Desconectado"
                                />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 text-xs">{u.nome}</p>
                                {isCurrentUser && (
                                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                                    Você
                                  </span>
                                )}
                                {online && (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Logado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-0.5">
                                {u.matricula && (
                                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    Matrícula: {u.matricula}
                                  </span>
                                )}
                                {u.emailCorporativo && (
                                  <p className="text-[10px] text-slate-400 truncate max-w-[180px]" title={u.emailCorporativo}>
                                    {u.emailCorporativo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Usuário (Login) */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-mono text-[11px] text-slate-800 border border-slate-200">
                            <span>@{u.usuario}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(u)}
                              title="Copiar credenciais de acesso"
                              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                            >
                              {copiedId === u.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 3. Perfil */}
                        <td className="py-3.5 px-4">
                          {u.perfil === 'ADM' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Shield className="w-3 h-3 text-emerald-700" />
                              ADM
                            </span>
                          )}
                          {u.perfil === 'Supervisor' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <BadgeCheck className="w-3 h-3 text-purple-700" />
                              Supervisor
                            </span>
                          )}
                          {u.perfil === 'Gerencial' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                              <BriefcaseBusiness className="w-3 h-3 text-cyan-700" />
                              Gerencial
                            </span>
                          )}
                          {u.perfil === 'Operador' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <User className="w-3 h-3 text-indigo-700" />
                              Operador
                            </span>
                          )}
                          {u.perfil === 'Cliente' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <UserCheck className="w-3 h-3 text-amber-700" />
                              Cliente
                            </span>
                          )}
                        </td>

                        {/* 4. Supervisor (Aparece apenas para Operador) */}
                        <td className="py-3.5 px-4">
                          {u.perfil === 'Operador' ? (
                            u.supervisor ? (
                              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                                <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate max-w-[160px]" title={u.supervisor}>
                                  {u.supervisor}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-600 font-medium">
                                Não definido
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              — Não aplicável
                            </span>
                          )}
                        </td>

                        {/* 5. Data e Hora do Último Login */}
                        <td className="py-3.5 px-4">
                          {lastLogin ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="leading-tight">
                                <span className="font-semibold text-xs text-slate-800 block">
                                  {formatDateTimeBR(lastLogin)}
                                </span>
                                {online && (
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    Sessão ativa
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Nunca acessou
                            </span>
                          )}
                        </td>

                        {/* 6. Ações & Botão de Deslogar */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Botão de Deslogar (apenas se estiver online) */}
                            {online && onLogoutUsuario && (
                              <button
                                type="button"
                                onClick={() => handleForceLogout(u)}
                                title={isCurrentUser ? "Encerrar sua sessão" : `Deslogar ${u.nome}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <Power className="w-3 h-3 text-amber-600" />
                                <span>Deslogar</span>
                              </button>
                            )}

                            {/* Botão Editar */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(u)}
                              title="Editar este usuário"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Botão Excluir */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o usuário ${u.nome}?`)) {
                                  onDeleteUsuario(u.id);
                                }
                              }}
                              title="Excluir este usuário"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Summary */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Total de <strong>{filteredUsuarios.length}</strong> usuário(s) listado(s) • <strong>{metrics.online}</strong> atualmente logado(s).
            </span>
            <span className="text-[11px] text-slate-400">
              Classificação padrão: Usuários logados no topo da lista.
            </span>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* POPUP / MODAL DE CADASTRO E EDIÇÃO DE USUÁRIO                             */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  {editingId ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                    {editingId ? 'Editar Dados do Usuário' : 'Cadastrar Novo Usuário'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {editingId 
                      ? 'Atualize as permissões e dados cadastrais do colaborador' 
                      : 'Preencha os campos abaixo para liberar o acesso ao SIS ATP'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Alert within Modal */}
            {formFeedback && (
              <div className={`p-4 mx-6 mt-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                formFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {formFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{formFeedback.message}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* 1. Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  NOME COMPLETO DO COLABORADOR <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-usuario-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  placeholder="Ex: WELLINGTON SILVA BARBOSA"
                  required
                  className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100 font-medium"
                />
              </div>

              {/* 2. Login & Senha (Grid 2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Usuário (Login) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      USUÁRIO (Login) <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-semibold">
                      @
                    </span>
                    <input
                      id="input-usuario-login"
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="Ex: wsbarbosa"
                      required
                      className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl pl-8 pr-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100 font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      SENHA <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-usuario-senha"
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Senha de acesso"
                      required
                      className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. PERFIL (Operador | Supervisor | Gerencial | Cliente | ADM) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  PERFIL DE ACESSO <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  
                  {/* Operador Pill */}
                  <button
                    type="button"
                    id="perfil-btn-operador"
                    onClick={() => {
                      setPerfil('Operador');
                      if (!supervisor) {
                        setSupervisor(supervisoresDisponiveis[0] || '');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      perfil === 'Operador'
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-xs ring-1 ring-indigo-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <User className={`w-4 h-4 ${perfil === 'Operador' ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {perfil === 'Operador' && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                    </div>
                    <p className="text-xs font-bold leading-none">Operador</p>
                    <span className="text-[10px] text-slate-500 font-normal mt-1 block">Atendimento</span>
                  </button>

                  {/* Supervisor Pill */}
                  <button
                    type="button"
                    id="perfil-btn-supervisor"
                    onClick={() => {
                      setPerfil('Supervisor');
                      setSupervisor('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      perfil === 'Supervisor'
                        ? 'bg-purple-50/80 border-purple-600 text-purple-950 shadow-xs ring-1 ring-purple-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <BadgeCheck className={`w-4 h-4 ${perfil === 'Supervisor' ? 'text-purple-600' : 'text-slate-400'}`} />
                      {perfil === 'Supervisor' && <Check className="w-3.5 h-3.5 text-purple-600 font-bold" />}
                    </div>
                    <p className="text-xs font-bold leading-none">Supervisor</p>
                    <span className="text-[10px] text-slate-500 font-normal mt-1 block">Gestão</span>
                  </button>

                  {/* Gerencial Pill */}
                  <button
                    type="button"
                    id="perfil-btn-gerencial"
                    onClick={() => {
                      setPerfil('Gerencial');
                      setSupervisor('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      perfil === 'Gerencial'
                        ? 'bg-cyan-50/80 border-cyan-600 text-cyan-950 shadow-xs ring-1 ring-cyan-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <BriefcaseBusiness className={`w-4 h-4 ${perfil === 'Gerencial' ? 'text-cyan-600' : 'text-slate-400'}`} />
                      {perfil === 'Gerencial' && <Check className="w-3.5 h-3.5 text-cyan-600 font-bold" />}
                    </div>
                    <p className="text-xs font-bold leading-none">Gerencial</p>
                    <span className="text-[10px] text-slate-500 font-normal mt-1 block">Relatórios</span>
                  </button>

                  {/* Cliente Pill */}
                  <button
                    type="button"
                    id="perfil-btn-cliente"
                    onClick={() => {
                      setPerfil('Cliente');
                      setSupervisor('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      perfil === 'Cliente'
                        ? 'bg-amber-50/80 border-amber-600 text-amber-950 shadow-xs ring-1 ring-amber-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <UserCheck className={`w-4 h-4 ${perfil === 'Cliente' ? 'text-amber-600' : 'text-slate-400'}`} />
                      {perfil === 'Cliente' && <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />}
                    </div>
                    <p className="text-xs font-bold leading-none">Cliente</p>
                    <span className="text-[10px] text-slate-500 font-normal mt-1 block">Consulta</span>
                  </button>

                  {/* ADM Pill */}
                  <button
                    type="button"
                    id="perfil-btn-adm"
                    onClick={() => {
                      setPerfil('ADM');
                      setSupervisor('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      perfil === 'ADM'
                        ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Shield className={`w-4 h-4 ${perfil === 'ADM' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {perfil === 'ADM' && <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
                    </div>
                    <p className="text-xs font-bold leading-none">ADM</p>
                    <span className="text-[10px] text-slate-500 font-normal mt-1 block">Acesso Total</span>
                  </button>

                </div>
              </div>

              {/* 4. SUPERVISOR RESPONSÁVEL (Apenas para perfil Operador) */}
              {perfil === 'Operador' && (
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-indigo-600" />
                    SUPERVISOR RESPONSÁVEL <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Todo operador precisa estar vinculado ao seu supervisor cadastrado no sistema.
                  </p>

                  <select
                    id="select-usuario-supervisor"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    required
                    className="w-full text-xs font-semibold bg-white border border-indigo-300 focus:border-indigo-600 rounded-xl px-3 py-2.5 outline-none shadow-xs text-slate-800"
                  >
                    <option value="">-- Selecione o Supervisor Responsável --</option>
                    {supervisoresDisponiveis.map((sup) => (
                      <option key={sup} value={sup}>
                        {sup}
                      </option>
                    ))}
                  </select>

                  {supervisoresDisponiveis.length === 0 && (
                    <p className="text-[10px] text-amber-700 font-medium">
                      Atenção: Cadastre primeiro um usuário com perfil <strong>Supervisor</strong> antes de vincular operadores.
                    </p>
                  )}
                </div>
              )}

              {/* 5. Matrícula & Email Corporativo (Grid 2 cols) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Matrícula */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    MATRÍCULA / CÓDIGO INTERNO
                  </label>
                  <input
                    id="input-usuario-matricula"
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                    placeholder="Ex: OP-8821 ou SUP-014"
                    className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100 font-mono"
                  />
                </div>

                {/* Email Corporativo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-MAIL CORPORATIVO
                  </label>
                  <input
                    id="input-usuario-email"
                    type="email"
                    value={emailCorporativo}
                    onChange={(e) => setEmailCorporativo(e.target.value.toLowerCase())}
                    placeholder="Ex: wsbarbosa@intervalor.com.br"
                    className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  id="btn-submit-usuario"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {editingId ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>{editingId ? 'Atualizar Usuário' : 'Cadastrar Usuário'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
