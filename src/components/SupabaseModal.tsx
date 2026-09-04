import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Code2, 
  KeyRound, 
  Server, 
  ShieldCheck,
  ExternalLink,
  Layers,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  AlertCircle,
  CheckCircle2,
  Activity,
  Radio,
  Eye,
  EyeOff,
  Search,
  FileText,
  Users,
  HardDrive,
  Trash2
} from 'lucide-react';
import { 
  SUPABASE_SQL_SCHEMA, 
  SUPABASE_SQL_CLEANUP, 
  SUPABASE_SQL_MIGRATION,
  SUPABASE_SQL_MULTI_MATRICULA,
  SUPABASE_SQL_BASE_ATENDIMENTO,
  SUPABASE_SQL_RESET
} from '../data/mockData';
import { 
  supabase, 
  getSupabaseCredentials, 
  checkSupabaseHealth, 
  SupabaseHealthResult,
  fetchAlunosSupabase,
  fetchTabulacoesSupabase,
  fetchUsuariosSupabase,
  fetchBaseAtendimentoSupabase,
  saveAlunoSupabase,
  saveTabulacaoSupabase,
  saveUsuarioSupabase,
  seedInitialDataToSupabase,
  auditLocalVsRemote,
  syncAlunosBatch,
  syncTabulacoesBatch,
  LocalAuditResult,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_KEY
} from '../lib/supabase';
import { Aluno, Tabulacao, Usuario, BaseAtendimentoItem } from '../types';

interface SupabaseViewProps {
  alunos?: Aluno[];
  tabulacoes?: Tabulacao[];
  usuarios?: Usuario[];
  baseAtendimento?: BaseAtendimentoItem[];
  onSyncFromSupabase?: (alunos: Aluno[], tabs: Tabulacao[], usrs: Usuario[], base?: BaseAtendimentoItem[]) => void;
  onClearLocalRecords?: () => void;
  onDeleteSingleLocalAluno?: (aluno: Aluno) => void;
  onDeleteSingleLocalTabulacao?: (tab: Tabulacao) => void;
}

export const SupabaseView: React.FC<SupabaseViewProps> = ({
  alunos = [],
  tabulacoes = [],
  usuarios = [],
  baseAtendimento = [],
  onSyncFromSupabase,
  onClearLocalRecords,
  onDeleteSingleLocalAluno,
  onDeleteSingleLocalTabulacao,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCleanupSql, setCopiedCleanupSql] = useState(false);
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false);
  const [copiedMultiMatriculaSql, setCopiedMultiMatriculaSql] = useState(false);
  const [copiedBaseAtendimentoSql, setCopiedBaseAtendimentoSql] = useState(false);
  const [copiedResetSql, setCopiedResetSql] = useState(false);
  const [copiedClient, setCopiedClient] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'sql' | 'local_diff' | 'client' | 'config'>('status');
  const [activeSqlScript, setActiveSqlScript] = useState<'schema' | 'migration' | 'multi_matricula' | 'base_atendimento' | 'cleanup' | 'reset'>('schema');

  const [creds, setCreds] = useState(getSupabaseCredentials());
  const [inputUrl, setInputUrl] = useState(creds.url);
  const [inputKey, setInputKey] = useState(creds.key);
  const [showKey, setShowKey] = useState(false);

  const [health, setHealth] = useState<SupabaseHealthResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Local vs Supabase Audit State
  const [auditResult, setAuditResult] = useState<LocalAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await auditLocalVsRemote(alunos, tabulacoes);
      setAuditResult(res);
    } catch (err: any) {
      console.error('Erro na auditoria de dados locais:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSyncLocalOnly = async () => {
    if (!auditResult) return;
    setIsSyncingLocal(true);
    setActionMessage({ type: 'info', text: 'Enviando registros salvos localmente para o Supabase...' });
    try {
      let syncedAlunos = 0;
      let syncedTabs = 0;
      const errors: string[] = [];

      if (auditResult.localOnlyAlunos.length > 0) {
        const aRes = await syncAlunosBatch(auditResult.localOnlyAlunos);
        syncedAlunos = aRes.successCount;
        if (aRes.errors.length > 0) errors.push(...aRes.errors);
      }

      if (auditResult.localOnlyTabulacoes.length > 0) {
        const tRes = await syncTabulacoesBatch(auditResult.localOnlyTabulacoes);
        syncedTabs = tRes.successCount;
        if (tRes.errors.length > 0) errors.push(...tRes.errors);
      }

      if (errors.length > 0 && syncedAlunos === 0 && syncedTabs === 0) {
        setActionMessage({ type: 'error', text: `Erro na sincronização: ${errors[0]}` });
      } else {
        setActionMessage({
          type: 'success',
          text: `Sincronização concluída com sucesso! Enviados: ${syncedAlunos} alunos e ${syncedTabs} tabulações para o banco Supabase.`
        });
        await handleRunAudit();
        runHealthCheck();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Falha ao sincronizar' });
    } finally {
      setIsSyncingLocal(false);
    }
  };

  const handleSyncSingleAluno = async (aluno: Aluno) => {
    setActionMessage({ type: 'info', text: `Sincronizando aluno ${aluno.nome}...` });
    try {
      const res = await saveAlunoSupabase(aluno);
      if (res.error) {
        setActionMessage({ type: 'error', text: `Erro ao sincronizar: ${res.error}` });
      } else {
        setActionMessage({ type: 'success', text: `Aluno ${aluno.nome} (${aluno.matricula}) sincronizado com sucesso no Supabase!` });
        await handleRunAudit();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Falha ao sincronizar aluno' });
    }
  };

  const handleSyncSingleTabulacao = async (tab: Tabulacao) => {
    setActionMessage({ type: 'info', text: `Sincronizando tabulação ${tab.protocolo}...` });
    try {
      const res = await saveTabulacaoSupabase(tab);
      if (res.error) {
        setActionMessage({ type: 'error', text: `Erro ao sincronizar: ${res.error}` });
      } else {
        setActionMessage({ type: 'success', text: `Tabulação ${tab.protocolo} sincronizada com sucesso no Supabase!` });
        await handleRunAudit();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Falha ao sincronizar tabulação' });
    }
  };

  const handleRemoveAllLocalRecords = async () => {
    if (window.confirm('Deseja realmente remover os registros salvos apenas localmente? Esta ação excluirá os dados mock e rascunhos locais deste navegador, mantendo o sistema estritamente alinhado com o Supabase.')) {
      if (onClearLocalRecords) {
        onClearLocalRecords();
      }
      setActionMessage({
        type: 'success',
        text: 'Todos os registros salvos apenas localmente foram removidos com sucesso! O estado local agora está limpo e espelhado no Supabase.'
      });
      setTimeout(() => {
        handleRunAudit();
      }, 300);
    }
  };

  const handleRemoveSingleAluno = (aluno: Aluno) => {
    if (onDeleteSingleLocalAluno) {
      onDeleteSingleLocalAluno(aluno);
      setActionMessage({
        type: 'info',
        text: `Registro local de ${aluno.nome} removido do navegador.`
      });
      setTimeout(() => {
        handleRunAudit();
      }, 300);
    }
  };

  const handleRemoveSingleTabulacao = (tab: Tabulacao) => {
    if (onDeleteSingleLocalTabulacao) {
      onDeleteSingleLocalTabulacao(tab);
      setActionMessage({
        type: 'info',
        text: `Tabulação local ${tab.protocolo} removida do navegador.`
      });
      setTimeout(() => {
        handleRunAudit();
      }, 300);
    }
  };

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await checkSupabaseHealth();
      setHealth(res);
    } catch (err: any) {
      setHealth({
        connected: false,
        url: creds.url,
        error: err?.message || 'Falha ao testar conexão',
        tables: { alunos: false, tabulacoes: false, usuarios: false }
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyCleanupSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CLEANUP);
    setCopiedCleanupSql(true);
    setTimeout(() => setCopiedCleanupSql(false), 2500);
  };

  const handleCopyMigrationSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedMigrationSql(true);
    setTimeout(() => setCopiedMigrationSql(false), 2500);
  };

  const handleCopyMultiMatriculaSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MULTI_MATRICULA);
    setCopiedMultiMatriculaSql(true);
    setTimeout(() => setCopiedMultiMatriculaSql(false), 2500);
  };

  const handleCopyBaseAtendimentoSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_BASE_ATENDIMENTO);
    setCopiedBaseAtendimentoSql(true);
    setTimeout(() => setCopiedBaseAtendimentoSql(false), 2500);
  };

  const handleCopyResetSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_RESET);
    setCopiedResetSql(true);
    setTimeout(() => setCopiedResetSql(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setActionMessage({ type: 'error', text: 'Preencha a URL e a Chave do Supabase.' });
      return;
    }

    localStorage.setItem('tabulacoes_supabase_url', inputUrl.trim());
    localStorage.setItem('tabulacoes_supabase_key', inputKey.trim());
    setCreds({ url: inputUrl.trim(), key: inputKey.trim() });
    
    setActionMessage({ type: 'success', text: 'Configurações do Supabase salvas com sucesso! Recarregando conexão...' });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handlePushToSupabase = async () => {
    setIsSeeding(true);
    setActionMessage({ type: 'info', text: 'Enviando dados locais para o banco de dados Supabase...' });
    
    try {
      const result = await seedInitialDataToSupabase(alunos, tabulacoes, usuarios, baseAtendimento);
      if (result.errors.length > 0 && result.alunosCount === 0 && result.tabulacoesCount === 0 && result.usuariosCount === 0) {
        setActionMessage({
          type: 'error',
          text: `Erro ao enviar dados. Verifique se executou o script SQL no Supabase. Detalhe: ${result.errors[0]}`
        });
      } else {
        const parts = [
          `${result.alunosCount} alunos`,
          `${result.tabulacoesCount} tabulações`,
          `${result.usuariosCount} usuários`,
        ];
        if (result.baseAtendimentoCount > 0) {
          parts.push(`${result.baseAtendimentoCount} contatos da base`);
        }
        setActionMessage({
          type: 'success',
          text: `Sincronização concluída! Enviados para o Supabase: ${parts.join(', ')}.`
        });
        runHealthCheck();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Falha ao sincronizar com Supabase' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    setActionMessage({ type: 'info', text: 'Carregando dados mais recentes do Supabase...' });

    try {
      const [alunosRes, tabsRes, usrsRes, baseRes] = await Promise.all([
        fetchAlunosSupabase(true),
        fetchTabulacoesSupabase(true),
        fetchUsuariosSupabase(true),
        fetchBaseAtendimentoSupabase(true),
      ]);

      if (alunosRes.error || tabsRes.error || usrsRes.error) {
        const err = alunosRes.error || tabsRes.error || usrsRes.error;
        setActionMessage({
          type: 'error',
          text: `Não foi possível carregar do Supabase: ${err}. Execute o script SQL no painel do Supabase se as tabelas ainda não existirem.`
        });
      } else {
        const loadedAlunos = alunosRes.data || [];
        const loadedTabs = tabsRes.data || [];
        const loadedUsrs = usrsRes.data || [];
        const loadedBase = baseRes.data || [];

        if (onSyncFromSupabase) {
          onSyncFromSupabase(loadedAlunos, loadedTabs, loadedUsrs, loadedBase);
        }

        const msgParts = [
          `${loadedAlunos.length} alunos`,
          `${loadedTabs.length} tabulações`,
          `${loadedUsrs.length} usuários`,
        ];
        if (loadedBase.length > 0) {
          msgParts.push(`${loadedBase.length} registros da base de atendimento`);
        }

        setActionMessage({
          type: 'success',
          text: `Dados importados do Supabase com sucesso: ${msgParts.join(', ')}!`
        });
        runHealthCheck();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Erro ao importar do Supabase' });
    } finally {
      setIsPulling(false);
    }
  };

  const clientSnippet = `// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = '${creds.url}';
export const supabaseAnonKey = '${creds.key}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 1. Buscar Aluno por CPF
export async function buscarAlunoPorCpf(cpf: string) {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('cpf', cpf.replace(/\\D/g, ''))
    .single();

  if (error) throw error;
  return data;
}

// 2. Salvar Tabulação de Atendimento
export async function salvarTabulacao(tab: {
  protocolo: string;
  aluno_cpf: string;
  aluno_nome: string;
  aluno_ra?: string;
  aluno_curso?: string;
  aluno_polo?: string;
  aluno_email?: string;
  aluno_telefone?: string;
  unidade?: string;
  assessoria_atendimento?: string;
  status_aluno?: string;
  atendente_nome: string;
  matricula_atendente: string;
  canal_atendimento: string;
  categoria_motivo: string;
  submotivo: string;
  tipo_negociacao?: string;
  com_renovacao?: boolean;
  quantidade_parcelas?: number;
  data_primeira_parcela?: string;
  valor_entrada?: number;
  valor_parcela?: number;
  valor_total_acordo?: number;
  tempo_atendimento_minutos?: number;
  detalhamento: string;
}) {
  const { data, error } = await supabase
    .from('tabulacoes')
    .upsert(tab, { onConflict: 'protocolo' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 3. Autenticar Usuário / Operador
export async function autenticarUsuario(usuario: string, senha: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('senha', senha)
    .eq('ativo', true)
    .single();

  if (error) throw error;
  return data;
}

// 4. Salvar Contato na Base de Atendimento (Campanhas WhatsApp)
export async function salvarItemBaseAtendimento(item: {
  nome: string;
  matricula: string;
  whatsapp: string;
  unidade?: string;
  observacao?: string;
}) {
  const { data, error } = await supabase
    .from('base_atendimento')
    .upsert(item, { onConflict: 'matricula' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 5. Importação em Lote de Base de Atendimento
export async function importarLoteBaseAtendimento(items: Array<{
  nome: string;
  matricula: string;
  whatsapp: string;
  unidade?: string;
  observacao?: string;
}>) {
  const { data, error } = await supabase
    .from('base_atendimento')
    .upsert(items, { onConflict: 'matricula' })
    .select();

  if (error) throw error;
  return data;
}
`;

  return (
    <div className="space-y-6">
      
      {/* Banner Principal com Status ao Vivo */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950">
              <Database className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  Supabase Cloud Conectado
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                  hnlnirmiwsdurrpfdbtz.supabase.co
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Central de Integração Supabase
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Banco de dados PostgreSQL corporativo integrado para persistência de <strong>Alunos</strong>, <strong>Tabulações de Atendimento</strong>, <strong>Gestão de Usuários</strong> e <strong>Base de Atendimento</strong>.
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={runHealthCheck}
              disabled={isCheckingHealth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isCheckingHealth ? 'Testando...' : 'Testar Conexão'}</span>
            </button>

            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all cursor-pointer whitespace-nowrap"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Script SQL Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>

        </div>

        {/* Real-time Status Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status da Conexão</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Conectado e Ativo
              </span>
            </div>
            {health?.latencyMs !== undefined && (
              <span className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded">
                {health.latencyMs}ms
              </span>
            )}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tabela Alunos</span>
              <span className={`font-bold flex items-center gap-1 mt-0.5 ${health?.tables.alunos ? 'text-emerald-400' : 'text-amber-400'}`}>
                {health?.tables.alunos ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {health?.tables.alunos ? 'Pronta no Supabase' : 'Aguardando Script SQL'}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-bold">{alunos.length} locais</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tabela Tabulações</span>
              <span className={`font-bold flex items-center gap-1 mt-0.5 ${health?.tables.tabulacoes ? 'text-emerald-400' : 'text-amber-400'}`}>
                {health?.tables.tabulacoes ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {health?.tables.tabulacoes ? 'Pronta no Supabase' : 'Aguardando Script SQL'}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-bold">{tabulacoes.length} locais</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tabela Usuários</span>
              <span className={`font-bold flex items-center gap-1 mt-0.5 ${health?.tables.usuarios ? 'text-emerald-400' : 'text-amber-400'}`}>
                {health?.tables.usuarios ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {health?.tables.usuarios ? 'Pronta no Supabase' : 'Aguardando Script SQL'}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-bold">{usuarios.length} locais</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Base Atendimento</span>
              <span className={`font-bold flex items-center gap-1 mt-0.5 ${health?.tables.base_atendimento ? 'text-emerald-400' : 'text-amber-400'}`}>
                {health?.tables.base_atendimento ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {health?.tables.base_atendimento ? 'Pronta no Supabase' : 'Aguardando Script SQL'}
              </span>
            </div>
            <span className="text-xs text-slate-300 font-bold">{baseAtendimento.length} locais</span>
          </div>

        </div>

      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : actionMessage.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-indigo-50 text-indigo-900 border-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : actionMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Activity className="w-5 h-5 text-indigo-600 shrink-0 animate-spin" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-tabs de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('status')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'status'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Activity className="w-4 h-4" />
          1. Painel de Sincronização & Testes
        </button>

        <button
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'sql'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Code2 className="w-4 h-4" />
          2. Script SQL das Tabelas (DDL)
        </button>

        <button
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'config'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          3. Credenciais & Chaves
        </button>

        <button
          onClick={() => setActiveSubTab('client')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'client'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <Layers className="w-4 h-4" />
          4. Código do Cliente SDK
        </button>

        <button
          onClick={() => {
            setActiveSubTab('local_diff');
            handleRunAudit();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'local_diff'
              ? 'bg-amber-600 text-white shadow-sm font-black'
              : 'text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60'
          }`}
        >
          <Search className="w-4 h-4" />
          5. Salvos Apenas Localmente
          {auditResult && auditResult.totalPending > 0 ? (
            <span className="ml-1 px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-full text-[10px] animate-pulse">
              {auditResult.totalPending} pendentes
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-200/60 text-amber-900 font-semibold rounded text-[10px]">
              Verificar
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Painel de Sincronização & Testes */}
      {activeSubTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card: Sync Actions */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Sincronização Bi-direcional de Dados
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Envie os registros cadastrados localmente para as tabelas do seu Supabase ou puxe os dados mais recentes salvos na nuvem.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Push button */}
              <div className="bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all">
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Exportar para o Supabase
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Salva todos os {alunos.length} alunos, {tabulacoes.length} tabulações, {usuarios.length} usuários e {baseAtendimento.length} registros da base diretamente no banco Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePushToSupabase}
                  disabled={isSeeding}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSeeding ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{isSeeding ? 'Sincronizando...' : 'Enviar Dados para Nuvem'}</span>
                </button>
              </div>

              {/* Pull button */}
              <div className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all">
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Importar do Supabase
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Busca os registros atualizados do banco na nuvem e recarrega na aplicação em tempo real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePullFromSupabase}
                  disabled={isPulling}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPulling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <DownloadCloud className="w-4 h-4" />
                  )}
                  <span>{isPulling ? 'Carregando...' : 'Puxar Dados da Nuvem'}</span>
                </button>
              </div>

            </div>

            {/* Quick Action to Local Only Audit */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <Search className="w-4 h-4 text-amber-700" />
                  <span>Verificar registros salvos apenas no seu navegador</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Consulte a lista detalhada de alunos e atendimentos que existem localmente e envie-os para o Supabase com 1 clique.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('local_diff');
                  handleRunAudit();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Ver Salvos Localmente</span>
              </button>
            </div>

            {/* Guide Step-by-Step */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Primeira vez configurando o Supabase?</span>
              </div>
              <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Abra o <strong>SQL Editor</strong> no painel do seu projeto Supabase.</li>
                <li>Cole o script da aba <strong>2. Script SQL</strong> e clique em <strong>Run</strong>.</li>
                <li>Clique no botão <strong>Enviar Dados para Nuvem</strong> acima para popular a base!</li>
              </ol>
            </div>

          </div>

          {/* Card: Current Supabase Credentials info */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Conexão Ativa
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  SUPABASE URL
                </span>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] break-all select-all">
                  {creds.url}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  CHAVE PÚBLICA (ANON / PUBLISHABLE KEY)
                </span>
                <div className="bg-slate-900 text-emerald-300 p-3 rounded-xl font-mono text-[11px] break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{creds.key}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(creds.key);
                      setActionMessage({ type: 'success', text: 'Chave copiada com sucesso!' });
                    }}
                    className="text-slate-400 hover:text-white shrink-0"
                    title="Copiar Chave"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <span>Abrir Painel do Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: SQL Schema */}
      {activeSubTab === 'sql' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-100 space-y-4">
          
          {/* Sub-bar de Seleção de Scripts */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveSqlScript('schema')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSqlScript === 'schema'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                1. Script Completo (DDL + Seeds)
              </button>

              <button
                onClick={() => setActiveSqlScript('migration')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSqlScript === 'migration'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                2. Migração Geral (Colunas Novas)
              </button>

              <button
                onClick={() => setActiveSqlScript('multi_matricula')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSqlScript === 'multi_matricula'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                3. Múltiplas Matrículas (alunos_cpf_key)
              </button>

              <button
                onClick={() => setActiveSqlScript('base_atendimento')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSqlScript === 'base_atendimento'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                4. Tabela Base Atendimento
              </button>

              <button
                onClick={() => setActiveSqlScript('cleanup')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSqlScript === 'cleanup'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                5. Limpar Colunas Antigas
              </button>

              <button
                onClick={() => setActiveSqlScript('reset')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeSqlScript === 'reset'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                6. Reset Total
              </button>
            </div>

            {/* Copy Button for current selected script */}
            {activeSqlScript === 'schema' && (
              <button
                onClick={handleCopySql}
                className="text-xs font-bold text-white flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                {copiedSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedSql ? 'Script Copiado!' : 'Copiar Script Completo'}
              </button>
            )}

            {activeSqlScript === 'migration' && (
              <button
                onClick={handleCopyMigrationSql}
                className="text-xs font-bold text-white flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/50"
              >
                {copiedMigrationSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedMigrationSql ? 'Script Copiado!' : 'Copiar Script de Migração'}
              </button>
            )}

            {activeSqlScript === 'multi_matricula' && (
              <button
                onClick={handleCopyMultiMatriculaSql}
                className="text-xs font-bold text-white flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                {copiedMultiMatriculaSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedMultiMatriculaSql ? 'Script Copiado!' : 'Copiar Script Múltiplas Matrículas'}
              </button>
            )}

            {activeSqlScript === 'base_atendimento' && (
              <button
                onClick={handleCopyBaseAtendimentoSql}
                className="text-xs font-bold text-white flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-950/50"
              >
                {copiedBaseAtendimentoSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedBaseAtendimentoSql ? 'Script Copiado!' : 'Copiar Script Base Atendimento'}
              </button>
            )}

            {activeSqlScript === 'cleanup' && (
              <button
                onClick={handleCopyCleanupSql}
                className="text-xs font-bold text-white flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50"
              >
                {copiedCleanupSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedCleanupSql ? 'Script Copiado!' : 'Copiar Script de Limpeza'}
              </button>
            )}

            {activeSqlScript === 'reset' && (
              <button
                onClick={handleCopyResetSql}
                className="text-xs font-bold text-white flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-950/50"
              >
                {copiedResetSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copiedResetSql ? 'Script Copiado!' : 'Copiar Script de Reset Total'}
              </button>
            )}
          </div>

          {/* Header Info Description */}
          <div className="px-6 pt-2">
            {activeSqlScript === 'schema' && (
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <Server className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-400">Script Completo (DDL + RLS + Índices + Seeds):</strong> Cria e estrutura as tabelas <code className="text-emerald-300">usuarios</code>, <code className="text-emerald-300">alunos</code>, <code className="text-emerald-300">tabulacoes</code> e <code className="text-emerald-300">base_atendimento</code> com todas as colunas oficiais atuais, RLS e dados iniciais.
                </div>
              </div>
            )}

            {activeSqlScript === 'migration' && (
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Migração Rápida (Adicionar Colunas):</strong> Adiciona de forma segura e idempotente as novas colunas (<code className="text-indigo-200 font-mono">com_renovacao</code>, <code className="text-indigo-200 font-mono">unidade</code>, <code className="text-indigo-200 font-mono">assessoria_atendimento</code>, etc.) caso você já tenha a tabela existente no Supabase.
                </div>
              </div>
            )}

            {activeSqlScript === 'multi_matricula' && (
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-900/60 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300">Ajuste de Múltiplas Matrículas por Aluno (Tabela Alunos):</strong> Remove a restrição única antiga <code className="text-cyan-200 font-mono">alunos_cpf_key</code> e adiciona a chave composta <code className="text-cyan-200 font-mono">alunos_cpf_matricula_key (cpf, matricula)</code>. Isso permite cadastrar várias matrículas para o mesmo aluno sem erro de duplicidade.
                </div>
              </div>
            )}

            {activeSqlScript === 'base_atendimento' && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">Tabela da Base de Atendimento (Campanhas WhatsApp):</strong> Cria a tabela <code className="text-amber-200 font-mono">base_atendimento</code> no Supabase com RLS, índices otimizados e realtime ativado para cruzamento automático de contatos com a tabela <code className="text-amber-200 font-mono">tabulacoes</code>.
                </div>
              </div>
            )}

            {activeSqlScript === 'cleanup' && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-300">Limpeza de Colunas Obsoletas (Alunos & Tabulações):</strong> Remove as colunas descontinuadas das tabelas <code className="text-rose-200 font-mono">alunos</code> e <code className="text-rose-200 font-mono">tabulacoes</code> (<code className="text-rose-200 font-mono">status_atendimento</code>, <code className="text-rose-200 font-mono">prioridade</code>, <code className="text-rose-200 font-mono">modalidade</code>, <code className="text-rose-200 font-mono">data_nascimento</code>, etc.) mantendo o banco leve e 100% alinhado.
                </div>
              </div>
            )}

            {activeSqlScript === 'reset' && (
              <div className="p-3.5 bg-purple-950/40 border border-purple-900/60 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300">Redefinição Total (DROP CASCADE & RECREATE):</strong> Recria todas as 4 tabelas (<code className="text-purple-200 font-mono">base_atendimento</code>, <code className="text-purple-200 font-mono">tabulacoes</code>, <code className="text-purple-200 font-mono">alunos</code>, <code className="text-purple-200 font-mono">usuarios</code>) do zero com a estrutura mais recente, triggers de auditoria, políticas RLS permissivas e sementes iniciais.
                </div>
              </div>
            )}
          </div>

          {/* Script Code Viewer */}
          <div className="px-6 pb-6">
            <pre className="p-6 text-xs font-mono overflow-x-auto text-emerald-300/90 leading-relaxed max-h-[600px] bg-slate-950/90 rounded-2xl border border-slate-800/80">
              {activeSqlScript === 'schema' && SUPABASE_SQL_SCHEMA}
              {activeSqlScript === 'migration' && SUPABASE_SQL_MIGRATION}
              {activeSqlScript === 'multi_matricula' && SUPABASE_SQL_MULTI_MATRICULA}
              {activeSqlScript === 'base_atendimento' && SUPABASE_SQL_BASE_ATENDIMENTO}
              {activeSqlScript === 'cleanup' && SUPABASE_SQL_CLEANUP}
              {activeSqlScript === 'reset' && SUPABASE_SQL_RESET}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Configuration (Edit URL & Key) */}
      {activeSubTab === 'config' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl">
          <h3 className="text-base font-black text-slate-900 mb-1">
            Configurar Credenciais do Supabase
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            As credenciais foram definidas automaticamente com as chaves fornecidas. Caso deseje alterar ou alternar de projeto Supabase, atualize os campos abaixo:
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://hnlnirmiwsdurrpfdbtz.supabase.co"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Anon / Publishable Key (VITE_SUPABASE_ANON_KEY)</span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-slate-600 font-normal flex items-center gap-1"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKey ? 'Ocultar' : 'Exibir'}</span>
                </button>
              </label>
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sb_publishable_ZGb_h9JcWzRv_tKjYvdBBA_RHko4ScQ"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
                required
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setInputUrl(DEFAULT_SUPABASE_URL);
                  setInputKey(DEFAULT_SUPABASE_KEY);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Restaurar Padrão
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Salvar e Recarregar Conexão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Client Code */}
      {activeSubTab === 'client' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              src/lib/supabase.ts (SDK Integration)
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(clientSnippet);
                setCopiedClient(true);
                setTimeout(() => setCopiedClient(false), 2000);
              }}
              className="text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              {copiedClient ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedClient ? 'Copiado!' : 'Copiar Trecho'}
            </button>
          </div>
          <pre className="p-6 text-xs font-mono overflow-x-auto text-blue-300/90 leading-relaxed max-h-[550px] bg-slate-950/70">
            {clientSnippet}
          </pre>
        </div>
      )}

      {/* Tab 5: Dados Salvos Apenas Localmente (Auditoria e Sincronização) */}
      {activeSubTab === 'local_diff' && (
        <div className="space-y-6">
          
          {/* Header da Auditoria */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Auditoria em Tempo Real
                  </span>
                  <span className="text-xs text-slate-400">Navegador vs Banco Nuvem</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Registros Salvos Apenas Localmente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                  Lista detalhada de cadastros que residem no armazenamento do seu navegador (localStorage / memória) e ainda não constam nas tabelas do Supabase.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                  {isAuditing ? 'Analisando...' : 'Reanalisar'}
                </button>

                {auditResult && auditResult.totalPending > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncLocalOnly}
                      disabled={isSyncingLocal}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <UploadCloud className={`w-4 h-4 ${isSyncingLocal ? 'animate-bounce' : ''}`} />
                      {isSyncingLocal ? 'Sincronizando...' : `Sincronizar Todos (${auditResult.totalPending}) com Supabase`}
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveAllLocalRecords}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black rounded-xl transition-all shadow-2xs cursor-pointer"
                      title="Apagar dados locais e manter apenas o banco de dados Supabase"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      Remover Registros Locais ({auditResult.totalPending})
                    </button>
                  </>
                )}

                {(!auditResult || auditResult.totalPending === 0) && (
                  <button
                    type="button"
                    onClick={handleRemoveAllLocalRecords}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent"
                    title="Limpar resíduos locais do navegador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Dados Salvos Localmente
                  </button>
                )}
              </div>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Alunos Salvos Localmente</span>
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-950">
                  {isAuditing ? '...' : auditResult ? auditResult.localOnlyAlunos.length : 0}
                </div>
                <p className="text-[11px] text-amber-700">Não encontrados na tabela 'alunos' do Supabase</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800">Tabulações Locais</span>
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-950">
                  {isAuditing ? '...' : auditResult ? auditResult.localOnlyTabulacoes.length : 0}
                </div>
                <p className="text-[11px] text-indigo-700">Protocolos pendentes de envio à nuvem</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Alunos em Atendimentos</span>
                  <HardDrive className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {isAuditing ? '...' : auditResult ? auditResult.tabAlunosMissingInAlunosTable.length : 0}
                </div>
                <p className="text-[11px] text-slate-500">Registrados em chamadas sem cadastro prévio</p>
              </div>
            </div>
          </div>

          {/* Se a auditoria ainda não foi executada */}
          {!auditResult && !isAuditing && (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Pronto para auditar</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Clique no botão abaixo para comparar todos os dados locais com o Supabase e descobrir o que ainda não subiu para a nuvem.
              </p>
              <button
                type="button"
                onClick={handleRunAudit}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Executar Auditoria Agora
              </button>
            </div>
          )}

          {/* Se está tudo sincronizado */}
          {auditResult && auditResult.totalPending === 0 && (
            <div className="p-8 text-center bg-emerald-50 rounded-3xl border border-emerald-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-emerald-950">
                Tudo 100% Sincronizado com o Supabase!
              </h4>
              <p className="text-xs text-emerald-800 max-w-lg mx-auto leading-relaxed">
                Não há nenhum aluno ou tabulação salvo exclusivamente de forma local. Todos os registros estão devidamente gravados e protegidos no banco de dados na nuvem.
              </p>
            </div>
          )}

          {/* LISTA 1: Alunos Salvos Apenas Localmente */}
          {auditResult && auditResult.localOnlyAlunos.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs">
                    {auditResult.localOnlyAlunos.length}
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    Alunos e Matrículas Salvos Apenas no Navegador
                  </h4>
                </div>
                <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Pronto para subir ao Supabase
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {auditResult.localOnlyAlunos.map((aluno, idx) => (
                  <div key={aluno.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{aluno.nome}</span>
                        <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          CPF: {aluno.cpf}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          Matrícula: {aluno.matricula || aluno.ra || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        {aluno.email && <span>✉ {aluno.email}</span>}
                        {aluno.telefone && <span>📞 {aluno.telefone}</span>}
                        <span className="text-amber-600 font-medium">● Armazenado apenas localmente</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSyncSingleAluno(aluno)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Subir para Supabase
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleAluno(aluno)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-all shrink-0 cursor-pointer"
                        title="Remover apenas deste navegador"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTA 2: Tabulações Salvas Apenas Localmente */}
          {auditResult && auditResult.localOnlyTabulacoes.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {auditResult.localOnlyTabulacoes.length}
                  </div>
                  <h4 className="text-sm font-black text-slate-900">
                    Tabulações Salvas Apenas no Navegador
                  </h4>
                </div>
                <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  Pendentes de Envio
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {auditResult.localOnlyTabulacoes.map((tab, idx) => (
                  <div key={tab.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {tab.protocolo}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{tab.alunoNome}</span>
                        <span className="text-[11px] text-slate-500">CPF: {tab.alunoCpf}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span>Operador: {tab.atendenteNome}</span>
                        <span>Motivo: {tab.categoriaMotivo}</span>
                        <span>Data: {tab.dataHora}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSyncSingleTabulacao(tab)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Subir para Supabase
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleTabulacao(tab)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-all shrink-0 cursor-pointer"
                        title="Remover apenas deste navegador"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTA 3: Alunos presentes em Tabulações sem Registro na Tabela Alunos */}
          {auditResult && auditResult.tabAlunosMissingInAlunosTable.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {auditResult.tabAlunosMissingInAlunosTable.length}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Alunos em Tabulações que não constam na Tabela 'alunos'
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Foram atendidos e tabulados, mas não possuem linha própria cadastrada na tabela alunos do Supabase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {auditResult.tabAlunosMissingInAlunosTable.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{item.nome}</span>
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          CPF: {item.cpf}
                        </span>
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          Matrícula: {item.matricula}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Último atendimento: {item.lastProtocolo} {item.unidade ? `• Unidade: ${item.unidade}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleSyncSingleAluno({
                          id: '',
                          nome: item.nome,
                          cpf: item.cpf,
                          matricula: item.matricula,
                          email: item.email || '',
                          telefone: item.telefone || '',
                          dataCadastro: new Date().toISOString(),
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      <UploadCloud className="w-3 h-3" />
                      Cadastrar no Supabase
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
