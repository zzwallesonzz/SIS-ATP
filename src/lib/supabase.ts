import { createClient } from '@supabase/supabase-js';
import { Aluno, BaseAtendimentoItem, Tabulacao, Usuario } from '../types';
import { cleanDigits, normalizeCpf, formatCPF, formatCompleteCPF, getSaoPauloISOString, generateUUID } from '../utils/cpf';

export const DEFAULT_SUPABASE_URL = 'https://hnlnirmiwsdurrpfdbtz.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_ZGb_h9JcWzRv_tKjYvdBBA_RHko4ScQ';

export function getSupabaseCredentials(): { url: string; key: string } {
  const envObj = (import.meta as any).env || {};
  const url = 
    localStorage.getItem('tabulacoes_supabase_url') || 
    (envObj.VITE_SUPABASE_URL as string) || 
    DEFAULT_SUPABASE_URL;

  const key = 
    localStorage.getItem('tabulacoes_supabase_key') || 
    (envObj.VITE_SUPABASE_ANON_KEY as string) || 
    DEFAULT_SUPABASE_KEY;

  return { url: url.trim(), key: key.trim() };
}

const { url: initialUrl, key: initialKey } = getSupabaseCredentials();

export const supabase = createClient(initialUrl, initialKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to check if string is valid UUID
function isValidUUID(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ------------------------------------------------------------------
// Connection Health Check
// ------------------------------------------------------------------
export interface SupabaseHealthResult {
  connected: boolean;
  url: string;
  error?: string;
  tables: {
    alunos: boolean;
    tabulacoes: boolean;
    usuarios: boolean;
    base_atendimento?: boolean;
  };
  latencyMs?: number;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const startTime = Date.now();
  const result: SupabaseHealthResult = {
    connected: false,
    url: getSupabaseCredentials().url,
    tables: {
      alunos: false,
      tabulacoes: false,
      usuarios: false,
      base_atendimento: false,
    },
  };

  try {
    // Test Alunos table
    const { data: alunosData, error: alunosErr } = await supabase
      .from('alunos')
      .select('id')
      .limit(1);

    if (!alunosErr) {
      result.tables.alunos = true;
    }

    // Test Tabulacoes table
    const { data: tabData, error: tabErr } = await supabase
      .from('tabulacoes')
      .select('id')
      .limit(1);

    if (!tabErr) {
      result.tables.tabulacoes = true;
    }

    // Test Usuarios table
    const { data: usrData, error: usrErr } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);

    if (!usrErr) {
      result.tables.usuarios = true;
    }

    // Test Base Atendimento table
    const { data: baseData, error: baseErr } = await supabase
      .from('base_atendimento')
      .select('id')
      .limit(1);

    if (!baseErr) {
      result.tables.base_atendimento = true;
    }

    result.latencyMs = Date.now() - startTime;
    // Considered connected if at least endpoint reached without network failure
    result.connected = result.tables.alunos || result.tables.tabulacoes || result.tables.usuarios || !!result.tables.base_atendimento;
    
    if (!result.connected && (alunosErr || tabErr || usrErr)) {
      result.error = alunosErr?.message || tabErr?.message || usrErr?.message || 'Tabelas ainda não criadas no Supabase.';
    }

    return result;
  } catch (err: any) {
    result.error = err?.message || 'Falha ao conectar com o Supabase.';
    return result;
  }
}

// ------------------------------------------------------------------
// CACHE & DEDUPLICATION STATE
// ------------------------------------------------------------------
let alunosCache: { data: Aluno[]; timestamp: number } | null = null;
let tabulacoesCache: { data: Tabulacao[]; timestamp: number } | null = null;
let usuariosCache: { data: Usuario[]; timestamp: number } | null = null;
let baseAtendimentoCache: { data: BaseAtendimentoItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes memory cache

export function invalidateSupabaseCache() {
  alunosCache = null;
  tabulacoesCache = null;
  usuariosCache = null;
  baseAtendimentoCache = null;
}

export function mapBaseAtendimentoRow(row: any): BaseAtendimentoItem {
  return {
    id: row.id,
    nome: row.nome || '',
    matricula: row.matricula || '',
    unidade: row.unidade || '',
    whatsapp: row.whatsapp || '',
    observacao: row.observacao || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapAlunoRow(row: any): Aluno {
  return {
    id: row.id,
    cpf: formatCompleteCPF(String(row.cpf || '')),
    nome: row.nome,
    matricula: row.matricula,
    email: row.email,
    telefone: row.telefone,
    ra: row.ra || '',
    curso: row.curso || '',
    polo: row.polo || '',
    statusAcademico: row.status_academico || 'ATIVO',
    dataCadastro: row.data_cadastro || new Date().toISOString(),
  };
}

export function mapTabulacaoRow(row: any): Tabulacao {
  return {
    id: row.id,
    protocolo: row.protocolo,
    alunoId: row.aluno_id || '',
    alunoCpf: row.aluno_cpf,
    alunoNome: row.aluno_nome,
    alunoRa: row.aluno_ra || '',
    alunoCurso: row.aluno_curso || '',
    alunoPolo: row.aluno_polo || '',
    alunoEmail: row.aluno_email || '',
    alunoTelefone: row.aluno_telefone || '',
    unidade: row.unidade || '',
    assessoriaAtendimento: row.assessoria_atendimento || '',
    statusAluno: row.status_aluno || '',
    dataHora: row.data_hora,
    atendenteNome: row.atendente_nome,
    matriculaAtendente: row.matricula_atendente,
    canalAtendimento: row.canal_atendimento,
    categoriaMotivo: row.categoria_motivo,
    submotivo: row.submotivo,
    tipoNegociacao: row.tipo_negociacao,
    comRenovacao: row.com_renovacao !== undefined && row.com_renovacao !== null ? Boolean(row.com_renovacao) : undefined,
    quantidadeParcelas: row.quantidade_parcelas ? Number(row.quantidade_parcelas) : undefined,
    dataPrimeiraParcela: row.data_primeira_parcela,
    valorEntrada: row.valor_entrada !== null && row.valor_entrada !== undefined ? Number(row.valor_entrada) : undefined,
    valorParcela: row.valor_parcela !== null && row.valor_parcela !== undefined ? Number(row.valor_parcela) : undefined,
    valorTotalAcordo: row.valor_total_acordo !== null && row.valor_total_acordo !== undefined ? Number(row.valor_total_acordo) : undefined,
    statusAtendimento: row.status_atendimento || 'Resolvido no 1º Contato',
    prioridade: row.prioridade || 'Média',
    sentimento: row.sentimento || 'Neutro',
    tempoAtendimentoMinutos: Number(row.tempo_atendimento_minutos) || 0,
    detalhamento: row.detalhamento,
    acoesTomadas: Array.isArray(row.acoes_tomadas) ? row.acoes_tomadas : [],
    setorEncaminhado: row.setor_encaminhado,
    dataRetornoAgendado: row.data_retorno_agendado,
    observacoesInternas: row.observacoes_internas,
    createdAt: row.created_at,
  };
}

export function mapUsuarioRow(row: any): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    usuario: row.usuario,
    senha: row.senha,
    perfil: row.perfil,
    supervisor: row.supervisor || undefined,
    matricula: row.matricula || undefined,
    emailCorporativo: row.email_corporativo || undefined,
    ativo: row.ativo !== false,
    ultimoLogin: row.ultimo_login || undefined,
    isOnline: row.is_online === true,
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------------
// ALUNOS
// ------------------------------------------------------------------
export async function fetchAlunosSupabase(forceRefresh = false): Promise<{ data: Aluno[] | null; error: string | null }> {
  try {
    if (!forceRefresh && alunosCache && Date.now() - alunosCache.timestamp < CACHE_TTL_MS) {
      return { data: alunosCache.data, error: null };
    }

    const allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('nome', { ascending: true })
        .range(from, from + step - 1);

      if (error) {
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        break;
      }

      allData.push(...data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    const mapped: Aluno[] = allData.map(mapAlunoRow);
    alunosCache = { data: mapped, timestamp: Date.now() };

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao carregar alunos' };
  }
}

/**
 * Searches students directly in Supabase by CPF, checking multiple formatting variations
 * (e.g. "03964199257", "3964199257", "039.641.992-57", "39.641.992-57")
 * Returns all matching records (multiple matriculas for the same CPF)
 */
export async function searchAlunosByCpfSupabase(rawCpf: string): Promise<{ data: Aluno[] | null; error: string | null }> {
  try {
    const digits = cleanDigits(rawCpf);
    if (!digits) return { data: [], error: null };

    const padded = normalizeCpf(digits);
    const unpadded = digits.replace(/^0+/, '');
    const formattedWithMask = formatCompleteCPF(digits);
    const rawFormatted = formatCPF(digits);

    const candidates = Array.from(
      new Set([padded, digits, unpadded, formattedWithMask, rawFormatted, rawCpf.trim()])
    ).filter(Boolean);

    const filterQuery = candidates.map((c) => `cpf.eq.${c}`).join(',');

    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .or(filterQuery);

    if (error) {
      console.warn('Busca direta de alunos no Supabase retornou aviso/erro:', error.message);
      return { data: null, error: error.message };
    }

    if (data && data.length > 0) {
      const list: Aluno[] = data.map((row: any) => ({
        id: row.id,
        cpf: formatCompleteCPF(String(row.cpf || '')),
        nome: row.nome,
        matricula: row.matricula,
        email: row.email,
        telefone: row.telefone,
        ra: row.ra || row.matricula || '',
        curso: row.curso || '',
        polo: row.polo || '',
        statusAcademico: row.status_academico || 'ATIVO',
        dataCadastro: row.data_cadastro || new Date().toISOString(),
      }));
      return { data: list, error: null };
    }

    return { data: [], error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao consultar alunos por CPF' };
  }
}

/**
 * Backward-compatible single-aluno search (returns first match if any)
 */
export async function searchAlunoByCpfSupabase(rawCpf: string): Promise<{ data: Aluno | null; error: string | null }> {
  const res = await searchAlunosByCpfSupabase(rawCpf);
  if (res.error) return { data: null, error: res.error };
  return { data: res.data && res.data.length > 0 ? res.data[0] : null, error: null };
}

export async function saveAlunoSupabase(aluno: Aluno): Promise<{ data: Aluno | null; error: string | null }> {
  try {
    const formattedCpf = formatCompleteCPF(aluno.cpf);
    const unmaskedCpf = cleanDigits(aluno.cpf);
    const matriculaVal = (aluno.matricula || aluno.ra || '').trim();

    // 1. Prepare candidate payloads
    const fullPayload: any = {
      cpf: formattedCpf,
      nome: aluno.nome.trim(),
      matricula: matriculaVal,
      email: aluno.email.trim(),
      telefone: aluno.telefone.trim(),
      ra: aluno.ra || matriculaVal || null,
      curso: aluno.curso || null,
      polo: aluno.polo || null,
      status_academico: aluno.statusAcademico || 'ATIVO',
      data_cadastro: aluno.dataCadastro || getSaoPauloISOString(),
    };

    // If ID is valid UUID, keep it, otherwise omit to let Postgres generate gen_random_uuid()
    if (isValidUUID(aluno.id)) {
      fullPayload.id = aluno.id;
    }

    // Helper to map returning Supabase row
    const mapResult = (row: any): Aluno => ({
      id: row.id,
      cpf: formatCompleteCPF(String(row.cpf || '')),
      nome: row.nome,
      matricula: row.matricula,
      email: row.email,
      telefone: row.telefone,
      ra: row.ra || '',
      curso: row.curso || '',
      polo: row.polo || '',
      statusAcademico: row.status_academico || 'ATIVO',
      dataCadastro: row.data_cadastro || aluno.dataCadastro || getSaoPauloISOString(),
    });

    // 1. If updating an existing record with valid UUID
    if (isValidUUID(aluno.id)) {
      const { data: updated, error: updErr } = await supabase
        .from('alunos')
        .update(fullPayload)
        .eq('id', aluno.id)
        .select()
        .maybeSingle();

      if (!updErr && updated) {
        return { data: mapResult(updated), error: null };
      }
    }

    // 2. Check if a record already exists with the same CPF AND same Matrícula
    const { data: existingSameMatricula } = await supabase
      .from('alunos')
      .select('id')
      .or(`cpf.eq.${formattedCpf},cpf.eq.${unmaskedCpf}`)
      .eq('matricula', matriculaVal)
      .maybeSingle();

    if (existingSameMatricula?.id) {
      const { data: updated, error: updErr } = await supabase
        .from('alunos')
        .update(fullPayload)
        .eq('id', existingSameMatricula.id)
        .select()
        .maybeSingle();

      if (!updErr && updated) {
        return { data: mapResult(updated), error: null };
      }
    }

    // 3. New record insertion (delete id if not valid UUID)
    const insertPayload = { ...fullPayload };
    if (!isValidUUID(insertPayload.id)) {
      delete insertPayload.id;
    }

    // Attempt 1: Full payload
    let { data: inserted, error: insertError } = await supabase
      .from('alunos')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    // Attempt 2: If failed due to extra columns (e.g. curso, polo, status_academico, etc. not in table)
    if (insertError && (
      insertError.code === 'PGRST204' || 
      insertError.message.includes('column') || 
      insertError.message.includes('does not exist')
    )) {
      console.warn('Tentando inserção com colunas básicas na tabela alunos...', insertError.message);
      const minimalPayload = {
        cpf: formattedCpf,
        nome: aluno.nome.trim(),
        matricula: matriculaVal,
        email: aluno.email.trim(),
        telefone: aluno.telefone.trim(),
      };
      const retryRes = await supabase
        .from('alunos')
        .insert(minimalPayload)
        .select()
        .maybeSingle();
      
      inserted = retryRes.data;
      insertError = retryRes.error;
    }

    // Attempt 3: If failed due to CPF format length (e.g. column is VARCHAR(11))
    if (insertError && insertError.message.includes('value too long')) {
      console.warn('Tentando inserção com CPF numérico (sem máscara)...', insertError.message);
      const unmaskedPayload = {
        cpf: unmaskedCpf,
        nome: aluno.nome.trim(),
        matricula: matriculaVal,
        email: aluno.email.trim(),
        telefone: aluno.telefone.trim(),
      };
      const retryRes = await supabase
        .from('alunos')
        .insert(unmaskedPayload)
        .select()
        .maybeSingle();
      
      inserted = retryRes.data;
      insertError = retryRes.error;
    }

    if (!insertError && inserted) {
      // Invalidate cache so fresh student appears in queries
      alunosCache = null;
      return { data: mapResult(inserted), error: null };
    }

    // Check if insertion was rejected by legacy unique constraint on CPF
    if (
      insertError?.message?.includes('alunos_cpf_key') ||
      insertError?.message?.includes('violates unique constraint') ||
      insertError?.code === '23505'
    ) {
      console.error('Falha de restrição única no Supabase (alunos_cpf_key):', insertError);
      return {
        data: null,
        error:
          'O banco de dados Supabase rejeitou o cadastro pois a tabela "alunos" ainda possui a restrição antiga de CPF único ("alunos_cpf_key"). ' +
          'Para permitir mais de uma matrícula para o mesmo CPF, execute no SQL Editor do Supabase o comando: ' +
          'ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_cpf_key; ' +
          'ALTER TABLE public.alunos ADD CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula);',
      };
    }

    return { data: null, error: insertError?.message || 'Erro ao salvar aluno no Supabase' };
  } catch (err: any) {
    console.error('Exceção ao salvar aluno no Supabase:', err);
    return { data: null, error: err?.message || 'Erro ao sincronizar aluno' };
  }
}

// ------------------------------------------------------------------
// TABULAÇÕES
// ------------------------------------------------------------------
export async function fetchTabulacoesSupabase(forceRefresh = false): Promise<{ data: Tabulacao[] | null; error: string | null }> {
  try {
    if (!forceRefresh && tabulacoesCache && Date.now() - tabulacoesCache.timestamp < CACHE_TTL_MS) {
      return { data: tabulacoesCache.data, error: null };
    }

    const allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('tabulacoes')
        .select('*')
        .order('data_hora', { ascending: false })
        .range(from, from + step - 1);

      if (error) {
        console.warn('Supabase fetchTabulacoes error:', error.message);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        break;
      }

      allData.push(...data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    const mapped: Tabulacao[] = allData.map(mapTabulacaoRow);
    tabulacoesCache = { data: mapped, timestamp: Date.now() };

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao carregar tabulações' };
  }
}

function sanitizeDateString(d?: string | null): string | null {
  if (!d || !d.trim()) return null;
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  return null;
}

export async function saveTabulacaoSupabase(tab: Tabulacao): Promise<{ data: Tabulacao | null; error: string | null }> {
  try {
    const basePayload: any = {
      protocolo: tab.protocolo,
      aluno_cpf: tab.alunoCpf,
      aluno_nome: tab.alunoNome,
      aluno_ra: tab.alunoRa || null,
      aluno_curso: tab.alunoCurso || null,
      aluno_polo: tab.alunoPolo || null,
      aluno_email: tab.alunoEmail || null,
      aluno_telefone: tab.alunoTelefone || null,
      unidade: tab.unidade || null,
      assessoria_atendimento: tab.assessoriaAtendimento || null,
      status_aluno: tab.statusAluno || null,
      data_hora: tab.dataHora || getSaoPauloISOString(),
      atendente_nome: tab.atendenteNome,
      matricula_atendente: tab.matriculaAtendente,
      canal_atendimento: tab.canalAtendimento,
      categoria_motivo: tab.categoriaMotivo,
      submotivo: tab.submotivo,
      tipo_negociacao: tab.tipoNegociacao || null,
      com_renovacao: tab.comRenovacao !== undefined ? tab.comRenovacao : null,
      quantidade_parcelas: tab.quantidadeParcelas || null,
      data_primeira_parcela: sanitizeDateString(tab.dataPrimeiraParcela),
      valor_entrada: tab.valorEntrada !== undefined && tab.valorEntrada !== null ? Number(tab.valorEntrada) : null,
      valor_parcela: tab.valorParcela !== undefined && tab.valorParcela !== null ? Number(tab.valorParcela) : null,
      valor_total_acordo: tab.valorTotalAcordo !== undefined && tab.valorTotalAcordo !== null ? Number(tab.valorTotalAcordo) : null,
      tempo_atendimento_minutos: tab.tempoAtendimentoMinutos || 0,
      detalhamento: tab.detalhamento || '',
    };

    if (isValidUUID(tab.id)) {
      basePayload.id = tab.id;
    }
    if (tab.alunoId && isValidUUID(tab.alunoId)) {
      basePayload.aluno_id = tab.alunoId;
    }

    // Try saving, with intelligent automatic retry if schema columns or constraints differ
    let currentPayload = { ...basePayload };
    let finalData: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('tabulacoes')
        .upsert(currentPayload, { onConflict: 'protocolo' })
        .select()
        .single();

      if (!error && data) {
        finalData = data;
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = error?.message || '';
      console.warn(`Tentativa ${attempt + 1} de salvar tabulação no Supabase retornou:`, errMsg);

      // Handle specific column missing errors in Supabase database
      if (errMsg.includes('com_renovacao') && 'com_renovacao' in currentPayload) {
        delete currentPayload.com_renovacao;
        continue;
      }
      if (errMsg.includes('unidade') && 'unidade' in currentPayload) {
        delete currentPayload.unidade;
        continue;
      }
      if (errMsg.includes('assessoria_atendimento') && 'assessoria_atendimento' in currentPayload) {
        delete currentPayload.assessoria_atendimento;
        continue;
      }
      if (errMsg.includes('status_aluno') && 'status_aluno' in currentPayload) {
        delete currentPayload.status_aluno;
        continue;
      }
      if (errMsg.includes('aluno_email') && 'aluno_email' in currentPayload) {
        delete currentPayload.aluno_email;
        continue;
      }
      if (errMsg.includes('aluno_telefone') && 'aluno_telefone' in currentPayload) {
        delete currentPayload.aluno_telefone;
        continue;
      }
      if (errMsg.includes('aluno_id') || errMsg.includes('foreign key') || errMsg.includes('fkey')) {
        delete currentPayload.aluno_id;
        continue;
      }

      // If generic column not found error
      const colMatch = errMsg.match(/column "([^"]+)" of relation "tabulacoes" does not exist/) ||
                       errMsg.match(/Could not find the '([^']+)' column of 'tabulacoes'/);
      if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
        delete currentPayload[colMatch[1]];
        continue;
      }

      // Unrecoverable error, break
      break;
    }

    if (lastError || !finalData) {
      console.error('Falha ao persistir tabulação no Supabase:', lastError);
      return { data: null, error: lastError?.message || 'Erro ao salvar no Supabase' };
    }

    console.log('Tabulação persistida com sucesso no Supabase:', finalData.protocolo);

    const savedTab: Tabulacao = {
      id: finalData.id,
      protocolo: finalData.protocolo,
      alunoId: finalData.aluno_id || '',
      alunoCpf: finalData.aluno_cpf,
      alunoNome: finalData.aluno_nome,
      alunoRa: finalData.aluno_ra || '',
      alunoCurso: finalData.aluno_curso || '',
      alunoPolo: finalData.aluno_polo || '',
      alunoEmail: finalData.aluno_email || tab.alunoEmail || '',
      alunoTelefone: finalData.aluno_telefone || tab.alunoTelefone || '',
      unidade: finalData.unidade || tab.unidade || '',
      assessoriaAtendimento: finalData.assessoria_atendimento || tab.assessoriaAtendimento || '',
      statusAluno: finalData.status_aluno || tab.statusAluno || '',
      dataHora: finalData.data_hora,
      atendenteNome: finalData.atendente_nome,
      matriculaAtendente: finalData.matricula_atendente,
      canalAtendimento: finalData.canal_atendimento,
      categoriaMotivo: finalData.categoria_motivo,
      submotivo: finalData.submotivo,
      tipoNegociacao: finalData.tipo_negociacao,
      comRenovacao: finalData.com_renovacao !== undefined && finalData.com_renovacao !== null 
        ? Boolean(finalData.com_renovacao) 
        : tab.comRenovacao,
      quantidadeParcelas: finalData.quantidade_parcelas ? Number(finalData.quantidade_parcelas) : tab.quantidadeParcelas,
      dataPrimeiraParcela: finalData.data_primeira_parcela || tab.dataPrimeiraParcela,
      valorEntrada: finalData.valor_entrada !== null && finalData.valor_entrada !== undefined 
        ? Number(finalData.valor_entrada) 
        : tab.valorEntrada,
      valorParcela: finalData.valor_parcela !== null && finalData.valor_parcela !== undefined 
        ? Number(finalData.valor_parcela) 
        : tab.valorParcela,
      valorTotalAcordo: finalData.valor_total_acordo !== null && finalData.valor_total_acordo !== undefined 
        ? Number(finalData.valor_total_acordo) 
        : tab.valorTotalAcordo,
      statusAtendimento: finalData.status_atendimento || tab.statusAtendimento,
      prioridade: finalData.prioridade || tab.prioridade,
      sentimento: finalData.sentimento || tab.sentimento,
      tempoAtendimentoMinutos: Number(finalData.tempo_atendimento_minutos) || tab.tempoAtendimentoMinutos,
      detalhamento: finalData.detalhamento,
      acoesTomadas: Array.isArray(finalData.acoes_tomadas) ? finalData.acoes_tomadas : (tab.acoesTomadas || []),
      setorEncaminhado: finalData.setor_encaminhado,
      dataRetornoAgendado: finalData.data_retorno_agendado,
      observacoesInternas: finalData.observacoes_internas,
      createdAt: finalData.created_at,
    };

    return { data: savedTab, error: null };
  } catch (err: any) {
    console.error('Erro inesperado ao salvar tabulação:', err);
    return { data: null, error: err?.message || 'Erro ao salvar tabulação' };
  }
}

// ------------------------------------------------------------------
// USUÁRIOS
// ------------------------------------------------------------------
export async function fetchUsuariosSupabase(forceRefresh = false): Promise<{ data: Usuario[] | null; error: string | null }> {
  try {
    if (!forceRefresh && usuariosCache && Date.now() - usuariosCache.timestamp < CACHE_TTL_MS) {
      return { data: usuariosCache.data, error: null };
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const mapped: Usuario[] = data.map(mapUsuarioRow);
    usuariosCache = { data: mapped, timestamp: Date.now() };

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao carregar usuários' };
  }
}

export async function saveUsuarioSupabase(user: Usuario): Promise<{ data: Usuario | null; error: string | null }> {
  try {
    const payload: any = {
      nome: user.nome,
      usuario: user.usuario,
      senha: user.senha,
      perfil: user.perfil,
      supervisor: user.perfil === 'Operador' ? (user.supervisor || null) : null,
      matricula: user.matricula || null,
      email_corporativo: user.emailCorporativo || null,
      ativo: user.ativo !== false,
    };

    if (isValidUUID(user.id)) {
      payload.id = user.id;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .upsert(payload, { onConflict: 'usuario' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const savedUser: Usuario = {
      id: data.id,
      nome: data.nome,
      usuario: data.usuario,
      senha: data.senha,
      perfil: data.perfil,
      supervisor: data.supervisor || undefined,
      matricula: data.matricula || undefined,
      emailCorporativo: data.email_corporativo || undefined,
      ativo: data.ativo !== false,
      createdAt: data.created_at,
    };

    return { data: savedUser, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao salvar usuário' };
  }
}

export async function deleteUsuarioSupabase(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao deletar usuário' };
  }
}

// ------------------------------------------------------------------
// BATCH SEED INITIAL DATA (1-Click Sync to Supabase)
// ------------------------------------------------------------------
export async function seedInitialDataToSupabase(
  initialAlunos: Aluno[],
  initialTabulacoes: Tabulacao[],
  initialUsuarios: Usuario[],
  initialBaseAtendimento?: BaseAtendimentoItem[]
): Promise<{ alunosCount: number; tabulacoesCount: number; usuariosCount: number; baseAtendimentoCount: number; errors: string[] }> {
  const errors: string[] = [];
  let aCount = 0;
  let tCount = 0;
  let uCount = 0;
  let bCount = 0;

  // 1. Seed Alunos
  for (const a of initialAlunos) {
    const { error } = await saveAlunoSupabase(a);
    if (error) errors.push(`Aluno ${a.nome}: ${error}`);
    else aCount++;
  }

  // 2. Seed Usuarios
  for (const u of initialUsuarios) {
    const { error } = await saveUsuarioSupabase(u);
    if (error) errors.push(`Usuário ${u.nome}: ${error}`);
    else uCount++;
  }

  // 3. Seed Tabulações
  for (const t of initialTabulacoes) {
    const { error } = await saveTabulacaoSupabase(t);
    if (error) errors.push(`Tabulação ${t.protocolo}: ${error}`);
    else tCount++;
  }

  // 4. Seed Base de Atendimento (se fornecida)
  if (initialBaseAtendimento && initialBaseAtendimento.length > 0) {
    const resBatch = await saveBaseAtendimentoBatchSupabase(initialBaseAtendimento);
    bCount = resBatch.count;
    if (resBatch.error) {
      errors.push(`Base Atendimento: ${resBatch.error}`);
    }
  }

  return {
    alunosCount: aCount,
    tabulacoesCount: tCount,
    usuariosCount: uCount,
    baseAtendimentoCount: bCount,
    errors,
  };
}

// ------------------------------------------------------------------
// BASE DE ATENDIMENTO
// ------------------------------------------------------------------
export async function fetchBaseAtendimentoSupabase(forceRefresh = false): Promise<{ data: BaseAtendimentoItem[] | null; error: string | null }> {
  try {
    if (!forceRefresh && baseAtendimentoCache && Date.now() - baseAtendimentoCache.timestamp < CACHE_TTL_MS) {
      return { data: baseAtendimentoCache.data, error: null };
    }

    const allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('base_atendimento')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + step - 1);

      if (error) {
        // Se a tabela ainda não existir no Supabase, retorna lista vazia amigável
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          return { data: [], error: null };
        }
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        break;
      }

      allData.push(...data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    const mapped: BaseAtendimentoItem[] = allData.map(mapBaseAtendimentoRow);
    baseAtendimentoCache = { data: mapped, timestamp: Date.now() };

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao carregar base de atendimento' };
  }
}

export async function saveBaseAtendimentoItemSupabase(item: BaseAtendimentoItem): Promise<{ data: BaseAtendimentoItem | null; error: string | null }> {
  try {
    invalidateSupabaseCache();

    const idToUse = isValidUUID(item.id) ? item.id : generateUUID();

    let currentPayload: any = {
      id: idToUse,
      nome: item.nome.trim(),
      matricula: item.matricula.trim(),
      unidade: item.unidade?.trim() || null,
      whatsapp: item.whatsapp.trim(),
      observacao: item.observacao?.trim() || null,
    };

    let finalData: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      // Attempt upsert on matricula
      let { data, error } = await supabase
        .from('base_atendimento')
        .upsert(currentPayload, { onConflict: 'matricula' })
        .select()
        .single();

      // If constraint error or conflict on matricula fails, try onConflict id
      if (error && (error.message.includes('conflict') || error.message.includes('constraint') || error.code === '42P10')) {
        const res2 = await supabase
          .from('base_atendimento')
          .upsert(currentPayload, { onConflict: 'id' })
          .select()
          .single();
        data = res2.data;
        error = res2.error;
      }

      if (!error && data) {
        finalData = data;
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = error?.message || '';

      // If observacao column does not exist in the database table
      if (errMsg.includes('observacao') && 'observacao' in currentPayload) {
        delete currentPayload.observacao;
        continue;
      }

      // If another column does not exist
      const colMatch = errMsg.match(/Could not find the '([^']+)' column of 'base_atendimento'/);
      if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
        delete currentPayload[colMatch[1]];
        continue;
      }

      break;
    }

    if (lastError || !finalData) {
      return { data: null, error: lastError?.message || 'Erro ao salvar registro na base de atendimento' };
    }

    return { data: mapBaseAtendimentoRow(finalData), error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao salvar registro na base de atendimento' };
  }
}

export async function saveBaseAtendimentoBatchSupabase(items: BaseAtendimentoItem[]): Promise<{ count: number; error: string | null }> {
  try {
    invalidateSupabaseCache();

    if (items.length === 0) return { count: 0, error: null };

    const payload = items.map((item) => {
      const idToUse = isValidUUID(item.id) ? item.id : generateUUID();
      return {
        id: idToUse,
        nome: item.nome.trim(),
        matricula: item.matricula.trim(),
        unidade: item.unidade?.trim() || null,
        whatsapp: item.whatsapp.trim(),
        observacao: item.observacao?.trim() || null,
      };
    });

    // Chunk in batches of 50 to guarantee reliable delivery without hitting HTTP payload limits
    const CHUNK_SIZE = 50;
    let savedCount = 0;
    let lastError: string | null = null;

    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      let chunk = payload.slice(i, i + CHUNK_SIZE);
      let chunkSaved = false;

      for (let attempt = 0; attempt < 4; attempt++) {
        // Attempt 1: Upsert on matricula to avoid duplicate key errors
        let { data, error } = await supabase
          .from('base_atendimento')
          .upsert(chunk, { onConflict: 'matricula' })
          .select('id');

        // Attempt 2: If onConflict on matricula fails due to no unique constraint on matricula, upsert on id
        if (error && (error.message.includes('conflict') || error.message.includes('constraint') || error.code === '42P10')) {
          const res2 = await supabase
            .from('base_atendimento')
            .upsert(chunk, { onConflict: 'id' })
            .select('id');
          data = res2.data;
          error = res2.error;
        }

        // Attempt 3: If upsert is not supported, fallback to insert
        if (error && error.code !== '42P01' && !error.message.includes('schema cache')) {
          const res3 = await supabase
            .from('base_atendimento')
            .insert(chunk)
            .select('id');
          data = res3.data;
          error = res3.error;
        }

        if (!error) {
          savedCount += data?.length || chunk.length;
          chunkSaved = true;
          break;
        }

        lastError = error.message;
        const errMsg = error.message || '';

        // Handle missing column (e.g. observacao)
        if (errMsg.includes('observacao')) {
          chunk = chunk.map((item: any) => {
            const copy = { ...item };
            delete copy.observacao;
            return copy;
          });
          continue;
        }

        const colMatch = errMsg.match(/Could not find the '([^']+)' column of 'base_atendimento'/);
        if (colMatch && colMatch[1]) {
          const colName = colMatch[1];
          chunk = chunk.map((item: any) => {
            const copy = { ...item };
            delete copy[colName];
            return copy;
          });
          continue;
        }

        break;
      }

      if (!chunkSaved && lastError) {
        console.error('Erro ao salvar chunk na base_atendimento:', lastError);
        if (lastError.includes('does not exist') || lastError.includes('42P01')) {
          return {
            count: savedCount,
            error: 'A tabela "base_atendimento" ainda não existe no seu Supabase. Execute o script SQL no painel do Supabase.'
          };
        }
      }
    }

    if (savedCount === 0 && lastError) {
      return { count: 0, error: lastError };
    }

    return { count: savedCount, error: null };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Erro ao importar lote para a base de atendimento' };
  }
}

export async function deleteBaseAtendimentoItemSupabase(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    invalidateSupabaseCache();

    const { error } = await supabase
      .from('base_atendimento')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao excluir da base de atendimento' };
  }
}

// ------------------------------------------------------------------
// REALTIME MULTI-USER PRESENCE & BROADCAST
// ------------------------------------------------------------------
export interface PresenceUser {
  userId: string;
  usuario: string;
  nome: string;
  perfil: string;
  onlineAt: string;
}

export function subscribeToRealtimePresence(
  currentUser: Usuario | null,
  onPresenceChange: (onlineMap: Record<string, PresenceUser>) => void,
  onForceLogout?: (targetUserId: string, targetUsuario: string) => void
) {
  const presenceKey = currentUser?.usuario?.toLowerCase() || (currentUser?.id ? `id-${currentUser.id}` : `anon-${Date.now()}`);

  const channel = supabase.channel('sis_atp_presence_room', {
    config: {
      presence: {
        key: presenceKey,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineMap: Record<string, PresenceUser> = {};
      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        if (presences && presences.length > 0) {
          const first = presences[0];
          if (first && first.usuario) {
            onlineMap[first.usuario.toLowerCase()] = first;
            if (first.userId) {
              onlineMap[first.userId] = first;
            }
          }
        }
      });
      onPresenceChange(onlineMap);
    })
    .on('broadcast', { event: 'force-logout' }, (payload: any) => {
      if (payload && payload.payload) {
        const { targetUserId, targetUsuario } = payload.payload;
        if (onForceLogout) {
          onForceLogout(targetUserId, targetUsuario);
        }
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && currentUser) {
        try {
          await channel.track({
            userId: currentUser.id,
            usuario: currentUser.usuario.toLowerCase(),
            nome: currentUser.nome,
            perfil: currentUser.perfil,
            onlineAt: currentUser.ultimoLogin || getSaoPauloISOString(),
          });
        } catch (e) {
          console.warn('Realtime presence track exception:', e);
        }
      }
    });

  return {
    channel,
    track: async (user: Usuario) => {
      try {
        await channel.track({
          userId: user.id,
          usuario: user.usuario.toLowerCase(),
          nome: user.nome,
          perfil: user.perfil,
          onlineAt: user.ultimoLogin || getSaoPauloISOString(),
        });
      } catch (e) {
        console.warn('Presence track error:', e);
      }
    },
    untrack: async () => {
      try {
        await channel.untrack();
      } catch (e) {
        console.warn('Presence untrack error:', e);
      }
    },
    broadcastForceLogout: async (targetUserId: string, targetUsuario: string) => {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'force-logout',
          payload: { targetUserId, targetUsuario },
        });
      } catch (e) {
        console.warn('Broadcast logout error:', e);
      }
    },
    unsubscribe: () => {
      try {
        channel.untrack().catch(() => {});
        channel.unsubscribe();
      } catch (e) {
        console.warn('Unsubscribe error:', e);
      }
    },
  };
}

// ------------------------------------------------------------------
// REALTIME DATABASE CHANGES (Ultra-low egress: pushes single rows only)
// ------------------------------------------------------------------
export function subscribeToDatabaseChanges(
  onTabulacaoEvent: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: Tabulacao | null, oldId?: string) => void,
  onAlunoEvent: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: Aluno | null, oldId?: string) => void,
  onUsuarioEvent: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: Usuario | null, oldId?: string) => void,
  onBaseAtendimentoEvent?: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: BaseAtendimentoItem | null, oldId?: string) => void
) {
  const dbChannel = supabase.channel('sis_atp_db_realtime_sync');

  dbChannel
    // 1. Tabulações
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tabulacoes' },
      (payload) => {
        invalidateSupabaseCache();
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new) {
            const mapped = mapTabulacaoRow(payload.new);
            onTabulacaoEvent(payload.eventType, mapped);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          onTabulacaoEvent('DELETE', null, oldId);
        }
      }
    )
    // 2. Alunos
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alunos' },
      (payload) => {
        invalidateSupabaseCache();
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new) {
            const mapped = mapAlunoRow(payload.new);
            onAlunoEvent(payload.eventType, mapped);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          onAlunoEvent('DELETE', null, oldId);
        }
      }
    )
    // 3. Usuários
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'usuarios' },
      (payload) => {
        invalidateSupabaseCache();
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new) {
            const mapped = mapUsuarioRow(payload.new);
            onUsuarioEvent(payload.eventType, mapped);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.id;
          onUsuarioEvent('DELETE', null, oldId);
        }
      }
    )
    // 4. Base de Atendimento
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'base_atendimento' },
      (payload) => {
        invalidateSupabaseCache();
        if (onBaseAtendimentoEvent) {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const mapped = mapBaseAtendimentoRow(payload.new);
              onBaseAtendimentoEvent(payload.eventType, mapped);
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            onBaseAtendimentoEvent('DELETE', null, oldId);
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime database sync ativo.');
      }
    });

  return {
    unsubscribe: () => {
      try {
        dbChannel.unsubscribe();
      } catch (err) {
        console.warn('Error unsubscribing dbChannel:', err);
      }
    },
  };
}

// ------------------------------------------------------------------
// AUDITORIA E SINCRONIZAÇÃO DE DADOS LOCAIS VS SUPABASE
// ------------------------------------------------------------------
export interface LocalAuditResult {
  localOnlyAlunos: Aluno[];
  localOnlyTabulacoes: Tabulacao[];
  tabAlunosMissingInAlunosTable: Array<{
    cpf: string;
    nome: string;
    matricula: string;
    unidade?: string;
    telefone?: string;
    email?: string;
    lastProtocolo: string;
  }>;
  totalPending: number;
}

/**
 * Compara os registros locais (memória/localStorage) com o Supabase
 * e identifica exatamente o que está salvo apenas localmente.
 */
export async function auditLocalVsRemote(
  localAlunos: Aluno[],
  localTabulacoes: Tabulacao[]
): Promise<LocalAuditResult> {
  const localOnlyAlunos: Aluno[] = [];
  const localOnlyTabulacoes: Tabulacao[] = [];
  const tabAlunosMissingInAlunosTable: Array<{
    cpf: string;
    nome: string;
    matricula: string;
    unidade?: string;
    telefone?: string;
    email?: string;
    lastProtocolo: string;
  }> = [];

  try {
    // 1. Verifica quais Alunos Locais NÃO existem no Supabase
    if (localAlunos && localAlunos.length > 0) {
      for (const a of localAlunos) {
        const digits = cleanDigits(a.cpf);
        const mat = (a.matricula || a.ra || '').trim();
        const formatted = formatCompleteCPF(digits);

        const { data, error } = await supabase
          .from('alunos')
          .select('id, cpf, matricula')
          .or(`cpf.eq.${formatted},cpf.eq.${digits}`)
          .eq('matricula', mat)
          .maybeSingle();

        if (error || !data) {
          localOnlyAlunos.push(a);
        }
      }
    }

    // 2. Verifica quais Tabulações Locais NÃO existem no Supabase
    if (localTabulacoes && localTabulacoes.length > 0) {
      const protocols = localTabulacoes.map((t) => t.protocolo).filter(Boolean);
      // Consulta em lotes de 50
      const CHUNK = 50;
      const remoteFoundProtocols = new Set<string>();

      for (let i = 0; i < protocols.length; i += CHUNK) {
        const slice = protocols.slice(i, i + CHUNK);
        const { data } = await supabase
          .from('tabulacoes')
          .select('protocolo')
          .in('protocolo', slice);

        if (data) {
          data.forEach((r: any) => remoteFoundProtocols.add(r.protocolo));
        }
      }

      for (const t of localTabulacoes) {
        if (!remoteFoundProtocols.has(t.protocolo)) {
          localOnlyTabulacoes.push(t);
        }
      }
    }

    // 3. Verifica se nas tabulações recentes existem alunos não cadastrados na tabela 'alunos'
    const recentTabs = localTabulacoes.slice(0, 50);
    const checkedKeys = new Set<string>();

    for (const t of recentTabs) {
      const digits = cleanDigits(t.alunoCpf);
      const mat = (t.alunoRa || '').trim();
      const key = `${digits}|${mat}`;

      if (digits && mat && !checkedKeys.has(key)) {
        checkedKeys.add(key);
        const formatted = formatCompleteCPF(digits);

        const { data } = await supabase
          .from('alunos')
          .select('id')
          .or(`cpf.eq.${formatted},cpf.eq.${digits}`)
          .eq('matricula', mat)
          .maybeSingle();

        if (!data) {
          tabAlunosMissingInAlunosTable.push({
            cpf: formatted,
            nome: t.alunoNome,
            matricula: mat,
            unidade: t.unidade,
            telefone: t.alunoTelefone,
            email: t.alunoEmail,
            lastProtocolo: t.protocolo,
          });
        }
      }
    }
  } catch (err) {
    console.error('Erro na auditoria de dados locais vs Supabase:', err);
  }

  return {
    localOnlyAlunos,
    localOnlyTabulacoes,
    tabAlunosMissingInAlunosTable,
    totalPending: localOnlyAlunos.length + localOnlyTabulacoes.length,
  };
}

/**
 * Envia uma lista de alunos locais pendentes para o Supabase
 */
export async function syncAlunosBatch(
  alunosToSync: Aluno[]
): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  for (const a of alunosToSync) {
    const res = await saveAlunoSupabase(a);
    if (res.error) {
      errors.push(`${a.nome} (${a.matricula}): ${res.error}`);
    } else {
      successCount++;
    }
  }

  return { successCount, errors };
}

/**
 * Envia uma lista de tabulações locais pendentes para o Supabase
 */
export async function syncTabulacoesBatch(
  tabsToSync: Tabulacao[]
): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  for (const t of tabsToSync) {
    const res = await saveTabulacaoSupabase(t);
    if (res.error) {
      errors.push(`${t.protocolo}: ${res.error}`);
    } else {
      successCount++;
    }
  }

  return { successCount, errors };
}

