import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, Sparkles } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CpfSearch } from './components/CpfSearch';
import { AlunoCard } from './components/AlunoCard';
import { AlunoModal } from './components/AlunoModal';
import { TabulacaoForm } from './components/TabulacaoForm';
import { HistoricoTabulacoes } from './components/HistoricoTabulacoes';
import { UsuariosView } from './components/UsuariosView';
import { SupabaseView } from './components/SupabaseModal';
import { DashboardView } from './components/DashboardView';
import { AlunoHistoricoModal } from './components/AlunoHistoricoModal';
import { LoginView } from './components/LoginView';
import { Aluno, Tabulacao, Usuario } from './types';
import { INITIAL_ALUNOS, INITIAL_TABULACOES, INITIAL_USUARIOS } from './data/mockData';
import { cleanDigits } from './utils/cpf';
import {
  saveAlunoSupabase,
  saveTabulacaoSupabase,
  saveUsuarioSupabase,
  deleteUsuarioSupabase,
  fetchAlunosSupabase,
  fetchTabulacoesSupabase,
  fetchUsuariosSupabase
} from './lib/supabase';

export default function App() {
  // Persistence State for Users
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const saved = localStorage.getItem('tabulacoes_usuarios_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USUARIOS;
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    try {
      const savedUser = localStorage.getItem('tabulacoes_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Validate user still exists in current user base
        const match = (JSON.parse(localStorage.getItem('tabulacoes_usuarios_db') || '[]') as Usuario[]).find(
          (u) => u.id === parsed.id
        ) || INITIAL_USUARIOS.find((u) => u.id === parsed.id);
        return match || parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'tabulacao' | 'historico' | 'dashboard' | 'usuarios' | 'supabase'>('tabulacao');

  // Operator identification (derived from currentUser)
  const [atendenteNome, setAtendenteNome] = useState<string>(() => currentUser?.nome || 'Wellington Barbosa');
  const [matriculaAtendente, setMatriculaAtendente] = useState<string>(() => currentUser?.matricula || 'OP-8821');

  // Sync attendants info whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setAtendenteNome(currentUser.nome);
      setMatriculaAtendente(currentUser.matricula || `@${currentUser.usuario}`);

      // Role protection: If Operador, prevent accessing forbidden tabs
      if (currentUser.perfil === 'Operador' && activeTab !== 'tabulacao' && activeTab !== 'historico' && activeTab !== 'dashboard') {
        setActiveTab('tabulacao');
      }

      // Gerencial cannot access Supabase Ready screen
      if (currentUser.perfil === 'Gerencial' && activeTab === 'supabase') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  // Persistence State for Students and Tabulations
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    try {
      const saved = localStorage.getItem('tabulacoes_alunos_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ALUNOS;
  });

  const [tabulacoes, setTabulacoes] = useState<Tabulacao[]>(() => {
    try {
      const saved = localStorage.getItem('tabulacoes_records_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TABULACOES;
  });

  // Auto-sync from Supabase on start if available
  const loadCloudData = async () => {
    try {
      const [cloudAlunos, cloudTabs, cloudUsrs] = await Promise.all([
        fetchAlunosSupabase(),
        fetchTabulacoesSupabase(),
        fetchUsuariosSupabase(),
      ]);

      if (cloudAlunos.data && cloudAlunos.data.length > 0) {
        setAlunos(cloudAlunos.data);
      }
      if (cloudTabs.data && cloudTabs.data.length > 0) {
        setTabulacoes(cloudTabs.data);
      }
      if (cloudUsrs.data && cloudUsrs.data.length > 0) {
        setUsuarios(cloudUsrs.data);
      }
    } catch (err) {
      console.warn('Supabase auto-fetch check:', err);
    }
  };

  useEffect(() => {
    loadCloudData();
  }, []);

  // Active Selected Student & Search State (starts empty until searched or registered)
  const [currentCpf, setCurrentCpf] = useState<string>('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);

  // Modal States
  const [isAlunoModalOpen, setIsAlunoModalOpen] = useState(false);
  const [alunoToEdit, setAlunoToEdit] = useState<Aluno | null>(null);
  const [initialCpfForModal, setInitialCpfForModal] = useState<string>('');
  const [isHistoricoAlunoModalOpen, setIsHistoricoAlunoModalOpen] = useState(false);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('tabulacoes_alunos_db', JSON.stringify(alunos));
    } catch (e) {
      console.error('Error saving alunos:', e);
    }
  }, [alunos]);

  useEffect(() => {
    try {
      localStorage.setItem('tabulacoes_records_db', JSON.stringify(tabulacoes));
    } catch (e) {
      console.error('Error saving tabulacoes:', e);
    }
  }, [tabulacoes]);

  useEffect(() => {
    try {
      localStorage.setItem('tabulacoes_usuarios_db', JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error saving usuarios:', e);
    }
  }, [usuarios]);

  // Login & Logout Handlers
  const handleLogin = (user: Usuario) => {
    setCurrentUser(user);
    setAtendenteNome(user.nome);
    setMatriculaAtendente(user.matricula || `@${user.usuario}`);
    setActiveTab('tabulacao');
    try {
      localStorage.setItem('tabulacoes_current_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('tabulacao');
    try {
      localStorage.removeItem('tabulacoes_current_user');
    } catch (e) {
      console.error(e);
    }
  };

  // User Management Handlers
  const handleSaveUsuario = (user: Usuario) => {
    setUsuarios((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        return copy;
      }
      return [user, ...prev];
    });

    // Background sync to Supabase
    saveUsuarioSupabase(user).catch((e) => console.warn('Supabase save user sync:', e));

    // If current logged-in user was updated, sync state
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
      localStorage.setItem('tabulacoes_current_user', JSON.stringify(user));
    }
  };

  const handleDeleteUsuario = (id: string) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    deleteUsuarioSupabase(id).catch((e) => console.warn('Supabase delete user sync:', e));

    if (currentUser && currentUser.id === id) {
      handleLogout();
    }
  };

  // Search Aluno by CPF
  const handleSearchCpf = async (cpfToSearch: string) => {
    const rawQuery = cleanDigits(cpfToSearch);
    if (!rawQuery) {
      setSelectedAluno(null);
      setSearchAttempted(false);
      return;
    }

    setSearchAttempted(true);

    const findAlunoByCpf = (items: Aluno[]) => items.find((a) => cleanDigits(String(a.cpf || '')) === rawQuery);
    const found = findAlunoByCpf(alunos);

    if (found) {
      setSelectedAluno(found);
      return;
    }

    try {
      const cloudResult = await fetchAlunosSupabase();
      if (cloudResult.data && cloudResult.data.length > 0) {
        setAlunos(cloudResult.data);
        const syncedFound = findAlunoByCpf(cloudResult.data);
        setSelectedAluno(syncedFound || null);
        return;
      }
    } catch (err) {
      console.warn('Falha ao recarregar alunos do Supabase na busca por CPF:', err);
    }

    setSelectedAluno(null);
  };

  // Save or Update Aluno
  const handleSaveAluno = (aluno: Aluno) => {
    const exists = alunos.some((a) => a.id === aluno.id || cleanDigits(a.cpf) === cleanDigits(aluno.cpf));
    
    if (exists) {
      setAlunos((prev) =>
        prev.map((a) => (a.id === aluno.id || cleanDigits(a.cpf) === cleanDigits(aluno.cpf) ? aluno : a))
      );
    } else {
      setAlunos((prev) => [aluno, ...prev]);
    }

    // Background sync to Supabase
    saveAlunoSupabase(aluno).catch((e) => console.warn('Supabase save aluno sync:', e));

    // Auto-select this student for immediate tabulation
    setSelectedAluno(aluno);
    setCurrentCpf(aluno.cpf);
    setSearchAttempted(false);
    setActiveTab('tabulacao');
  };

  // Feedback de Sucesso após Salvar Tabulação
  const [successToastMessage, setSuccessToastMessage] = useState<string | null>(null);

  // Save new Tabulação
  const handleSaveTabulacao = async (novaTab: Tabulacao) => {
    // 1. Atualiza estado local imediatamente para fluidez do operador
    setTabulacoes((prev) => [novaTab, ...prev]);

    // 2. Garante que o aluno também esteja sincronizado no Supabase
    if (selectedAluno) {
      saveAlunoSupabase(selectedAluno).catch((err) => {
        console.warn('Erro ao sincronizar aluno com Supabase:', err);
      });
    }

    // 3. Sincronização direta no banco de dados Supabase
    try {
      const syncRes = await saveTabulacaoSupabase(novaTab);
      if (syncRes.error) {
        console.warn('Aviso de gravação no banco Supabase:', syncRes.error);
        setSuccessToastMessage('Acionamento Realizado Com Sucesso');
      } else {
        console.log('Tabulação gravada no Supabase com sucesso:', syncRes.data?.protocolo);
        setSuccessToastMessage('Acionamento Realizado Com Sucesso (Gravado no Banco Supabase)');
      }
    } catch (e) {
      console.warn('Exceção ao persistir no Supabase:', e);
      setSuccessToastMessage('Acionamento Realizado Com Sucesso');
    }

    // 4. Temporizador de 3 segundos para limpar o formulário e resetar para consulta de CPF
    setTimeout(() => {
      setSuccessToastMessage(null);
      setSelectedAluno(null);
      setCurrentCpf('');
      setSearchAttempted(false);
    }, 3000);
  };

  // Reset tabulação to initial CPF search view
  const handleResetTabulacao = () => {
    setSelectedAluno(null);
    setCurrentCpf('');
    setSearchAttempted(false);
  };

  // Open Modal for New Aluno
  const handleOpenNovoAlunoModal = (preFillCpf?: string) => {
    setAlunoToEdit(null);
    setInitialCpfForModal(preFillCpf || currentCpf || '');
    setIsAlunoModalOpen(true);
  };

  // Open Modal for Edit Aluno
  const handleEditAluno = (aluno: Aluno) => {
    setAlunoToEdit(aluno);
    setInitialCpfForModal(aluno.cpf);
    setIsAlunoModalOpen(true);
  };

  // Callback to sync loaded data from Supabase
  const handleSyncFromSupabase = (newAlunos: Aluno[], newTabs: Tabulacao[], newUsrs: Usuario[]) => {
    if (newAlunos.length > 0) setAlunos(newAlunos);
    if (newTabs.length > 0) setTabulacoes(newTabs);
    if (newUsrs.length > 0) setUsuarios(newUsrs);
  };

  // Filter attendances for active student
  const historicoAlunoAtivo = selectedAluno
    ? tabulacoes.filter((t) => cleanDigits(t.alunoCpf) === cleanDigits(selectedAluno.cpf))
    : [];

  // If no user is authenticated, render Login Screen
  if (!currentUser) {
    return <LoginView usuarios={usuarios} onLogin={handleLogin} />;
  }

  const isOperador = currentUser.perfil === 'Operador';
  const isAdm = currentUser.perfil === 'ADM';
  const isGerencial = currentUser.perfil === 'Gerencial';
  const isSupervisorOrAdm = currentUser.perfil === 'Supervisor' || isGerencial || isAdm;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        totalTabulacoes={tabulacoes.length}
        totalUsuarios={usuarios.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Nova Tabulação de Atendimento (Liberada para Operador, Supervisor e ADM) */}
        {activeTab === 'tabulacao' && (
          <div className="space-y-6">
            
            {/* Notificação de Acionamento Realizado com Sucesso (3 segundos) */}
            {successToastMessage && (
              <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500 flex items-center justify-between animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
                      {successToastMessage}
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                    </h4>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Atendimento registrado no sistema com sucesso.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-emerald-700/80 px-2.5 py-1 rounded-full border border-emerald-500/50">
                  3s
                </span>
              </div>
            )}

            {/* Step 1: CPF Search & Identification */}
            <CpfSearch
              currentCpf={currentCpf}
              onCpfChange={setCurrentCpf}
              onSearch={handleSearchCpf}
              selectedAluno={selectedAluno}
              searchAttempted={searchAttempted}
              onOpenNovoAlunoModal={handleOpenNovoAlunoModal}
              onClear={handleResetTabulacao}
            />

            {/* As demais opções (Dados do Aluno e Formulário de Tabulação) são carregadas SOMENTE após consultar/selecionar o aluno */}
            {selectedAluno ? (
              <>
                {/* Step 2: Student Academic & Contact Card */}
                <AlunoCard
                  aluno={selectedAluno}
                  onEditAluno={handleEditAluno}
                  historicoAluno={historicoAlunoAtivo}
                  onOpenHistoricoAluno={() => setIsHistoricoAlunoModalOpen(true)}
                />

                {/* Step 3: Tabulation Form */}
                <TabulacaoForm
                  selectedAluno={selectedAluno}
                  atendenteNome={atendenteNome}
                  matriculaAtendente={matriculaAtendente}
                  onSaveTabulacao={handleSaveTabulacao}
                  onOpenNovoAlunoModal={() => handleOpenNovoAlunoModal(currentCpf)}
                  onResetForm={handleResetTabulacao}
                />
              </>
            ) : (
              <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
                  <Search className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  Aguardando Identificação do Aluno
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1.5 leading-relaxed">
                  Digite o CPF no campo acima e clique no botão <strong>Consultar Aluno</strong> para carregar os dados acadêmicos e o formulário de tabulação. Caso o aluno não possua cadastro, clique em <strong>Cadastrar Novo</strong>.
                </p>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Histórico e Relatórios (Operador visualiza somente o que realizou; Supervisor e ADM visualizam tudo) */}
        {activeTab === 'historico' && (
          <HistoricoTabulacoes
            tabulacoes={tabulacoes}
            alunos={alunos}
            currentUser={currentUser}
            onSelectAlunoCpf={(cpf) => {
              setCurrentCpf(cpf);
              handleSearchCpf(cpf);
              setActiveTab('tabulacao');
            }}
          />
        )}

        {/* Tab 3: Dashboard Operacional */}
        {activeTab === 'dashboard' && (
          <DashboardView tabulacoes={tabulacoes} usuarios={usuarios} />
        )}

        {/* Tab 4: Gestão de Usuários (Apenas Supervisor e ADM) */}
        {activeTab === 'usuarios' && isSupervisorOrAdm && (
          <UsuariosView
            usuarios={usuarios}
            onSaveUsuario={handleSaveUsuario}
            onDeleteUsuario={handleDeleteUsuario}
          />
        )}

        {/* Tab 4: Conexão Supabase (Apenas ADM) */}
        {activeTab === 'supabase' && isAdm && (
          <SupabaseView
            alunos={alunos}
            tabulacoes={tabulacoes}
            usuarios={usuarios}
            onSyncFromSupabase={handleSyncFromSupabase}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Sistema de Tabulação de Atendimento ao Aluno • Controle de Acessos por Perfil
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Usuário: <strong>{currentUser.nome}</strong> ({currentUser.perfil})</span>
            <span>•</span>
            <span>Tabulações: <strong>{tabulacoes.length}</strong></span>
            {isAdm && (
              <>
                <span>•</span>
                <span>Usuários: <strong>{usuarios.length}</strong></span>
                <span>•</span>
                <span>Alunos na Base: <strong>{alunos.length}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Supabase: Conectado</span>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modal: Cadastrar / Editar Aluno */}
      <AlunoModal
        isOpen={isAlunoModalOpen}
        onClose={() => setIsAlunoModalOpen(false)}
        onSave={handleSaveAluno}
        alunoToEdit={alunoToEdit}
        initialCpf={initialCpfForModal}
      />

      {/* Modal: Histórico de Atendimentos do Aluno Ativo */}
      <AlunoHistoricoModal
        isOpen={isHistoricoAlunoModalOpen}
        onClose={() => setIsHistoricoAlunoModalOpen(false)}
        aluno={selectedAluno}
        historico={historicoAlunoAtivo}
      />

    </div>
  );
}
