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
  ChevronRight
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '../types';
import { formatDateTimeBR, getSaoPauloISOString } from '../utils/cpf';

interface UsuariosViewProps {
  usuarios: Usuario[];
  onSaveUsuario: (usuario: Usuario) => void;
  onDeleteUsuario: (id: string) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  onSaveUsuario,
  onDeleteUsuario,
}) => {
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

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerfil, setFilterPerfil] = useState<string>('Todos');

  // List of active Supervisors available for Operator assignment
  const supervisoresDisponiveis = useMemo(() => {
    const fromList = usuarios
      .filter((u) => u.perfil === 'Supervisor')
      .map((u) => u.nome);
    // Combine with common default supervisors if empty
    const unique = Array.from(new Set(['Carlos Santos Andrade', 'Juliana Rocha Silva', ...fromList]));
    return unique;
  }, [usuarios]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setNome(newNome);
    if (!editingId && (!usuario || usuario.includes('.'))) {
      const parts = newNome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);
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
      createdAt: editingId 
        ? (usuarios.find(u => u.id === editingId)?.createdAt || getSaoPauloISOString()) 
        : getSaoPauloISOString(),
    };

    onSaveUsuario(novoUsuario);
    setFormFeedback({
      type: 'success',
      message: editingId
        ? `Usuário "${novoUsuario.nome}" atualizado com sucesso!`
        : `Usuário "${novoUsuario.nome}" criado com sucesso com perfil de ${novoUsuario.perfil}!`,
    });

    setTimeout(() => {
      resetForm();
    }, 1500);
  };

  // Copy login credentials to clipboard
  const handleCopyCredentials = (u: Usuario) => {
    const text = `Acesso Sistema de Tabulação:\nNome: ${u.nome}\nUsuário: ${u.usuario}\nSenha: ${u.senha}\nPerfil: ${u.perfil}${u.supervisor ? `\nSupervisor: ${u.supervisor}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered Users List
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        u.nome.toLowerCase().includes(q) ||
        u.usuario.toLowerCase().includes(q) ||
        (u.supervisor && u.supervisor.toLowerCase().includes(q)) ||
        (u.matricula && u.matricula.toLowerCase().includes(q));

      const matchPerfil = filterPerfil === 'Todos' || u.perfil === filterPerfil;

      return matchSearch && matchPerfil;
    });
  }, [usuarios, searchTerm, filterPerfil]);

  // Metrics
  const metrics = useMemo(() => {
    const total = usuarios.length;
    const operadores = usuarios.filter((u) => u.perfil === 'Operador').length;
    const supervisores = usuarios.filter((u) => u.perfil === 'Supervisor').length;
    const adms = usuarios.filter((u) => u.perfil === 'ADM').length;
    return { total, operadores, supervisores, adms };
  }, [usuarios]);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <UserCog className="w-3.5 h-3.5" />
              <span>Controle de Acesso & Hierarquia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Criação & Gestão de Usuários
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Cadastre e gerencie acessos com permissões segmentadas entre <strong>Operador</strong>, <strong>Supervisor</strong> e <strong>ADM</strong>.
              A designação de supervisor é associada exclusivamente aos operadores de atendimento.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-slate-400 block">Total Usuários</span>
              <span className="text-xl font-black text-white">{metrics.total}</span>
            </div>
            <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-indigo-300 block">Operadores</span>
              <span className="text-xl font-black text-indigo-400">{metrics.operadores}</span>
            </div>
            <div className="bg-purple-950/60 border border-purple-500/30 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-purple-300 block">Supervisores</span>
              <span className="text-xl font-black text-purple-400">{metrics.supervisores}</span>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-emerald-300 block">ADMs</span>
              <span className="text-xl font-black text-emerald-400">{metrics.adms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================== */}
        {/* 1. FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE USUÁRIO (4 ou 5 cols) */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden sticky top-20">
          
          {/* Card Header */}
          <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                {editingId ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingId ? 'Altere as credenciais e o perfil do usuário' : 'Preencha os campos obrigatórios abaixo'}
                </p>
              </div>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Feedback Alert */}
            {formFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium ${
                  formFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {formFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{formFeedback.message}</span>
              </div>
            )}

            {/* 1. NOME COMPLETO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                NOME <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-usuario-nome"
                type="text"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Wellington Barbosa"
                required
                className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100 font-medium"
              />
            </div>

            {/* 2. USUÁRIO (LOGIN) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  USUÁRIO (Login de Acesso) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">letras minúsculas / sem espaços</span>
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

            {/* 3. SENHA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  SENHA <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">mínimo 6 caracteres</span>
              </label>
              <div className="relative">
                <input
                  id="input-usuario-senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Informe a senha de acesso"
                  required
                  className="w-full text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-600 rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-100 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 4. PERFIL (Operador | Supervisor | ADM) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                PERFIL DE ACESSO <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                
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
                  className={`p-3 rounded-xl border text-left transition-all relative ${
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
                  className={`p-3 rounded-xl border text-left transition-all relative ${
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
                  <span className="text-[10px] text-slate-500 font-normal mt-1 block">Gestão Operacional</span>
                </button>

                {/* ADM Pill */}
                <button
                  type="button"
                  id="perfil-btn-adm"
                  onClick={() => {
                    setPerfil('ADM');
                    setSupervisor('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
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

            {/* 5. SUPERVISOR (APARECE APENAS QUANDO PERFIL === 'Operador') */}
            {perfil === 'Operador' ? (
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-indigo-700" />
                    SUPERVISOR RESPONSÁVEL <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                    Obrigatório para Operador
                  </span>
                </div>
                
                <p className="text-[11px] text-indigo-700 leading-snug">
                  Selecione o supervisor ao qual este operador responderá diretamente.
                </p>

                <select
                  id="select-usuario-supervisor"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  required
                  className="w-full text-sm bg-white border border-indigo-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-2 focus:ring-indigo-200 font-semibold text-slate-800"
                >
                  <option value="">Selecione um supervisor da lista...</option>
                  {supervisoresDisponiveis.map((supNome) => (
                    <option key={supNome} value={supNome}>
                      {supNome} (Supervisor)
                    </option>
                  ))}
                  <option value="Outro Supervisor">Outro Supervisor (Digitar abaixo)</option>
                </select>

                {supervisor === 'Outro Supervisor' && (
                  <input
                    type="text"
                    placeholder="Digite o nome completo do supervisor..."
                    onChange={(e) => setSupervisor(e.target.value)}
                    className="w-full text-sm bg-white border border-indigo-300 rounded-xl px-3.5 py-2 mt-2 outline-none"
                    autoFocus
                  />
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  O campo <strong>Supervisor</strong> não é aplicável para o perfil <strong>{perfil}</strong>.
                </span>
              </div>
            )}

            {/* Optional Secondary Fields Accordion/Row (Matrícula e E-mail) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Matrícula (Opcional)
                </label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ex: OP-8821"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={emailCorporativo}
                  onChange={(e) => setEmailCorporativo(e.target.value)}
                  placeholder="nome@intervalor.com.br"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                id="btn-salvar-usuario"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {editingId ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{editingId ? 'Atualizar Usuário' : 'Cadastrar Usuário'}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

          </form>
        </div>

        {/* ========================================================== */}
        {/* 2. TABELA & LISTAGEM DE USUÁRIOS CADASTRADOS (7 cols)       */}
        {/* ========================================================== */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, usuário, supervisor ou matrícula..."
                className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Profile Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={filterPerfil}
                onChange={(e) => setFilterPerfil(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none font-semibold text-slate-700 cursor-pointer"
              >
                <option value="Todos">Todos os Perfis ({usuarios.length})</option>
                <option value="Operador">Apenas Operadores ({metrics.operadores})</option>
                <option value="Supervisor">Apenas Supervisores ({metrics.supervisores})</option>
                <option value="ADM">Apenas ADMs ({metrics.adms})</option>
              </select>
            </div>

          </div>

          {/* Users Table / Cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Usuários Registrados ({filteredUsuarios.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                {filterPerfil !== 'Todos' ? `Filtrando por ${filterPerfil}` : 'Todos os acessos'}
              </span>
            </div>

            {filteredUsuarios.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <UserCog className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Nenhum usuário encontrado</p>
                <p className="text-xs text-slate-400">
                  {searchTerm ? 'Tente modificar o termo de busca.' : 'Cadastre o primeiro usuário pelo formulário ao lado.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Nome & Matrícula</th>
                      <th className="py-3 px-4">Usuário (Login)</th>
                      <th className="py-3 px-4">Perfil</th>
                      <th className="py-3 px-4">Supervisor</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsuarios.map((u) => (
                      <tr 
                        key={u.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          editingId === u.id ? 'bg-indigo-50/60' : ''
                        }`}
                      >
                        {/* 1. Nome */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.perfil === 'ADM'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.perfil === 'Supervisor'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {u.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{u.nome}</p>
                              {u.matricula && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Matrícula: {u.matricula}
                                </span>
                              )}
                              {u.emailCorporativo && (
                                <p className="text-[10px] text-slate-400">{u.emailCorporativo}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Usuário (Login) */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md font-mono text-[11px] text-slate-800 border border-slate-200">
                            <span>@{u.usuario}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(u)}
                              title="Copiar credenciais de acesso"
                              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
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
                          {u.perfil === 'Operador' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <User className="w-3 h-3 text-indigo-700" />
                              Operador
                            </span>
                          )}
                        </td>

                        {/* 4. Supervisor (Aparece apenas para Operador) */}
                        <td className="py-3.5 px-4">
                          {u.perfil === 'Operador' ? (
                            u.supervisor ? (
                              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                                <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate max-w-[140px]" title={u.supervisor}>
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

                        {/* 5. Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(u)}
                              title="Editar este usuário"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o usuário ${u.nome}?`)) {
                                  onDeleteUsuario(u.id);
                                }
                              }}
                              title="Excluir este usuário"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                Total de <strong>{filteredUsuarios.length}</strong> usuário(s) listado(s).
              </span>
              <span className="text-[11px] text-slate-400">
                Os supervisores cadastrados ficam automaticamente disponíveis para vinculação aos operadores.
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
