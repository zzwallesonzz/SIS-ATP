import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, Sparkles, AlertCircle, X, Copy, Check } from 'lucide-react';
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
import { BaseAtendimento } from './components/BaseAtendimento';
import { Aluno, BaseAtendimentoItem, Tabulacao, Usuario } from './types';
import { INITIAL_ALUNOS, INITIAL_BASE_ATENDIMENTO, INITIAL_TABULACOES, INITIAL_USUARIOS } from './data/mockData';
import { cleanDigits, normalizeCpf, formatCompleteCPF, getSaoPauloISOString } from './utils/cpf';
import {
  saveAlunoSupabase,
  saveTabulacaoSupabase,
  saveUsuarioSupabase,
  deleteUsuarioSupabase,
  fetchAlunosSupabase,
  fetchTabulacoesSupabase,
  fetchUsuariosSupabase,
  fetchBaseAtendimentoSupabase,
  saveBaseAtendimentoItemSupabase,
  saveBaseAtendimentoBatchSupabase,
  deleteBaseAtendimentoItemSupabase,
  searchAlunoByCpfSupabase,
  searchAlunosByCpfSupabase,
  subscribeToRealtimePresence,
  subscribeToDatabaseChanges,
  PresenceUser
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
  const [activeTab, setActiveTab] = useState<'tabulacao' | 'historico' | 'dashboard' | 'base_atendimento' | 'usuarios' | 'supabase'>('tabulacao');

  // Realtime Presence State (Track who is online in real-time across all browser sessions)
  const [onlineUsersMap, setOnlineUsersMap] = useState<Record<string, PresenceUser>>({});
  const presenceSubRef = useRef<{
    track: (u: Usuario) => Promise<void>;
    untrack: () => Promise<void>;
    broadcastForceLogout: (targetUserId: string, targetUsuario: string) => Promise<void>;
    unsubscribe: () => void;
  } | null>(null);

  // Operator identification (derived from currentUser)
  const [atendenteNome, setAtendenteNome] = useState<string>(() => currentUser?.nome || 'Wellington Barbosa');
  const [matriculaAtendente, setMatriculaAtendente] = useState<string>(() => currentUser?.matricula || 'OP-8821');

  // Sync attendants info whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setAtendenteNome(currentUser.nome);
      setMatriculaAtendente(currentUser.matricula || `@${currentUser.usuario}`);

      // Role protection: Cliente can access only Histórico, Base and Dashboard
      if (currentUser.perfil === 'Cliente' && activeTab !== 'historico' && activeTab !== 'dashboard' && activeTab !== 'base_atendimento') {
        setActiveTab('historico');
      }

      // Role protection: If Operador, prevent accessing forbidden tabs
      if (currentUser.perfil === 'Operador' && activeTab !== 'tabulacao' && activeTab !== 'historico' && activeTab !== 'dashboard' && activeTab !== 'base_atendimento') {
        setActiveTab('tabulacao');
      }

      // Gerencial cannot access Supabase Ready screen
      if (currentUser.perfil === 'Gerencial' && activeTab === 'supabase') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  // Set of known mock CPF and Protocol identifiers to purge permanently from local storage
  const MOCK_CPFS = new Set([
    '12345678900',
    '98765432111',
    '45678912322',
    '78912345633',
    '32165498744',
  ]);

  const MOCK_PROTOCOLS = new Set([
    'ATD-20260829-1042',
    'ATD-20260828-9820',
    'ATD-20260827-4412',
    'ATD-20260826-3390',
    'ATD-20260825-7711',
    'ATD-20260825-8822',
    'ATD-20260824-1133',
    'ATD-20260823-9944',
  ]);

  const isMockAluno = (a: Partial<Aluno>): boolean => {
    if (!a) return false;
    if (a.id && (a.id.startsWith('alu-0') || a.id.startsWith('alu-'))) return true;
    const digits = cleanDigits(a.cpf || '');
    if (MOCK_CPFS.has(digits)) return true;
    return false;
  };

  const isMockTabulacao = (t: Partial<Tabulacao>): boolean => {
    if (!t) return false;
    if (t.id && (t.id.startsWith('tab-0') || t.id.startsWith('tab-'))) return true;
    if (t.protocolo && MOCK_PROTOCOLS.has(t.protocolo)) return true;
    return false;
  };

  // Persistence State for Students and Tabulations
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    try {
      const saved = localStorage.getItem('tabulacoes_alunos_db');
      if (saved) {
        const parsed: Aluno[] = JSON.parse(saved);
        return parsed.filter((a) => !isMockAluno(a));
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ALUNOS;
  });

  const [tabulacoes, setTabulacoes] = useState<Tabulacao[]>(() => {
    try {
      const saved = localStorage.getItem('tabulacoes_records_db');
      if (saved) {
        const parsed: Tabulacao[] = JSON.parse(saved);
        return parsed.filter((t) => !isMockTabulacao(t));
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TABULACOES;
  });

  // Limpeza automática imediata de dados mockados no localStorage
  useEffect(() => {
    try {
      const savedA = localStorage.getItem('tabulacoes_alunos_db');
      if (savedA) {
        const parsedA: Aluno[] = JSON.parse(savedA);
        const filteredA = parsedA.filter((a) => !isMockAluno(a));
        localStorage.setItem('tabulacoes_alunos_db', JSON.stringify(filteredA));
        setAlunos(filteredA);
      }
      const savedT = localStorage.getItem('tabulacoes_records_db');
      if (savedT) {
        const parsedT: Tabulacao[] = JSON.parse(savedT);
        const filteredT = parsedT.filter((t) => !isMockTabulacao(t));
        localStorage.setItem('tabulacoes_records_db', JSON.stringify(filteredT));
        setTabulacoes(filteredT);
      }
    } catch (err) {
      console.warn('Erro ao purgar dados mock do localStorage:', err);
    }
  }, []);

  // Persistence State for Base de Atendimento (Campanha WhatsApp)
  const [baseAtendimento, setBaseAtendimento] = useState<BaseAtendimentoItem[]>(() => {
    try {
      const saved = localStorage.getItem('tabulacoes_base_atendimento_db');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BASE_ATENDIMENTO;
  });

  // Handlers para remoção de registros locais
  const handleClearLocalRecords = () => {
    setAlunos((prev) => {
      const filtered = prev.filter((a) => !isMockAluno(a));
      try {
        localStorage.setItem('tabulacoes_alunos_db', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    setTabulacoes((prev) => {
      const filtered = prev.filter((t) => !isMockTabulacao(t));
      try {
        localStorage.setItem('tabulacoes_records_db', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    loadCloudData(true);
  };

  const handleDeleteSingleLocalAluno = (aluno: Aluno) => {
    setAlunos((prev) => {
      const targetCpf = cleanDigits(aluno.cpf);
      const targetMat = (aluno.matricula || aluno.ra || '').trim().toLowerCase();
      const next = prev.filter(
        (a) =>
          !(
            cleanDigits(a.cpf) === targetCpf &&
            (a.matricula || a.ra || '').trim().toLowerCase() === targetMat
          ) && a.id !== aluno.id
      );
      try {
        localStorage.setItem('tabulacoes_alunos_db', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleDeleteSingleLocalTabulacao = (tab: Tabulacao) => {
    setTabulacoes((prev) => {
      const next = prev.filter((t) => t.protocolo !== tab.protocolo && t.id !== tab.id);
      try {
        localStorage.setItem('tabulacoes_records_db', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Initial Cloud Data Load (Cached & Throttled)
  const loadCloudData = async (force = false) => {
    try {
      const [cloudAlunos, cloudTabs, cloudUsrs, cloudBase] = await Promise.all([
        fetchAlunosSupabase(force),
        fetchTabulacoesSupabase(force),
        fetchUsuariosSupabase(force),
        fetchBaseAtendimentoSupabase(force),
      ]);

      if (cloudAlunos.data && cloudAlunos.data.length > 0) {
        setAlunos((prev) => {
          const cleanPrev = prev.filter((a) => !isMockAluno(a));
          const cloudSet = new Set(
            cloudAlunos.data!.map(
              (a) => `${cleanDigits(a.cpf)}|${(a.matricula || a.ra || '').trim().toLowerCase()}`
            )
          );
          // Mantém registros cadastrados localmente que ainda não subiram para o Supabase (e não são mock)
          const localOnly = cleanPrev.filter(
            (l) => !cloudSet.has(`${cleanDigits(l.cpf)}|${(l.matricula || l.ra || '').trim().toLowerCase()}`)
          );
          return [...localOnly, ...cloudAlunos.data!];
        });
      }
      if (cloudTabs.data && cloudTabs.data.length > 0) {
        setTabulacoes((prev) => {
          const cleanPrev = prev.filter((t) => !isMockTabulacao(t));
          const cloudProtocols = new Set(cloudTabs.data!.map((t) => t.protocolo));
          const localOnly = cleanPrev.filter((l) => !cloudProtocols.has(l.protocolo));
          return [...localOnly, ...cloudTabs.data!];
        });
      }
      if (cloudUsrs.data && cloudUsrs.data.length > 0) {
        setUsuarios((prev) => {
          const cloudUsernames = new Set(cloudUsrs.data!.map((u) => u.usuario.toLowerCase()));
          const localOnly = prev.filter((l) => !cloudUsernames.has(l.usuario.toLowerCase()));
          return [...localOnly, ...cloudUsrs.data!];
        });
      }
      if (cloudBase.data && cloudBase.data.length > 0) {
        setBaseAtendimento((prev) => {
          const cloudMats = new Set(cloudBase.data!.map((b) => b.matricula.toLowerCase()));
          const localOnly = prev.filter((l) => !cloudMats.has(l.matricula.toLowerCase()));
          return [...localOnly, ...cloudBase.data!];
        });
      }
    } catch (err) {
      console.warn('Supabase initial fetch check:', err);
    }
  };

  // Real-time zero-egress row-level database updates & initial load
  useEffect(() => {
    // 1. Initial background load once on startup (force fresh complete dataset)
    loadCloudData(true);

    // 2. Ultra-lightweight Realtime Row Stream (pushes only modified rows, eliminating polling egress)
    const dbSub = subscribeToDatabaseChanges(
      // Tabulações realtime events
      (event, row, oldId) => {
        if (event === 'INSERT' && row) {
          setTabulacoes((prev) => {
            const exists = prev.some((t) => t.id === row.id || t.protocolo === row.protocolo);
            return exists ? prev : [row, ...prev];
          });
        } else if (event === 'UPDATE' && row) {
          setTabulacoes((prev) =>
            prev.map((t) => (t.id === row.id || t.protocolo === row.protocolo ? row : t))
          );
        } else if (event === 'DELETE' && oldId) {
          setTabulacoes((prev) => prev.filter((t) => t.id !== oldId));
        }
      },
      // Alunos realtime events
      (event, row, oldId) => {
        if (event === 'INSERT' && row) {
          setAlunos((prev) => {
            const exists = prev.some((a) => a.id === row.id || normalizeCpf(a.cpf) === normalizeCpf(row.cpf));
            return exists ? prev : [row, ...prev];
          });
        } else if (event === 'UPDATE' && row) {
          setAlunos((prev) =>
            prev.map((a) => (a.id === row.id || normalizeCpf(a.cpf) === normalizeCpf(row.cpf) ? row : a))
          );
        } else if (event === 'DELETE' && oldId) {
          setAlunos((prev) => prev.filter((a) => a.id !== oldId));
        }
      },
      // Usuários realtime events
      (event, row, oldId) => {
        if (event === 'INSERT' && row) {
          setUsuarios((prev) => {
            const exists = prev.some((u) => u.id === row.id || u.usuario.toLowerCase() === row.usuario.toLowerCase());
            return exists ? prev : [row, ...prev];
          });
        } else if (event === 'UPDATE' && row) {
          setUsuarios((prev) =>
            prev.map((u) => (u.id === row.id || u.usuario.toLowerCase() === row.usuario.toLowerCase() ? row : u))
          );
        } else if (event === 'DELETE' && oldId) {
          setUsuarios((prev) => prev.filter((u) => u.id !== oldId));
        }
      },
      // Base de Atendimento realtime events
      (event, row, oldId) => {
        if (event === 'INSERT' && row) {
          setBaseAtendimento((prev) => {
            const exists = prev.some((b) => b.id === row.id || b.matricula.toLowerCase() === row.matricula.toLowerCase());
            return exists ? prev : [row, ...prev];
          });
        } else if (event === 'UPDATE' && row) {
          setBaseAtendimento((prev) =>
            prev.map((b) => (b.id === row.id ? row : b))
          );
        } else if (event === 'DELETE' && oldId) {
          setBaseAtendimento((prev) => prev.filter((b) => b.id !== oldId));
        }
      }
    );

    return () => {
      dbSub.unsubscribe();
    };
  }, []);

  // Connect to Supabase Realtime Presence Channel for multi-user status
  useEffect(() => {
    const sub = subscribeToRealtimePresence(
      currentUser,
      (onlineMap) => {
        setOnlineUsersMap(onlineMap);
      },
      (targetUserId, targetUsuario) => {
        // Handle remote force-logout broadcast
        if (currentUser) {
          const isTarget =
            (targetUserId && currentUser.id === targetUserId) ||
            (targetUsuario && currentUser.usuario.toLowerCase() === targetUsuario.toLowerCase());
          if (isTarget) {
            handleLogout();
          }
        }
      }
    );

    presenceSubRef.current = sub;

    return () => {
      sub.unsubscribe();
      presenceSubRef.current = null;
    };
  }, [currentUser?.id, currentUser?.usuario]);

  // Active Selected Student & Search State (starts empty until searched or registered)
  const [currentCpf, setCurrentCpf] = useState<string>('');
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [matchingAlunos, setMatchingAlunos] = useState<Aluno[]>([]);
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);

  // Modal States
  const [isAlunoModalOpen, setIsAlunoModalOpen] = useState(false);
  const [isNewMatriculaModal, setIsNewMatriculaModal] = useState(false);
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

  useEffect(() => {
    try {
      localStorage.setItem('tabulacoes_base_atendimento_db', JSON.stringify(baseAtendimento));
    } catch (e) {
      console.error('Error saving base_atendimento:', e);
    }
  }, [baseAtendimento]);

  // Login & Logout Handlers
  const handleLogin = (user: Usuario) => {
    const nowIso = getSaoPauloISOString();
    const updatedUser: Usuario = {
      ...user,
      ultimoLogin: nowIso,
      isOnline: true,
    };

    setCurrentUser(updatedUser);
    setAtendenteNome(user.nome);
    setMatriculaAtendente(user.matricula || `@${user.usuario}`);
    setActiveTab('tabulacao');

    // Update in user list as well
    setUsuarios((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id || u.usuario.toLowerCase() === user.usuario.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedUser;
        return copy;
      }
      return [updatedUser, ...prev];
    });

    try {
      localStorage.setItem('tabulacoes_current_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error(e);
    }

    // Broadcast presence online immediately
    presenceSubRef.current?.track(updatedUser);
  };

  const handleLogout = () => {
    presenceSubRef.current?.untrack();
    if (currentUser) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, isOnline: false } : u))
      );
    }
    setCurrentUser(null);
    setActiveTab('tabulacao');
    try {
      localStorage.removeItem('tabulacoes_current_user');
    } catch (e) {
      console.error(e);
    }
  };

  // Force disconnect / logout another user (e.g. from Supervisor/ADM UsuariosView)
  const handleForceLogoutUsuario = (userId: string) => {
    const targetUser = usuarios.find((u) => u.id === userId);
    const targetUsuario = targetUser?.usuario || '';

    setUsuarios((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isOnline: false } : u))
    );

    // Broadcast force-logout to the specific user session across all clients in real-time
    presenceSubRef.current?.broadcastForceLogout(userId, targetUsuario);

    // If the logged-out user is the current session, log out immediately
    if (currentUser && (currentUser.id === userId || (targetUsuario && currentUser.usuario.toLowerCase() === targetUsuario.toLowerCase()))) {
      handleLogout();
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
    saveUsuarioSupabase(user).then(({ error }) => {
      if (error) {
        console.warn('Supabase save user sync:', error);
      }
    }).catch((e) => console.warn('Supabase save user sync:', e));

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

  // Select specific Aluno matrícula
  const handleSelectAluno = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setCurrentCpf(aluno.cpf);
  };

  // Search Aluno by CPF (supports multiple matriculas for same CPF)
  const handleSearchCpf = async (cpfToSearch: string) => {
    const rawQuery = normalizeCpf(cpfToSearch);
    if (!rawQuery) {
      setSelectedAluno(null);
      setMatchingAlunos([]);
      setSearchAttempted(false);
      return;
    }

    setSearchAttempted(true);

    // 1. Gather all local matching alunos with this CPF
    const localMatches = alunos.filter((a) => normalizeCpf(a.cpf) === rawQuery);
    let allMatches: Aluno[] = [...localMatches];

    // 2. Query Supabase directly for this CPF to catch all matriculas registered
    try {
      const dbSearch = await searchAlunosByCpfSupabase(cpfToSearch);
      if (dbSearch.data && dbSearch.data.length > 0) {
        for (const remoteAluno of dbSearch.data) {
          const alreadyInList = allMatches.some(
            (m) =>
              m.id === remoteAluno.id ||
              (normalizeCpf(m.cpf) === normalizeCpf(remoteAluno.cpf) &&
                (m.matricula || '').trim() === (remoteAluno.matricula || '').trim())
          );
          if (!alreadyInList) {
            allMatches.push(remoteAluno);
          }
        }

        // Also ensure main alunos list has the remote ones
        setAlunos((prev) => {
          const updated = [...prev];
          for (const ra of dbSearch.data!) {
            const idx = updated.findIndex(
              (a) =>
                a.id === ra.id ||
                (normalizeCpf(a.cpf) === normalizeCpf(ra.cpf) &&
                  (a.matricula || '').trim() === (ra.matricula || '').trim())
            );
            if (idx >= 0) {
              updated[idx] = ra;
            } else {
              updated.unshift(ra);
            }
          }
          return updated;
        });
      }
    } catch (err) {
      console.warn('Falha na busca de aluno no Supabase por CPF:', err);
    }

    setMatchingAlunos(allMatches);

    if (allMatches.length > 0) {
      // Keep previously selected if still valid, else select the first one
      setSelectedAluno((prevSelected) => {
        if (
          prevSelected &&
          allMatches.some(
            (m) =>
              m.id === prevSelected.id ||
              (normalizeCpf(m.cpf) === normalizeCpf(prevSelected.cpf) &&
                (m.matricula || '').trim() === (prevSelected.matricula || '').trim())
          )
        ) {
          return (
            allMatches.find(
              (m) =>
                m.id === prevSelected.id ||
                (normalizeCpf(m.cpf) === normalizeCpf(prevSelected.cpf) &&
                  (m.matricula || '').trim() === (prevSelected.matricula || '').trim())
            ) || allMatches[0]
          );
        }
        return allMatches[0];
      });
    } else {
      setSelectedAluno(null);
    }
  };

  // Feedback de Sucesso/Alerta após Salvar Aluno
  const [alunoSyncFeedback, setAlunoSyncFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    sqlHint?: string;
  } | null>(null);
  const [copiedSqlHint, setCopiedSqlHint] = useState(false);

  // Save or Update Aluno (distinguishing between editing same matricula or registering a new matricula for same CPF)
  const handleSaveAluno = async (aluno: Aluno) => {
    const formattedAluno = {
      ...aluno,
      cpf: formatCompleteCPF(aluno.cpf),
    };

    const cleanMat = (formattedAluno.matricula || '').trim();
    const cleanCpf = normalizeCpf(formattedAluno.cpf);

    // An enrollment is only identical if it matches the id OR (same CPF and same matricula)
    const exists = alunos.some(
      (a) =>
        a.id === formattedAluno.id ||
        (normalizeCpf(a.cpf) === cleanCpf && (a.matricula || '').trim() === cleanMat)
    );
    
    if (exists) {
      setAlunos((prev) =>
        prev.map((a) =>
          a.id === formattedAluno.id ||
          (normalizeCpf(a.cpf) === cleanCpf && (a.matricula || '').trim() === cleanMat)
            ? formattedAluno
            : a
        )
      );
    } else {
      // Adding as a distinct record (e.g. new enrollment for existing CPF)
      setAlunos((prev) => [formattedAluno, ...prev]);
    }

    // Update matchingAlunos for the active search
    setMatchingAlunos((prev) => {
      const filtered = prev.filter(
        (a) =>
          a.id !== formattedAluno.id &&
          !(normalizeCpf(a.cpf) === cleanCpf && (a.matricula || '').trim() === cleanMat)
      );
      return [formattedAluno, ...filtered];
    });

    // Auto-select this specific student enrollment for immediate tabulation
    setSelectedAluno(formattedAluno);
    setCurrentCpf(formattedAluno.cpf);
    setSearchAttempted(false);
    setActiveTab('tabulacao');

    // Supabase save with explicit error detection and feedback
    try {
      const syncResult = await saveAlunoSupabase(formattedAluno);
      if (syncResult && syncResult.error) {
        console.error('Erro ao salvar aluno no Supabase:', syncResult.error);
        
        const isConstraintConflict = 
          syncResult.error.includes('alunos_cpf_key') || 
          syncResult.error.includes('duplicate key') ||
          syncResult.error.includes('MIGRATION NECESSÁRIA');

        if (isConstraintConflict) {
          setAlunoSyncFeedback({
            type: 'error',
            title: 'Supabase: Tabela Alunos Bloqueou 2ª Matrícula',
            message: 'O cadastro foi salvo localmente, mas o Supabase ainda possui a restrição antiga (alunos_cpf_key) que impede o mesmo CPF com matrículas diferentes. Execute o comando SQL abaixo no seu Supabase SQL Editor para liberar múltiplas matrículas.',
            sqlHint: `ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_cpf_key;\nDROP INDEX IF EXISTS public.alunos_cpf_key;\nALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_cpf_matricula_key;\nALTER TABLE public.alunos ADD CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula);`
          });
        } else {
          setAlunoSyncFeedback({
            type: 'warning',
            title: 'Aviso de Sincronização com Supabase',
            message: `O aluno foi salvo localmente, mas houve um erro ao enviar para a nuvem: ${syncResult.error}`
          });
          setTimeout(() => setAlunoSyncFeedback(null), 6000);
        }
      } else if (syncResult && syncResult.data) {
        // Successfully saved in Supabase
        const remoteAluno = syncResult.data;
        if (remoteAluno && remoteAluno.id && remoteAluno.id !== formattedAluno.id) {
          // Update local state with real Supabase UUID
          const updatedWithId = { ...formattedAluno, id: remoteAluno.id };
          setAlunos((prev) => prev.map((a) => (a.id === formattedAluno.id ? updatedWithId : a)));
          setMatchingAlunos((prev) => prev.map((a) => (a.id === formattedAluno.id ? updatedWithId : a)));
          setSelectedAluno(updatedWithId);
        }

        setAlunoSyncFeedback({
          type: 'success',
          title: 'Aluno e Matrícula Salvos com Sucesso!',
          message: `Cadastro da matrícula ${formattedAluno.matricula || 'N/A'} sincronizado com o banco Supabase na nuvem.`
        });
        setTimeout(() => setAlunoSyncFeedback(null), 4000);
      }
    } catch (err: any) {
      console.warn('Supabase save aluno exception:', err);
    }
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
      setMatchingAlunos([]);
      setCurrentCpf('');
      setSearchAttempted(false);
    }, 3000);
  };

  // Reset tabulação to initial CPF search view
  const handleResetTabulacao = () => {
    setSelectedAluno(null);
    setMatchingAlunos([]);
    setCurrentCpf('');
    setSearchAttempted(false);
  };

  // Open Modal for New Aluno
  const handleOpenNovoAlunoModal = (preFillCpf?: string) => {
    setIsNewMatriculaModal(false);
    setAlunoToEdit(null);
    setInitialCpfForModal(preFillCpf || currentCpf || '');
    setIsAlunoModalOpen(true);
  };

  // Open Modal for Nova Matrícula for existing student
  const handleOpenNovaMatriculaModal = (aluno?: Aluno | null) => {
    setIsNewMatriculaModal(true);
    setAlunoToEdit(null);
    const targetAluno = aluno || selectedAluno || matchingAlunos[0];
    setInitialCpfForModal(targetAluno?.cpf || currentCpf || '');
    setIsAlunoModalOpen(true);
  };

  // Open Modal for Edit Aluno
  const handleEditAluno = (aluno: Aluno) => {
    setIsNewMatriculaModal(false);
    setAlunoToEdit(aluno);
    setInitialCpfForModal(aluno.cpf);
    setIsAlunoModalOpen(true);
  };

  // Callback to sync loaded data from Supabase
  const handleSyncFromSupabase = (
    newAlunos: Aluno[],
    newTabs: Tabulacao[],
    newUsrs: Usuario[],
    newBase?: BaseAtendimentoItem[]
  ) => {
    if (newAlunos.length > 0) setAlunos(newAlunos);
    if (newTabs.length > 0) setTabulacoes(newTabs);
    if (newUsrs.length > 0) setUsuarios(newUsrs);
    if (newBase && newBase.length > 0) setBaseAtendimento(newBase);
  };

  // Base de Atendimento Handlers
  const handleSaveBaseAtendimentoItem = async (item: BaseAtendimentoItem) => {
    setBaseAtendimento((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      if (exists) {
        return prev.map((b) => (b.id === item.id ? item : b));
      }
      return [item, ...prev];
    });

    saveBaseAtendimentoItemSupabase(item).catch((err) => {
      console.warn('Erro ao sincronizar item da base de atendimento:', err);
    });
    return true;
  };

  const handleBatchImportBaseAtendimento = async (items: BaseAtendimentoItem[]): Promise<{ count: number; error: string | null }> => {
    setBaseAtendimento((prev) => {
      const newItems = items.filter(
        (newItem) => !prev.some((p) => p.matricula.trim().toLowerCase() === newItem.matricula.trim().toLowerCase())
      );
      return [...newItems, ...prev];
    });

    try {
      const { count, error } = await saveBaseAtendimentoBatchSupabase(items);
      if (error) {
        console.warn('Alerta ao persistir lote na tabela base_atendimento do Supabase:', error);
      }
      return { count: count || items.length, error };
    } catch (err: any) {
      console.error('Erro ao importar lote da base de atendimento:', err);
      return { count: items.length, error: err?.message || 'Erro ao sincronizar com banco' };
    }
  };

  const handleDeleteBaseAtendimentoItem = async (id: string) => {
    setBaseAtendimento((prev) => prev.filter((b) => b.id !== id));
    deleteBaseAtendimentoItemSupabase(id).catch((err) => {
      console.warn('Erro ao excluir item da base de atendimento:', err);
    });
    return true;
  };

  // Filter attendances for active student
  const historicoAlunoAtivo = selectedAluno
    ? tabulacoes.filter((t) => normalizeCpf(t.alunoCpf) === normalizeCpf(selectedAluno.cpf))
    : [];

  // If no user is authenticated, render Login Screen
  if (!currentUser) {
    return <LoginView usuarios={usuarios} onLogin={handleLogin} />;
  }

  const isOperador = currentUser.perfil === 'Operador';
  const isAdm = currentUser.perfil === 'ADM';
  const isGerencial = currentUser.perfil === 'Gerencial';
  const isCliente = currentUser.perfil === 'Cliente';
  const isDashboardUser = currentUser.perfil === 'Supervisor' || isGerencial || isAdm || isCliente;

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
      <main className="flex-1 max-w-[100rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Nova Tabulação de Atendimento (Liberada para Operador, Supervisor e ADM) */}
        {activeTab === 'tabulacao' && !isCliente && (
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

            {/* Banner de Feedback de Sincronização do Aluno (com Suporte a Múltiplas Matrículas e SQL) */}
            {alunoSyncFeedback && (
              <div
                className={`p-5 rounded-2xl border transition-all animate-in slide-in-from-top-2 fade-in duration-300 ${
                  alunoSyncFeedback.type === 'error'
                    ? 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-sm'
                    : alunoSyncFeedback.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        alunoSyncFeedback.type === 'error'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : alunoSyncFeedback.type === 'warning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white shadow-sm'
                      }`}
                    >
                      {alunoSyncFeedback.type === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : alunoSyncFeedback.type === 'warning' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black tracking-tight">
                        {alunoSyncFeedback.title}
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90 max-w-4xl">
                        {alunoSyncFeedback.message}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAlunoSyncFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-black/5 transition-all cursor-pointer"
                    title="Fechar aviso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Se for erro de restrição antiga no Supabase, exibe o comando SQL pronto para copiar */}
                {alunoSyncFeedback.sqlHint && (
                  <div className="mt-4 pt-3 border-t border-rose-200/80 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                        Execute isto no SQL Editor do seu Supabase para corrigir em 5 segundos:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(alunoSyncFeedback.sqlHint || '');
                            setCopiedSqlHint(true);
                            setTimeout(() => setCopiedSqlHint(false), 2500);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          {copiedSqlHint ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSqlHint ? 'Comando Copiado!' : 'Copiar Comando SQL'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('supabase')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100/50 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Abrir Conexão Supabase
                        </button>
                      </div>
                    </div>

                    <pre className="p-3 bg-slate-950 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed shadow-inner">
                      {alunoSyncFeedback.sqlHint}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: CPF Search & Identification */}
            <CpfSearch
              currentCpf={currentCpf}
              onCpfChange={setCurrentCpf}
              onSearch={handleSearchCpf}
              selectedAluno={selectedAluno}
              matchingAlunos={matchingAlunos}
              onSelectAluno={handleSelectAluno}
              onAddNewMatricula={() => handleOpenNovaMatriculaModal(selectedAluno || matchingAlunos[0])}
              searchAttempted={searchAttempted}
              onOpenNovoAlunoModal={handleOpenNovoAlunoModal}
              onClear={handleResetTabulacao}
            />

            {/* As demais opções (Dados do Aluno e Formulário de Tabulação) são carregadas SOMENTE após consultar/selecionar o aluno */}
            {selectedAluno ? (
              <>
                {/* Step 2: Student Academic & Contact Card with Matricula Switcher */}
                <AlunoCard
                  aluno={selectedAluno}
                  allAlunosWithCpf={
                    matchingAlunos.length > 0
                      ? matchingAlunos
                      : alunos.filter((a) => normalizeCpf(a.cpf) === normalizeCpf(selectedAluno.cpf))
                  }
                  onSelectAluno={handleSelectAluno}
                  onAddNewMatricula={() => handleOpenNovaMatriculaModal(selectedAluno)}
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

        {/* Tab: Base de Atendimento (Campanha com WhatsApp e Cruzamento de 60 dias) */}
        {activeTab === 'base_atendimento' && (
          <BaseAtendimento
            baseAtendimento={baseAtendimento}
            base={baseAtendimento}
            tabulacoes={tabulacoes}
            currentUser={currentUser}
            onSaveItem={handleSaveBaseAtendimentoItem}
            onBatchImport={handleBatchImportBaseAtendimento}
            onDeleteItem={handleDeleteBaseAtendimentoItem}
            onOpenSupabaseScript={() => setActiveTab('supabase')}
            onRefreshData={() => loadCloudData(true)}
          />
        )}

        {/* Tab 3: Dashboard Operacional */}
        {activeTab === 'dashboard' && isDashboardUser && (
          <DashboardView tabulacoes={tabulacoes} usuarios={usuarios} />
        )}

        {/* Tab 4: Gestão de Usuários (Apenas Supervisor e ADM) */}
        {activeTab === 'usuarios' && (currentUser.perfil === 'Supervisor' || isGerencial || isAdm) && (
          <UsuariosView
            usuarios={usuarios}
            currentUser={currentUser}
            onlineUsersMap={onlineUsersMap}
            onSaveUsuario={handleSaveUsuario}
            onDeleteUsuario={handleDeleteUsuario}
            onLogoutUsuario={handleForceLogoutUsuario}
          />
        )}

        {/* Tab 4: Conexão Supabase (Apenas ADM) */}
        {activeTab === 'supabase' && isAdm && (
          <SupabaseView
            alunos={alunos}
            tabulacoes={tabulacoes}
            usuarios={usuarios}
            baseAtendimento={baseAtendimento}
            onSyncFromSupabase={handleSyncFromSupabase}
            onClearLocalRecords={handleClearLocalRecords}
            onDeleteSingleLocalAluno={handleDeleteSingleLocalAluno}
            onDeleteSingleLocalTabulacao={handleDeleteSingleLocalTabulacao}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 mt-12">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Sistema de Tabulação de Atendimento ao Aluno • Controle de Acessos por Perfil
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Usuário: <strong>{currentUser.nome}</strong> ({currentUser.perfil})</span>
            <span>•</span>
            <span>Tabulações: <strong>{tabulacoes.length}</strong></span>
            <span>•</span>
            <span>Base Alunos: <strong>{baseAtendimento.length}</strong></span>
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

      {/* Modal: Cadastrar / Editar Aluno / Nova Matrícula */}
      <AlunoModal
        isOpen={isAlunoModalOpen}
        onClose={() => setIsAlunoModalOpen(false)}
        onSave={handleSaveAluno}
        alunoToEdit={alunoToEdit}
        initialCpf={initialCpfForModal}
        isNewMatricula={isNewMatriculaModal}
        existingAluno={
          selectedAluno ||
          matchingAlunos.find((a) => normalizeCpf(a.cpf) === normalizeCpf(initialCpfForModal)) ||
          alunos.find((a) => normalizeCpf(a.cpf) === normalizeCpf(initialCpfForModal)) ||
          null
        }
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
