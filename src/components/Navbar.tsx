import React from 'react';
import { 
  Headphones, 
  FileSpreadsheet, 
  Database, 
  UserCheck, 
  UserCog,
  LogOut,
  Shield,
  BadgeCheck,
  User as UserIcon
} from 'lucide-react';
import { Usuario } from '../types';

interface NavbarProps {
  activeTab: 'tabulacao' | 'historico' | 'usuarios' | 'supabase';
  setActiveTab: (tab: 'tabulacao' | 'historico' | 'usuarios' | 'supabase') => void;
  currentUser: Usuario | null;
  onLogout: () => void;
  totalTabulacoes: number;
  totalUsuarios?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  totalTabulacoes,
  totalUsuarios,
}) => {
  const isOperador = currentUser?.perfil === 'Operador';
  const isSupervisorOrAdm = currentUser?.perfil === 'Supervisor' || currentUser?.perfil === 'ADM';

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-inner shadow-white/20">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">SIS ATP</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Tabulação
                </span>
              </div>
              <p className="text-xs text-slate-400">Portal de Registro dos Atendimentos</p>
            </div>
          </div>

          {/* Navigation Tabs (Filtered by Role) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            
            {/* Tab: Tabulação (Liberada para todos) */}
            <button
              id="tab-btn-nova-tabulacao"
              onClick={() => setActiveTab('tabulacao')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tabulacao'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Headphones className="w-4 h-4" />
              Tabulação
            </button>

            {/* Tab: Histórico (Liberado para todos, filtrado para operador) */}
            <button
              id="tab-btn-historico"
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'historico'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isOperador ? 'Meu Histórico' : 'Histórico & Relatórios'}
              {totalTabulacoes > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-slate-200">
                  {totalTabulacoes}
                </span>
              )}
            </button>

            {/* Tab: Gestão de Usuários (Apenas Supervisor e ADM) */}
            {isSupervisorOrAdm && (
              <button
                id="tab-btn-usuarios"
                onClick={() => setActiveTab('usuarios')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'usuarios'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UserCog className="w-4 h-4" />
                Usuários
                {totalUsuarios !== undefined && totalUsuarios > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-slate-200">
                    {totalUsuarios}
                  </span>
                )}
              </button>
            )}

            {/* Tab: Supabase (Apenas Supervisor e ADM) */}
            {isSupervisorOrAdm && (
              <button
                id="tab-btn-supabase"
                onClick={() => setActiveTab('supabase')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'supabase'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/30'
                }`}
              >
                <Database className="w-4 h-4" />
                Supabase Ready
              </button>
            )}
          </nav>

          {/* User Profile Badge & Logout Button */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1.5 pl-3">
                
                {/* User Info */}
                <div className="flex items-center gap-2 text-left">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    currentUser.perfil === 'ADM'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : currentUser.perfil === 'Supervisor'
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                  }`}>
                    {currentUser.perfil === 'ADM' ? (
                      <Shield className="w-4 h-4" />
                    ) : currentUser.perfil === 'Supervisor' ? (
                      <BadgeCheck className="w-4 h-4" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="text-xs leading-tight pr-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-100 max-w-[120px] sm:max-w-[160px] truncate" title={currentUser.nome}>
                        {currentUser.nome}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        currentUser.perfil === 'ADM'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : currentUser.perfil === 'Supervisor'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {currentUser.perfil}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>@{currentUser.usuario}</span>
                      {currentUser.perfil === 'Operador' && currentUser.supervisor && (
                        <span className="hidden lg:inline text-slate-400 truncate max-w-[130px]" title={`Supervisor: ${currentUser.supervisor}`}>
                          • Sup: {currentUser.supervisor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Deslogar e encerrar sessão"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>

              </div>
            )}
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('tabulacao')}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded ${
              activeTab === 'tabulacao' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Headphones className="w-4 h-4 mb-0.5" />
            Tabulação
          </button>
          
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded ${
              activeTab === 'historico' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-0.5" />
            Histórico
          </button>

          {isSupervisorOrAdm && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded ${
                activeTab === 'usuarios' ? 'text-indigo-400 font-bold' : 'text-slate-400'
              }`}
            >
              <UserCog className="w-4 h-4 mb-0.5" />
              Usuários
            </button>
          )}

          {isSupervisorOrAdm && (
            <button
              onClick={() => setActiveTab('supabase')}
              className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium rounded ${
                activeTab === 'supabase' ? 'text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Database className="w-4 h-4 mb-0.5" />
              Supabase
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

