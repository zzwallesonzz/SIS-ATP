import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Headphones, 
  BadgeCheck, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Info,
  KeyRound,
  BriefcaseBusiness
} from 'lucide-react';
import { Usuario, PerfilUsuario } from '../types';

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

  const handleSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      // Find user
      const foundUser = usuarios.find(
        (u) => u.usuario.toLowerCase() === cleanUser || (u.matricula && u.matricula.toLowerCase() === cleanUser)
      );

      if (!foundUser) {
        setErrorMessage('Usuário não cadastrado no sistema. Verifique o login digitado.');
        setIsLoading(false);
        return;
      }

      // Check if user is active
      if (foundUser.ativo === false) {
        setErrorMessage('Este usuário está temporariamente desativado. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      // Check password
      // Accept either matching password or standard default 123456
      if (foundUser.senha !== cleanPass && cleanPass !== '123456') {
        setErrorMessage('Senha incorreta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Login success
      setIsLoading(false);
      onLogin(foundUser);
    }, 350);
  };

  // Quick fill helper for testing/demos
  const handleSelectDemoUser = (u: Usuario) => {
    setUsernameInput(u.usuario);
    setPasswordInput(u.senha || '123456');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand & Rules Explanations */}
        <div className="lg:col-span-6 space-y-6 text-white text-center lg:text-left">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Controle de Acesso Autenticado</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              SIS ATP
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Sistema de Tabulação de Atendimento.
            </p>
          </div>

          {/* Profile Access Rules Cards */}
          <div className="space-y-2.5 pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Diretrizes de Perfis e Permissões:
            </p>

            {/* Operador Rule */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-300">Operador</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.2 rounded-full font-semibold">
                    Acesso Operacional
                  </span>
                </div>
                <p className="text-slate-400 mt-1 leading-snug">
                  Tabulação liberada. No <strong>Histórico</strong> visualiza estritamente os acordos realizados por si mesmo. Sem acesso à Base de Alunos ou Gestão de Usuários.
                </p>
              </div>
            </div>

            {/* Supervisor Rule */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-300">Supervisor</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.2 rounded-full font-semibold">
                    Acesso Gerencial
                  </span>
                </div>
                <p className="text-slate-400 mt-1 leading-snug">
                  Visualização de todo o histórico da equipe, acompanhamento de metas, base de alunos e gestão de operadores subordinados.
                </p>
              </div>
            </div>

            {/* Gerencial Rule */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <BriefcaseBusiness className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300">Gerencial</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.2 rounded-full font-semibold">
                    Gestão & Relatórios
                  </span>
                </div>
                <p className="text-slate-400 mt-1 leading-snug">
                  Acesso ao dashboard e gestão de usuários, com restrição explícita à tela <strong>Supabase Ready</strong>.
                </p>
              </div>
            </div>

            {/* ADM Rule */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-300">ADM (Administrador)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full font-semibold">
                    Acesso Total
                  </span>
                </div>
                <p className="text-slate-400 mt-1 leading-snug">
                  Acesso irrestrito a todos os módulos, cadastro e edição de usuários, supervisores, alunos e configurações do banco.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-6 w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Header */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 mx-auto sm:mx-0">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Login - Acessar Sistema
              </h2>
              <p className="text-xs text-slate-400">
                Entre com seu login e senha cadastrados para acessar o sistema
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
                  <span className="text-[10px] text-slate-500 font-normal"></span>
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


          </div>
        </div>

      </div>

    </div>
  );
};
