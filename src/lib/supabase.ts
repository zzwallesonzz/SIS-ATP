import { createClient } from '@supabase/supabase-js';
import { Aluno, Tabulacao, Usuario } from '../types';
import { getSaoPauloISOString } from '../utils/cpf';

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

    result.latencyMs = Date.now() - startTime;
    // Considered connected if at least endpoint reached without network failure
    result.connected = result.tables.alunos || result.tables.tabulacoes || result.tables.usuarios;
    
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
// ALUNOS
// ------------------------------------------------------------------
export async function fetchAlunosSupabase(): Promise<{ data: Aluno[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const mapped: Aluno[] = data.map((row: any) => ({
      id: row.id,
      cpf: row.cpf,
      nome: row.nome,
      matricula: row.matricula,
      email: row.email,
      telefone: row.telefone,
      ra: row.ra || '',
      curso: row.curso || '',
      polo: row.polo || '',
      statusAcademico: row.status_academico || 'Ativo',
      dataCadastro: row.data_cadastro || new Date().toISOString(),
    }));

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao carregar alunos' };
  }
}

export async function saveAlunoSupabase(aluno: Aluno): Promise<{ data: Aluno | null; error: string | null }> {
  try {
    const payload: any = {
      cpf: aluno.cpf,
      nome: aluno.nome,
      matricula: aluno.matricula,
      email: aluno.email,
      telefone: aluno.telefone,
      ra: aluno.ra || null,
      curso: aluno.curso || null,
      polo: aluno.polo || null,
      status_academico: aluno.statusAcademico || 'ATIVO',
      data_cadastro: aluno.dataCadastro || getSaoPauloISOString(),
    };

    if (isValidUUID(aluno.id)) {
      payload.id = aluno.id;
    }

    let currentPayload = { ...payload };
    let finalData: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('alunos')
        .upsert(currentPayload, { onConflict: 'cpf' })
        .select()
        .single();

      if (!error && data) {
        finalData = data;
        lastError = null;
        break;
      }

      lastError = error;
      const errMsg = error?.message || '';
      console.warn(`Tentativa ${attempt + 1} de salvar aluno no Supabase retornou:`, errMsg);

      if (errMsg.includes('status_academico') && 'status_academico' in currentPayload) {
        delete currentPayload.status_academico;
        continue;
      }
      if (errMsg.includes('ra') && 'ra' in currentPayload) {
        delete currentPayload.ra;
        continue;
      }
      if (errMsg.includes('curso') && 'curso' in currentPayload) {
        delete currentPayload.curso;
        continue;
      }
      if (errMsg.includes('polo') && 'polo' in currentPayload) {
        delete currentPayload.polo;
        continue;
      }
      if (errMsg.includes('data_cadastro') && 'data_cadastro' in currentPayload) {
        delete currentPayload.data_cadastro;
        continue;
      }

      const colMatch = errMsg.match(/column "([^"]+)" of relation "alunos" does not exist/) ||
                       errMsg.match(/Could not find the '([^']+)' column of 'alunos'/);
      if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
        delete currentPayload[colMatch[1]];
        continue;
      }

      break;
    }

    if (lastError || !finalData) {
      return { data: null, error: lastError?.message || 'Erro ao salvar aluno no Supabase' };
    }

    const savedAluno: Aluno = {
      id: finalData.id,
      cpf: finalData.cpf,
      nome: finalData.nome,
      matricula: finalData.matricula,
      email: finalData.email,
      telefone: finalData.telefone,
      ra: finalData.ra || '',
      curso: finalData.curso || '',
      polo: finalData.polo || '',
      statusAcademico: finalData.status_academico || 'ATIVO',
      dataCadastro: finalData.data_cadastro || aluno.dataCadastro,
    };

    return { data: savedAluno, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Erro ao salvar aluno' };
  }
}

// ------------------------------------------------------------------
// TABULAÇÕES
// ------------------------------------------------------------------
export async function fetchTabulacoesSupabase(): Promise<{ data: Tabulacao[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('tabulacoes')
      .select('*')
      .order('data_hora', { ascending: false });

    if (error) {
      console.warn('Supabase fetchTabulacoes error:', error.message);
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const mapped: Tabulacao[] = data.map((row: any) => ({
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
    }));

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
export async function fetchUsuariosSupabase(): Promise<{ data: Usuario[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) return { data: [], error: null };

    const mapped: Usuario[] = data.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      usuario: row.usuario,
      senha: row.senha,
      perfil: row.perfil,
      supervisor: row.supervisor || undefined,
      matricula: row.matricula || undefined,
      emailCorporativo: row.email_corporativo || undefined,
      ativo: row.ativo !== false,
      createdAt: row.created_at,
    }));

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
  initialUsuarios: Usuario[]
): Promise<{ alunosCount: number; tabulacoesCount: number; usuariosCount: number; errors: string[] }> {
  const errors: string[] = [];
  let aCount = 0;
  let tCount = 0;
  let uCount = 0;

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

  return {
    alunosCount: aCount,
    tabulacoesCount: tCount,
    usuariosCount: uCount,
    errors,
  };
}
