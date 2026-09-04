import { Aluno, BaseAtendimentoItem, CategoriaMotivoItem, Tabulacao, Usuario } from '../types';

export const UNIDADES_LISTA = [
'FORTALEZA - CE',
'SAO LUIS - MA',
'BELEM - PA',
'TOM JOBIM - RJ',
'MANAUS - AM',
'ARACAJU - SE',
'SALVADOR - BA',
'NOVA IGUAÇU - RJ',
'TAGUATINGA - DF',
'MARACANÃ - RJ',
'R9 TAQUARA - RJ',
'JATIÚCA - AL',
'ESTAÇÃO - GO',
'TERESINA - PI',
'ABDIAS DE CARVALHO - PE',
'CABO FRIO - RJ',
'NITEROI - RJ',
'RECREIO - RJ',
'CAMPO GRANDE - RJ',
'SANTA CRUZ - RJ',
'MACAPA - AP',
];

export const ASSESSORIAS_ATENDIMENTO_LISTA = [
  'INTERVALOR',
  'SERVICE/CONCETRIX',
  'JA-REZENDE',
  'DDM',
  'TRC',
  'SOFI',
  'FAMA',
  'PG+',
  'PEREIRA & MARQUES',
];

export const STATUS_ALUNO_LISTA = [
  'ATIVO',
  'INATIVO',
];

export const CATEGORIAS_MOTIVOS: CategoriaMotivoItem[] = [
  {
    id: 'negociacao',
    nome: 'NEGOCIAÇÃO',
    descricao: 'Promessas de Pagamento',
    iconName: 'CreditCard',
    submotivos: [
      'Acordo / Parcelamento de mensalidades em atraso',
      'Pagamento à vista com desconto especial',
      'Promessa de pagamento para data futura',
      'Emissão de boleto de acordo / Chave PIX',
      'Renegociação de termo / Reparcelamento',
      'Reativação de matrícula vinculada a acordo financeiro',
      'Alteração de data de vencimento de parcela',
      'Contraproposta financeira apresentada pelo aluno',
    ],
  },
  {
    id: 'recusa',
    nome: 'RECUSA',
    descricao: 'Dificuldades financeiras, recusas e contingências de contato',
    iconName: 'AlertCircle',
    submotivos: [
      'INTENÇÃO DE PAGAMENTO - FICOU DE ANALISAR PROPOSTA',
      'PREVENTIVO - DISPARO DE FOLDERS/PROPOSTA',
      'RECUSA - SEM CONDIÇÕES',
      'RECUSA - ALEGA BOLSA',
      'RECUSA - DESEMPREGO',
      'RECUSA - DISCORDA DOS VALORES',
      'AGENDAMENTO - ANÁLISE DE PROPOSTA',
      'AGENDAMENTO - PREVISÃO DE PAGAMENTO FIM DO MÊS',
      'INFORMAÇÃO - DÚVIDAS ACADÊMICAS',
      'NÃO LOCALIZADO - ALUNO DESCONHECIDO',
      'PREVENTIVO - 2 VIA DE BOLETO',
    ],
  },
  {
    id: 'informacao',
    nome: 'INFORMAÇÃO',
    descricao: 'Extrato, consulta de valores, esclarecimento de dúvidas e status',
    iconName: 'HelpCircle',
    submotivos: [
      'Consulta de saldo devedor / Extrato financeiro',
      'Dúvidas sobre valores de mensalidade, taxas e encargos',
      'Informações sobre formas de pagamento e opções disponíveis',
      'Confirmação de baixa de pagamento / Comprovante',
      'Informações sobre status acadêmico e rematrícula',
      'Informações sobre emissão de histórico ou documentos',
      'Informações sobre endereço, canais e horários do polo',
      'Orientações gerais de acesso ao portal do aluno / AVA',
    ],
  },
];

export const ACOES_PREDEFINIDAS = [
  'Enviado protocolo e resumo por E-mail',
  'Enviado link/boleto via WhatsApp',
  'Orientações passadas verbalmente em linha',
  'Encaminhado chamado para setor responsável',
  'Atualizado cadastro e contatos do aluno',
  'Anexado documento/comprovante no sistema',
  'Criado agendamento de retorno com o aluno',
  'Esclarecida dúvida de navegação no AVA',
];

export const SETORES_DESTINO = [
  'Financeiro & Cobrança',
  'Secretaria Acadêmica Central',
  'Coordenação de Curso',
  'Suporte de TI & AVA',
  'Central de Bolsas & FIES',
  'Ouvidoria Geral',
  'Núcleo de Estágios & Carreiras',
  'Gestão de Polos / Coordenação Local',
];

export const FRASES_RAPIDAS = [
  {
    categoria: 'Negociação',
    texto: 'Acordo realizado com sucesso.',
  },
  {
    categoria: 'Recusa',
    texto: 'Aluno não aceitou a oferta',
  },
  {
    categoria: 'Informação',
    texto: 'Prestadas informações acadêmicas.',
  },
];

export const INITIAL_ALUNOS: Aluno[] = [];

export const INITIAL_TABULACOES: Tabulacao[] = [];

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'usr-01',
    nome: 'Carlos Santos Andrade',
    usuario: 'carlos.santos',
    senha: '123456',
    perfil: 'Supervisor',
    ativo: true,
    matricula: 'SUP-014',
    emailCorporativo: 'carlos.santos@intervalor.com.br',
    createdAt: '2026-01-10T08:00:00',
  },
  {
    id: 'usr-02',
    nome: 'Juliana Rocha Silva',
    usuario: 'juliana.rocha',
    senha: '123456',
    perfil: 'Supervisor',
    ativo: true,
    matricula: 'SUP-022',
    emailCorporativo: 'juliana.rocha@intervalor.com.br',
    createdAt: '2026-01-15T09:30:00',
  },
  {
    id: 'usr-03',
    nome: 'Gerência Operacional',
    usuario: 'gerencia.operacional',
    senha: '123456',
    perfil: 'Gerencial',
    ativo: true,
    matricula: 'GER-001',
    emailCorporativo: 'gerencia@intervalor.com.br',
    createdAt: '2026-01-12T08:15:00',
  },
  {
    id: 'usr-04',
    nome: 'Administrador do Sistema',
    usuario: 'admin',
    senha: '123456',
    perfil: 'ADM',
    ativo: true,
    matricula: 'ADM-001',
    emailCorporativo: 'admin@intervalor.com.br',
    createdAt: '2026-01-01T00:00:00',
  },
  {
    id: 'usr-05',
    nome: 'Wellington Barbosa',
    usuario: 'wsbarbosa',
    senha: '123456',
    perfil: 'Operador',
    supervisor: 'Carlos Santos Andrade',
    ativo: true,
    matricula: 'OP-8821',
    emailCorporativo: 'wsbarbosa@intervalor.com.br',
    ultimoLogin: '2026-09-01T11:20:00',
    createdAt: '2026-02-01T10:00:00',
  },
  {
    id: 'usr-06',
    nome: 'Beatriz Lima Ferreira',
    usuario: 'beatriz.lima',
    senha: '123456',
    perfil: 'Operador',
    supervisor: 'Juliana Rocha Silva',
    ativo: true,
    matricula: 'OP-9044',
    emailCorporativo: 'beatriz.lima@intervalor.com.br',
    ultimoLogin: '2026-09-01T09:15:00',
    createdAt: '2026-02-10T14:15:00',
  }
];

export const INITIAL_BASE_ATENDIMENTO: BaseAtendimentoItem[] = [
  {
    id: 'base-01',
    nome: 'Ana Clara da Silva',
    matricula: 'RA20240188',
    unidade: 'FORTALEZA - CE',
    whatsapp: '(11) 98765-4321',
    observacao: 'Tentativa de acordo pendente',
    createdAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'base-02',
    nome: 'Lucas Oliveira Ferreira',
    matricula: 'RA20230512',
    unidade: 'TOM JOBIM - RJ',
    whatsapp: '(21) 99123-8877',
    observacao: 'Negociação recente em andamento',
    createdAt: '2026-08-15T10:30:00Z',
  },
  {
    id: 'base-03',
    nome: 'Beatriz Santos Souza',
    matricula: 'RA20220944',
    unidade: 'SALVADOR - BA',
    whatsapp: '(31) 98456-1122',
    observacao: 'Aguardando confirmação de parcela',
    createdAt: '2026-08-18T11:15:00Z',
  },
  {
    id: 'base-04',
    nome: 'Carlos Eduardo Mendes',
    matricula: 'RA20250031',
    unidade: 'BELEM - PA',
    whatsapp: '(41) 97111-3344',
    observacao: 'Alega dificuldades financeiras',
    createdAt: '2026-08-20T14:00:00Z',
  },
  {
    id: 'base-05',
    nome: 'Mariana Costa Lima',
    matricula: 'RA20230899',
    unidade: 'NITEROI - RJ',
    whatsapp: '(21) 98822-4455',
    observacao: 'Sem histórico de contato recente',
    createdAt: '2026-08-22T16:00:00Z',
  },
  {
    id: 'base-06',
    nome: 'Rodrigo Albuquerque Dias',
    matricula: 'RA20241055',
    unidade: 'MANAUS - AM',
    whatsapp: '(92) 99344-7711',
    observacao: 'Fila de acionamento inicial',
    createdAt: '2026-08-25T08:45:00Z',
  },
  {
    id: 'base-07',
    nome: 'Fernanda Martins Ribeiro',
    matricula: 'RA20210773',
    unidade: 'TAGUATINGA - DF',
    whatsapp: '(61) 98112-9900',
    observacao: 'Interesse em renegociação via PIX',
    createdAt: '2026-08-28T13:20:00Z',
  }
];

export const SUPABASE_SQL_BASE_ATENDIMENTO = `-- ==============================================================================
-- SCRIPT EXCLUSIVO: TABELA BASE DE ATENDIMENTO (Campanhas WhatsApp)
-- Execute no SQL Editor do Supabase se precisar criar ou atualizar apenas esta tabela
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.base_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  unidade VARCHAR(100),
  whatsapp VARCHAR(50) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adições idempotentes para colunas que possam faltar em tabelas pré-existentes
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS unidade VARCHAR(100);
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Garantir constraint de matrícula única para permitir upsert inteligente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'base_atendimento_matricula_key'
  ) THEN
    BEGIN
      ALTER TABLE public.base_atendimento ADD CONSTRAINT base_atendimento_matricula_key UNIQUE (matricula);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_base_atendimento_matricula ON public.base_atendimento(matricula);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_unidade ON public.base_atendimento(unidade);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_nome ON public.base_atendimento(nome);

-- Políticas de Segurança (Row Level Security - RLS)
ALTER TABLE public.base_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para base_atendimento" ON public.base_atendimento;
CREATE POLICY "Permitir acesso total para base_atendimento" 
ON public.base_atendimento 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Habilitar Realtime para a base de atendimento
DO $$
BEGIN
  BEGIN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.base_atendimento; 
  EXCEPTION WHEN duplicate_object THEN 
    NULL; 
  END;
END $$;
`;

export const SUPABASE_SQL_CLEANUP = `-- ==============================================================================
-- SCRIPT DE LIMPEZA GERAL: REMOVER COLUNAS OBSOLETAS DAS TABELAS (DROP)
-- (Execute no SQL Editor do Supabase para remover colunas legadas e manter o banco enxuto)
-- ==============================================================================

-- 1. LIMPEZA NA TABELA DE ALUNOS (Remover campos desnecessários / não utilizados)
ALTER TABLE public.alunos 
  DROP COLUMN IF EXISTS modalidade,
  DROP COLUMN IF EXISTS semestre,
  DROP COLUMN IF EXISTS data_nascimento,
  DROP COLUMN IF EXISTS observacoes_gerais,
  DROP COLUMN IF EXISTS endereco,
  DROP COLUMN IF EXISTS bairro,
  DROP COLUMN IF EXISTS cidade,
  DROP COLUMN IF EXISTS uf,
  DROP COLUMN IF EXISTS cep;

-- 2. LIMPEZA NA TABELA DE TABULAÇÕES (Remover colunas descontinuadas)
ALTER TABLE public.tabulacoes 
  DROP COLUMN IF EXISTS status_atendimento,
  DROP COLUMN IF EXISTS prioridade,
  DROP COLUMN IF EXISTS sentimento,
  DROP COLUMN IF EXISTS acoes_tomadas,
  DROP COLUMN IF EXISTS setor_encaminhado,
  DROP COLUMN IF EXISTS data_retorno_agendado,
  DROP COLUMN IF EXISTS observacoes_internas;
`;

export const SUPABASE_SQL_MIGRATION = `-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO & ATUALIZAÇÃO (Para Bancos Supabase já Existentes)
-- Executa com segurança sem apagar nenhum dado existente nas suas tabelas
-- ==============================================================================

-- 1. Configurar o Fuso Horário Padrão do PostgreSQL para São Paulo (UTC-3)
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE anon SET timezone TO 'America/Sao_Paulo';
ALTER ROLE authenticated SET timezone TO 'America/Sao_Paulo';
ALTER ROLE service_role SET timezone TO 'America/Sao_Paulo';

-- 2. Habilitar Múltiplas Matrículas por CPF na Tabela de Alunos (remover restrição de CPF único)
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_cpf_key;
DROP INDEX IF EXISTS public.alunos_cpf_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_cpf_matricula_key'
  ) THEN
    BEGIN
      ALTER TABLE public.alunos ADD CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- 3. Atualizar Tabela de Tabulações com Novas Colunas
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS com_renovacao BOOLEAN DEFAULT false;
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS unidade VARCHAR(100);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS assessoria_atendimento VARCHAR(100);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS status_aluno VARCHAR(50);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS aluno_email VARCHAR(255);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS aluno_telefone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_tabulacoes_unidade ON public.tabulacoes(unidade);
CREATE INDEX IF NOT EXISTS idx_tabulacoes_tipo_negociacao ON public.tabulacoes(tipo_negociacao);

-- 3. Criar ou Atualizar Tabela de Base de Atendimento (Campanhas WhatsApp)
CREATE TABLE IF NOT EXISTS public.base_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  unidade VARCHAR(100),
  whatsapp VARCHAR(50) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS unidade VARCHAR(100);
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'base_atendimento_matricula_key'
  ) THEN
    BEGIN
      ALTER TABLE public.base_atendimento ADD CONSTRAINT base_atendimento_matricula_key UNIQUE (matricula);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_base_atendimento_matricula ON public.base_atendimento(matricula);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_unidade ON public.base_atendimento(unidade);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_nome ON public.base_atendimento(nome);

-- 4. Revalidar Políticas RLS de Acesso Total
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura e escrita de usuários" ON public.usuarios;
CREATE POLICY "Permitir leitura e escrita de usuários" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para alunos" ON public.alunos;
CREATE POLICY "Permitir acesso total para alunos" ON public.alunos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.tabulacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para tabulacoes" ON public.tabulacoes;
CREATE POLICY "Permitir acesso total para tabulacoes" ON public.tabulacoes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.base_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para base_atendimento" ON public.base_atendimento;
CREATE POLICY "Permitir acesso total para base_atendimento" ON public.base_atendimento FOR ALL USING (true) WITH CHECK (true);

-- 5. Habilitar Realtime em Todas as 4 Tabelas
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tabulacoes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.base_atendimento; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
`;

export const SUPABASE_SQL_MULTI_MATRICULA = `-- ==============================================================================
-- AJUSTE PARA MÚLTIPLAS MATRÍCULAS POR CPF (TABELA ALUNOS)
-- Permite cadastrar o mesmo aluno (CPF) com matrículas diferentes no Supabase
-- ==============================================================================

-- 1. Remove a restrição antiga que impedia mais de um cadastro por CPF
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_cpf_key;
DROP INDEX IF EXISTS public.alunos_cpf_key;

-- 2. Cria a nova restrição composta que garante unicidade por (CPF + Matrícula)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_cpf_matricula_key'
  ) THEN
    BEGIN
      ALTER TABLE public.alunos ADD CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
`;

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SISTEMA SIS ATP - SCHEMA SUPABASE COMPLETO (PostgreSQL DDL + RLS + Índices + Realtime + Seeds)
-- Execute no SQL Editor do Supabase para configurar todo o banco de uma só vez
-- ==============================================================================

-- 1. Configurar Fuso Horário de Brasília/São Paulo no PostgreSQL (UTC-3)
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE anon SET timezone TO 'America/Sao_Paulo';
ALTER ROLE authenticated SET timezone TO 'America/Sao_Paulo';
ALTER ROLE service_role SET timezone TO 'America/Sao_Paulo';

-- 2. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE USUÁRIOS E CONTROLE DE ACESSO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  usuario VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('Operador', 'Supervisor', 'Gerencial', 'Cliente', 'ADM')),
  supervisor VARCHAR(255),
  matricula VARCHAR(50),
  email_corporativo VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas e login rápido
CREATE INDEX IF NOT EXISTS idx_usuarios_login ON public.usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON public.usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON public.usuarios(matricula);

-- Políticas de Segurança (RLS) para Usuários
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura e escrita de usuários" ON public.usuarios;
CREATE POLICY "Permitir leitura e escrita de usuários" 
ON public.usuarios 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Usuários Iniciais Padrão (Senha padrão: 123456)
INSERT INTO public.usuarios (nome, usuario, senha, perfil, supervisor, matricula, email_corporativo, ativo)
VALUES 
  ('Carlos Santos Andrade', 'carlos.santos', '123456', 'Supervisor', NULL, 'SUP-014', 'carlos.santos@intervalor.com.br', true),
  ('Juliana Rocha Silva', 'juliana.rocha', '123456', 'Supervisor', NULL, 'SUP-022', 'juliana.rocha@intervalor.com.br', true),
  ('Gerência Operacional', 'gerencia.operacional', '123456', 'Gerencial', NULL, 'GER-001', 'gerencia@intervalor.com.br', true),
  ('Administrador do Sistema', 'admin', '123456', 'ADM', NULL, 'ADM-001', 'admin@intervalor.com.br', true),
  ('Wellington Barbosa', 'wsbarbosa', '123456', 'Operador', 'Carlos Santos Andrade', 'OP-8821', 'wsbarbosa@intervalor.com.br', true),
  ('Beatriz Lima Ferreira', 'beatriz.lima', '123456', 'Operador', 'Juliana Rocha Silva', 'OP-7740', 'beatriz.lima@intervalor.com.br', true)
ON CONFLICT (usuario) DO UPDATE SET
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  supervisor = EXCLUDED.supervisor,
  matricula = EXCLUDED.matricula,
  ativo = EXCLUDED.ativo;

-- ==============================================================================
-- 3. TABELA DE ALUNOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NOT NULL,
  ra VARCHAR(50),
  curso VARCHAR(255),
  polo VARCHAR(255),
  status_academico VARCHAR(50) DEFAULT 'ATIVO',
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula)
);

-- Permitir múltiplas matrículas para o mesmo CPF (remover unicidade exclusiva de CPF se existente)
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_cpf_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alunos_cpf_matricula_key'
  ) THEN
    BEGIN
      ALTER TABLE public.alunos ADD CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Índices de consulta de alunos por CPF, Matrícula e Nome
CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON public.alunos(cpf);
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON public.alunos(matricula);
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON public.alunos(nome);

-- Políticas de Segurança (RLS) para Alunos
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para alunos" ON public.alunos;
CREATE POLICY "Permitir acesso total para alunos" 
ON public.alunos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 4. TABELA DE TABULAÇÕES DE ATENDIMENTO E ACORDOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tabulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo VARCHAR(50) UNIQUE NOT NULL,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  aluno_cpf VARCHAR(14) NOT NULL,
  aluno_nome VARCHAR(255) NOT NULL,
  aluno_ra VARCHAR(50),
  aluno_curso VARCHAR(255),
  aluno_polo VARCHAR(255),
  aluno_email VARCHAR(255),
  aluno_telefone VARCHAR(50),
  unidade VARCHAR(100),
  assessoria_atendimento VARCHAR(100),
  status_aluno VARCHAR(50),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atendente_nome VARCHAR(255) NOT NULL,
  matricula_atendente VARCHAR(50) NOT NULL,
  canal_atendimento VARCHAR(50) NOT NULL,
  categoria_motivo VARCHAR(100) NOT NULL,
  submotivo VARCHAR(100) NOT NULL,
  
  -- Campos de Negociação / Acordo Financeiro
  tipo_negociacao VARCHAR(100),
  com_renovacao BOOLEAN DEFAULT false,
  quantidade_parcelas INTEGER,
  data_primeira_parcela DATE,
  valor_entrada NUMERIC(12, 2),
  valor_parcela NUMERIC(12, 2),
  valor_total_acordo NUMERIC(12, 2),
  
  -- Tempo e Detalhamento
  tempo_atendimento_minutos INTEGER DEFAULT 0,
  detalhamento TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adições idempotentes para tabelas de tabulações já existentes
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS com_renovacao BOOLEAN DEFAULT false;
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS unidade VARCHAR(100);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS assessoria_atendimento VARCHAR(100);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS status_aluno VARCHAR(50);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS aluno_email VARCHAR(255);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS aluno_telefone VARCHAR(50);

-- Índices de consulta para relatórios, operadores e métricas
CREATE INDEX IF NOT EXISTS idx_tabulacoes_protocolo ON public.tabulacoes(protocolo);
CREATE INDEX IF NOT EXISTS idx_tabulacoes_cpf ON public.tabulacoes(aluno_cpf);
CREATE INDEX IF NOT EXISTS idx_tabulacoes_matricula_atendente ON public.tabulacoes(matricula_atendente);
CREATE INDEX IF NOT EXISTS idx_tabulacoes_data_hora ON public.tabulacoes(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_tabulacoes_tipo_negociacao ON public.tabulacoes(tipo_negociacao);
CREATE INDEX IF NOT EXISTS idx_tabulacoes_unidade ON public.tabulacoes(unidade);

-- Políticas de Segurança (RLS) para Tabulações
ALTER TABLE public.tabulacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para tabulacoes" ON public.tabulacoes;
CREATE POLICY "Permitir acesso total para tabulacoes" 
ON public.tabulacoes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 5. TABELA DE BASE DE ATENDIMENTO (Campanha / Acionamento com WhatsApp)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.base_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  unidade VARCHAR(100),
  whatsapp VARCHAR(50) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adições idempotentes para tabelas de base_atendimento já existentes
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS unidade VARCHAR(100);
ALTER TABLE public.base_atendimento ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Garantir constraint de matrícula única para upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'base_atendimento_matricula_key'
  ) THEN
    BEGIN
      ALTER TABLE public.base_atendimento ADD CONSTRAINT base_atendimento_matricula_key UNIQUE (matricula);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_base_atendimento_matricula ON public.base_atendimento(matricula);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_unidade ON public.base_atendimento(unidade);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_nome ON public.base_atendimento(nome);

-- Políticas de Segurança (Row Level Security - RLS) para Base de Atendimento
ALTER TABLE public.base_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para base_atendimento" ON public.base_atendimento;
CREATE POLICY "Permitir acesso total para base_atendimento" 
ON public.base_atendimento 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 6. HABILITAR REALTIME (Sincronização em tempo real entre operadores)
-- ==============================================================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tabulacoes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.base_atendimento; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
`;

export const SUPABASE_SQL_RESET = `-- ==============================================================================
-- SCRIPT DE REDEFINIÇÃO TOTAL (DROP & RECREATE - AMBIENTE DE TESTES / REINÍCIO)
-- ATENÇÃO: Este script apagará todas as tabelas e dados existentes no Supabase!
-- Use apenas se você quiser recriar toda a estrutura do zero com dados limpos.
-- ==============================================================================

-- 1. Remover tabelas existentes com cascade
DROP TABLE IF EXISTS public.base_atendimento CASCADE;
DROP TABLE IF EXISTS public.tabulacoes CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- 2. Configurar Fuso Horário
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE anon SET timezone TO 'America/Sao_Paulo';
ALTER ROLE authenticated SET timezone TO 'America/Sao_Paulo';
ALTER ROLE service_role SET timezone TO 'America/Sao_Paulo';

-- 3. Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 4. Criar Tabela de Usuários
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  usuario VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('Operador', 'Supervisor', 'Gerencial', 'Cliente', 'ADM')),
  supervisor VARCHAR(255),
  matricula VARCHAR(50),
  email_corporativo VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_login ON public.usuarios(usuario);
CREATE INDEX idx_usuarios_perfil ON public.usuarios(perfil);
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura e escrita de usuários" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

-- Inserir Usuários Iniciais Padrão
INSERT INTO public.usuarios (nome, usuario, senha, perfil, supervisor, matricula, email_corporativo, ativo)
VALUES 
  ('Carlos Santos Andrade', 'carlos.santos', '123456', 'Supervisor', NULL, 'SUP-014', 'carlos.santos@intervalor.com.br', true),
  ('Juliana Rocha Silva', 'juliana.rocha', '123456', 'Supervisor', NULL, 'SUP-022', 'juliana.rocha@intervalor.com.br', true),
  ('Gerência Operacional', 'gerencia.operacional', '123456', 'Gerencial', NULL, 'GER-001', 'gerencia@intervalor.com.br', true),
  ('Administrador do Sistema', 'admin', '123456', 'ADM', NULL, 'ADM-001', 'admin@intervalor.com.br', true),
  ('Wellington Barbosa', 'wsbarbosa', '123456', 'Operador', 'Carlos Santos Andrade', 'OP-8821', 'wsbarbosa@intervalor.com.br', true),
  ('Beatriz Lima Ferreira', 'beatriz.lima', '123456', 'Operador', 'Juliana Rocha Silva', 'OP-7740', 'beatriz.lima@intervalor.com.br', true);

-- 5. Criar Tabela de Alunos
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf VARCHAR(14) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NOT NULL,
  ra VARCHAR(50),
  curso VARCHAR(255),
  polo VARCHAR(255),
  status_academico VARCHAR(50) DEFAULT 'ATIVO',
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT alunos_cpf_matricula_key UNIQUE (cpf, matricula)
);

CREATE INDEX idx_alunos_cpf ON public.alunos(cpf);
CREATE INDEX idx_alunos_matricula ON public.alunos(matricula);
CREATE INDEX idx_alunos_nome ON public.alunos(nome);
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total para alunos" ON public.alunos FOR ALL USING (true) WITH CHECK (true);

-- 6. Criar Tabela de Tabulações
CREATE TABLE public.tabulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo VARCHAR(50) UNIQUE NOT NULL,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  aluno_cpf VARCHAR(14) NOT NULL,
  aluno_nome VARCHAR(255) NOT NULL,
  aluno_ra VARCHAR(50),
  aluno_curso VARCHAR(255),
  aluno_polo VARCHAR(255),
  aluno_email VARCHAR(255),
  aluno_telefone VARCHAR(50),
  unidade VARCHAR(100),
  assessoria_atendimento VARCHAR(100),
  status_aluno VARCHAR(50),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atendente_nome VARCHAR(255) NOT NULL,
  matricula_atendente VARCHAR(50) NOT NULL,
  canal_atendimento VARCHAR(50) NOT NULL,
  categoria_motivo VARCHAR(100) NOT NULL,
  submotivo VARCHAR(100) NOT NULL,
  tipo_negociacao VARCHAR(100),
  com_renovacao BOOLEAN DEFAULT false,
  quantidade_parcelas INTEGER,
  data_primeira_parcela DATE,
  valor_entrada NUMERIC(12, 2),
  valor_parcela NUMERIC(12, 2),
  valor_total_acordo NUMERIC(12, 2),
  tempo_atendimento_minutos INTEGER DEFAULT 0,
  detalhamento TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tabulacoes_protocolo ON public.tabulacoes(protocolo);
CREATE INDEX idx_tabulacoes_cpf ON public.tabulacoes(aluno_cpf);
CREATE INDEX idx_tabulacoes_matricula_atendente ON public.tabulacoes(matricula_atendente);
CREATE INDEX idx_tabulacoes_data_hora ON public.tabulacoes(data_hora DESC);
CREATE INDEX idx_tabulacoes_tipo_negociacao ON public.tabulacoes(tipo_negociacao);
CREATE INDEX idx_tabulacoes_unidade ON public.tabulacoes(unidade);
ALTER TABLE public.tabulacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total para tabulacoes" ON public.tabulacoes FOR ALL USING (true) WITH CHECK (true);

-- 7. Criar Tabela de Base de Atendimento
CREATE TABLE public.base_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  unidade VARCHAR(100),
  whatsapp VARCHAR(50) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_base_atendimento_matricula ON public.base_atendimento(matricula);
CREATE INDEX idx_base_atendimento_unidade ON public.base_atendimento(unidade);
CREATE INDEX idx_base_atendimento_nome ON public.base_atendimento(nome);
ALTER TABLE public.base_atendimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acesso total para base_atendimento" ON public.base_atendimento FOR ALL USING (true) WITH CHECK (true);

-- 8. Ativar Realtime em todas as tabelas
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tabulacoes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.base_atendimento; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
`;
