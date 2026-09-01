export type StatusAcademico = 'ATIVO' | 'INATIVO' | 'Ativo' | 'Inativo';

export type ModalidadeCurso = 'EAD' | 'Presencial' | 'Semipresencial' | 'Híbrido';

export interface Aluno {
  id: string;
  cpf: string;
  nome: string;
  matricula: string;
  ra?: string; // Matrícula / Registro Acadêmico
  email: string;
  telefone: string;
  curso?: string;
  polo?: string;
  modalidade?: ModalidadeCurso;
  semestre?: string;
  statusAcademico?: StatusAcademico;
  dataNascimento?: string;
  observacoesGerais?: string;
  dataCadastro?: string;
}

export type CanalAtendimento = 
  | 'WhatsApp' 
  | 'WhatsApp - M360'
  | 'Presencial' 
  | 'Telefone';

export type StatusAtendimento = 
  | 'Resolvido no 1º Contato' 
  | 'Em Andamento' 
  | 'Encaminhado para Setor' 
  | 'Pendente Documentação' 
  | 'Aguardando Aluno' 
  | 'Cancelado / Sem Contato' 
  | 'Agendado Retorno';

export type NivelUrgencia = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type SentimentoAluno = 'Satisfeito' | 'Neutro' | 'Insatisfeito' | 'Nervoso / Crítico';

export type TipoNegociacao = 
  | 'PIX' 
  | 'CARTÃO DE CRÉDITO' 
  | 'BOLETO' 
  | 'FGTS' 
  | 'FICOU FACIL';

export type TipoRenovacao = 'com_renovacao' | 'sem_renovacao';

export interface Tabulacao {
  id: string;
  protocolo: string;
  alunoId?: string;
  unidade?: string;
  assessoriaAtendimento?: string;
  statusAluno?: string;
  alunoCpf: string;
  alunoNome: string;
  alunoEmail?: string;
  alunoTelefone?: string;
  alunoRa: string;
  alunoCurso: string;
  alunoPolo: string;
  dataHora: string;
  atendenteNome: string;
  matriculaAtendente: string;
  canalAtendimento: CanalAtendimento;
  categoriaMotivo: string;
  submotivo: string;
  tipoNegociacao?: TipoNegociacao;
  comRenovacao?: boolean; // Se a negociação foi com renovação (true) ou sem renovação (false)
  quantidadeParcelas?: number;
  dataPrimeiraParcela?: string;
  valorEntrada?: number;
  valorParcela?: number;
  valorTotalAcordo?: number;
  statusAtendimento?: StatusAtendimento;
  prioridade?: NivelUrgencia;
  sentimento?: SentimentoAluno;
  tempoAtendimentoMinutos: number;
  detalhamento: string;
  acoesTomadas: string[];
  setorEncaminhado?: string;
  dataRetornoAgendado?: string;
  observacoesInternas?: string;
  anexosSimulados?: string[];
  createdAt: string;
}

export interface CategoriaMotivoItem {
  id: string;
  nome: string;
  descricao: string;
  iconName: string;
  submotivos: string[];
}

export type PerfilUsuario = 'Operador' | 'Supervisor' | 'Gerencial' | 'ADM';

export interface Usuario {
  id: string;
  nome: string;
  usuario: string; // login / username
  senha: string;
  perfil: PerfilUsuario;
  supervisor?: string; // Obrigatório/exibido apenas quando perfil === 'Operador'
  ativo?: boolean;
  emailCorporativo?: string;
  matricula?: string;
  createdAt: string;
}

