import { Aluno, CategoriaMotivoItem, Tabulacao, Usuario } from '../types';

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

export const INITIAL_ALUNOS: Aluno[] = [
  {
    id: 'alu-01',
    cpf: '123.456.789-00',
    nome: 'Ana Clara Silva Ribeiro',
    matricula: 'RA20240188',
    ra: 'RA20240188',
    email: 'anaclara.silva@email.com',
    telefone: '(11) 98765-4321',
    curso: 'Direito',
    polo: 'Campus Central - São Paulo/SP',
    modalidade: 'Presencial',
    semestre: '5º Semestre',
    statusAcademico: 'ATIVO',
    dataNascimento: '1999-04-15',
    observacoesGerais: 'Bolsista PROUNI 50%. Excelente frequência.',
    dataCadastro: '2024-01-10',
  },
  {
    id: 'alu-02',
    cpf: '987.654.321-11',
    nome: 'Lucas Oliveira Ferreira',
    matricula: 'RA20230512',
    ra: 'RA20230512',
    email: 'lucas.oliveira.fe@gmail.com',
    telefone: '(21) 99123-8877',
    curso: 'Engenharia de Software',
    polo: 'Polo Digital EAD - Rio de Janeiro/RJ',
    modalidade: 'EAD',
    semestre: '3º Semestre',
    statusAcademico: 'ATIVO',
    dataNascimento: '2001-11-20',
    observacoesGerais: 'Acesso frequente pelo AVA. Solicita suporte aos sábados.',
    dataCadastro: '2023-08-15',
  },
  {
    id: 'alu-03',
    cpf: '456.789.123-22',
    nome: 'Beatriz Santos Souza',
    matricula: 'RA20220944',
    ra: 'RA20220944',
    email: 'beatriz.souza@outlook.com',
    telefone: '(31) 98456-1122',
    curso: 'Administração',
    polo: 'Polo BH Savassi - Belo Horizonte/MG',
    modalidade: 'Semipresencial',
    semestre: '7º Semestre',
    statusAcademico: 'INATIVO',
    dataNascimento: '1998-07-03',
    observacoesGerais: 'Mensalidade do mês anterior em aberto. Aberto a negociação.',
    dataCadastro: '2022-02-01',
  },
  {
    id: 'alu-04',
    cpf: '789.123.456-33',
    nome: 'Carlos Eduardo Mendes',
    matricula: 'RA20250031',
    ra: 'RA20250031',
    email: 'carlos.mendes@empresa.com.br',
    telefone: '(41) 97111-3344',
    curso: 'Psicologia',
    polo: 'Campus Curitiba - Curitiba/PR',
    modalidade: 'Presencial',
    semestre: '1º Semestre',
    statusAcademico: 'INATIVO',
    dataNascimento: '2004-02-18',
    observacoesGerais: 'Documentos de conclusão do Ensino Médio pendentes.',
    dataCadastro: '2025-01-20',
  },
  {
    id: 'alu-05',
    cpf: '321.654.987-44',
    nome: 'Juliana Paes de Camargo',
    matricula: 'RA20210790',
    ra: 'RA20210790',
    email: 'juliana.camargo@live.com',
    telefone: '(51) 99888-5544',
    curso: 'Enfermagem',
    polo: 'Campus Porto Alegre - Porto Alegre/RS',
    modalidade: 'Presencial',
    semestre: '8º Semestre',
    statusAcademico: 'INATIVO',
    dataNascimento: '1997-09-12',
    observacoesGerais: 'Trancou no semestre passado por motivo de saúde.',
    dataCadastro: '2021-03-05',
  }
];

export const INITIAL_TABULACOES: Tabulacao[] = [
  {
    id: 'tab-01',
    protocolo: 'ATD-20260829-1042',
    unidade: 'Campus Central - São Paulo/SP',
    assessoriaAtendimento: 'Assessoria de Cobrança & Negociação',
    statusAluno: 'INATIVO',
    alunoCpf: '123.456.789-00',
    alunoNome: 'Ana Clara Silva Ribeiro',
    alunoEmail: 'ana.ribeiro@email.com',
    alunoTelefone: '(11) 98765-4321',
    alunoRa: 'RA20240188',
    alunoCurso: 'Direito',
    alunoPolo: 'Campus Central - São Paulo/SP',
    dataHora: '2026-08-29T09:15:00',
    atendenteNome: 'Wellington Barbosa',
    matriculaAtendente: 'OP-8821',
    canalAtendimento: 'WhatsApp',
    categoriaMotivo: 'NEGOCIAÇÃO',
    submotivo: 'Acordo / Parcelamento de mensalidades em atraso',
    tipoNegociacao: 'PIX',
    comRenovacao: false,
    quantidadeParcelas: 1,
    dataPrimeiraParcela: '2026-08-30',
    valorEntrada: 750.00,
    valorTotalAcordo: 750.00,
    statusAtendimento: 'Resolvido no 1º Contato',
    tempoAtendimentoMinutos: 4,
    detalhamento: 'Aluna realizou acordo para pagamento à vista via PIX com desconto. Chave PIX gerada e enviada via WhatsApp.',
    acoesTomadas: [],
    createdAt: '2026-08-29T09:19:00',
  },
  {
    id: 'tab-02',
    protocolo: 'ATD-20260828-9820',
    unidade: 'Polo Digital EAD',
    assessoriaAtendimento: 'Assessoria de Cobrança & Negociação',
    statusAluno: 'ATIVO',
    alunoCpf: '987.654.321-11',
    alunoNome: 'Lucas Oliveira Ferreira',
    alunoEmail: 'lucas.ferreira@gmail.com',
    alunoTelefone: '(21) 99123-9876',
    alunoRa: 'RA20230512',
    alunoCurso: 'Engenharia de Software',
    alunoPolo: 'Polo Digital EAD',
    dataHora: '2026-08-28T16:30:00',
    atendenteNome: 'Wellington Barbosa',
    matriculaAtendente: 'OP-8821',
    canalAtendimento: 'WhatsApp',
    categoriaMotivo: 'NEGOCIAÇÃO',
    submotivo: 'Negociação de débitos com emissão de boleto bancário',
    tipoNegociacao: 'BOLETO',
    comRenovacao: true,
    quantidadeParcelas: 4,
    dataPrimeiraParcela: '2026-09-05',
    valorEntrada: 300.00,
    valorParcela: 250.00,
    valorTotalAcordo: 1050.00,
    statusAtendimento: 'Resolvido no 1º Contato',
    tempoAtendimentoMinutos: 6,
    detalhamento: 'Aluno negociou débitos em 4x via Boleto (Entrada R$ 300,00 com vencimento em 05/09 + 3 parcelas de R$ 250,00). Boletos encaminhados por e-mail e WhatsApp.',
    acoesTomadas: [],
    createdAt: '2026-08-28T16:36:00',
  },
  {
    id: 'tab-03',
    protocolo: 'ATD-20260827-4412',
    unidade: 'Polo BH Savassi - Belo Horizonte/MG',
    assessoriaAtendimento: 'Assessoria de Cobrança & Negociação',
    statusAluno: 'INATIVO',
    alunoCpf: '456.789.123-22',
    alunoNome: 'Beatriz Santos Souza',
    alunoEmail: 'beatriz.souza@outlook.com',
    alunoTelefone: '(31) 98456-1122',
    alunoRa: 'RA20220944',
    alunoCurso: 'Administração',
    alunoPolo: 'Polo BH Savassi - Belo Horizonte/MG',
    dataHora: '2026-08-27T11:00:00',
    atendenteNome: 'Mariana Costa',
    matriculaAtendente: 'OP-7410',
    canalAtendimento: 'Telefone',
    categoriaMotivo: 'NEGOCIAÇÃO',
    submotivo: 'Quitação com utilização de saldo FGTS',
    tipoNegociacao: 'FGTS',
    comRenovacao: false,
    quantidadeParcelas: 1,
    dataPrimeiraParcela: '2026-09-01',
    valorEntrada: 1450.00,
    valorTotalAcordo: 1450.00,
    statusAtendimento: 'Resolvido no 1º Contato',
    tempoAtendimentoMinutos: 8,
    detalhamento: 'Aluna formalizou o termo para quitação integral através do FGTS.',
    acoesTomadas: [],
    createdAt: '2026-08-27T11:11:00',
  },
  {
    id: 'tab-04',
    protocolo: 'ATD-20260826-3390',
    unidade: 'Campus Curitiba - Curitiba/PR',
    assessoriaAtendimento: 'Assessoria de Cobrança & Negociação',
    statusAluno: 'INATIVO',
    alunoCpf: '789.123.456-33',
    alunoNome: 'Carlos Eduardo Mendes',
    alunoEmail: 'carlos.mendes@empresa.com.br',
    alunoTelefone: '(41) 97111-3344',
    alunoRa: 'RA20250031',
    alunoCurso: 'Psicologia',
    alunoPolo: 'Campus Curitiba - Curitiba/PR',
    dataHora: '2026-08-26T14:20:00',
    atendenteNome: 'Wellington Barbosa',
    matriculaAtendente: 'OP-8821',
    canalAtendimento: 'WhatsApp',
    categoriaMotivo: 'NEGOCIAÇÃO',
    submotivo: 'Pagamento de matrícula via Cartão de Crédito',
    tipoNegociacao: 'CARTÃO DE CRÉDITO',
    comRenovacao: false,
    quantidadeParcelas: 1,
    dataPrimeiraParcela: '2026-08-26',
    valorEntrada: 490.00,
    valorTotalAcordo: 490.00,
    statusAtendimento: 'Resolvido no 1º Contato',
    tempoAtendimentoMinutos: 5,
    detalhamento: 'Link de pagamento seguro com cartão de crédito aprovado.',
    acoesTomadas: [],
    createdAt: '2026-08-26T14:25:00',
  }
];

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

export const SUPABASE_SQL_CLEANUP = `-- ==============================================================================
-- SCRIPT DE LIMPEZA GERAL: REMOVER COLUNAS OBSOLETAS DAS TABELAS
-- (Execute no SQL Editor do Supabase para manter o banco limpo e enxuto)
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
  DROP COLUMN IF EXISTS cep,
  DROP COLUMN IF EXISTS ra,
  DROP COLUMN IF EXISTS curso,
  DROP COLUMN IF EXISTS polo,
  DROP COLUMN IF EXISTS status_academico;

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
-- SCRIPT DE MIGRAÇÃO RÁPIDA: ADICIONAR NOVAS COLUNAS E AJUSTAR FUSO HORÁRIO
-- (Use se você já possui a tabela e só precisa adicionar os novos campos)
-- ==============================================================================

-- 1. Configurar o Fuso Horário Padrão do PostgreSQL para São Paulo (UTC-3)
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE postgres SET timezone TO 'America/Sao_Paulo';
ALTER ROLE anon SET timezone TO 'America/Sao_Paulo';
ALTER ROLE authenticated SET timezone TO 'America/Sao_Paulo';
ALTER ROLE service_role SET timezone TO 'America/Sao_Paulo';

-- 2. Adicionar novas colunas se não existirem
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS com_renovacao BOOLEAN DEFAULT false;
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS unidade VARCHAR(100);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS assessoria_atendimento VARCHAR(100);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS status_aluno VARCHAR(50);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS aluno_email VARCHAR(255);
ALTER TABLE public.tabulacoes ADD COLUMN IF NOT EXISTS aluno_telefone VARCHAR(50);
`;

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SISTEMA SIS ATP - SCHEMA SUPABASE COMPLETO (PostgreSQL DDL + RLS + Índices)
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
  perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('Operador', 'Supervisor', 'Gerencial', 'ADM')),
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
  cpf VARCHAR(14) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NOT NULL,
  ra VARCHAR(50),
  curso VARCHAR(255),
  polo VARCHAR(255),
  status_academico VARCHAR(50) DEFAULT 'ATIVO',
  data_cadastro TIMESTAMPTZ DEFAULT NOW()
);

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

-- Migrações e Adições Idempotentes para Bancos já existentes
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

-- Políticas de Segurança (RLS) para Tabulações
ALTER TABLE public.tabulacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para tabulacoes" ON public.tabulacoes;
CREATE POLICY "Permitir acesso total para tabulacoes" 
ON public.tabulacoes 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;
