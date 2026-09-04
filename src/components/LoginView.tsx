import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Headphones, 
  AlertCircle, 
  KeyRound
} from 'lucide-react';
import { Usuario } from '../types';
import { fetchUsuariosSupabase } from '../lib/supabase';

interface LoginViewProps {
  usuarios: Usuario[];
  onLogin: (usuario: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ usuarios, onLogin }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser) {
      setErrorMessage('Por favor, informe seu usuário ou login.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Fetch freshest user data directly from Supabase if available
      let userList = usuarios;
      try {
        const cloudUsrs = await fetchUsuariosSupabase();
        if (cloudUsrs.data && cloudUsrs.data.length > 0) {
          userList = cloudUsrs.data;
        }
      } catch (err) {
        console.warn('Supabase fetch during login fallback to local list:', err);
      }

      // 2. Find user by username or matricula
      const foundUser = userList.find(
        (u) => u.usuario.toLowerCase() === cleanUser || (u.matricula && u.matricula.toLowerCase() === cleanUser)
      );

      if (!foundUser) {
        setErrorMessage('Usuário não cadastrado no sistema. Verifique o login digitado.');
        setIsLoading(false);
        return;
      }

      // 3. Check if user is active
      if (foundUser.ativo === false) {
        setErrorMessage('Este usuário está temporariamente desativado. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      // 4. Strict Password Check (exact match with the updated password in the database)
      if (foundUser.senha !== cleanPass) {
        setErrorMessage('Senha incorreta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // 5. Login success
      setIsLoading(false);
      onLogin(foundUser);
    } catch (e: any) {
      setErrorMessage('Erro ao autenticar. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Login Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Controle de Acesso Autenticado</span>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/30 mx-auto">
              <Headphones className="w-7 h-7" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SIS ATP
            </h1>
            <p className="text-xs text-slate-400">
              Sistema de Tabulação de Atendimento
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Usuário Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                USUÁRIO (Login)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-mono">
                  @
                </span>
                <input
                  id="login-username-input"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Digite seu usuário"
                  autoFocus
                  required
                  className="w-full text-sm bg-slate-950 text-white border border-slate-700 focus:border-indigo-500 rounded-xl pl-8 pr-3.5 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>
            </div>

            {/* Senha Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  SENHA
                </span>
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="w-full text-sm bg-slate-950 text-white border border-slate-700 focus:border-indigo-500 rounded-xl pl-3.5 pr-11 py-3 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Acesso restrito e autenticado. As permissões de cada perfil são gerenciadas em Gestão de Usuários.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
