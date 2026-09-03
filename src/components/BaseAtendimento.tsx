import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Send, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  HelpCircle, 
  MapPin, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Database, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { BaseAtendimentoItem, StatusAtendimento60Dias, Tabulacao, Usuario } from '../types';
import { UNIDADES_LISTA } from '../data/mockData';
import { generateUUID } from '../utils/cpf';

interface BaseAtendimentoProps {
  baseAtendimento?: BaseAtendimentoItem[];
  base?: BaseAtendimentoItem[];
  tabulacoes?: Tabulacao[];
  currentUser: Usuario | null;
  onSaveItem: (item: BaseAtendimentoItem) => Promise<boolean | void> | boolean | void;
  onBatchImport: (items: BaseAtendimentoItem[]) => Promise<{ count: number; error: string | null } | number | void> | { count: number; error: string | null } | number | void;
  onDeleteItem: (id: string) => Promise<boolean | void> | boolean | void;
  onRefreshData?: () => void;
  onOpenSupabaseScript?: () => void;
}

const DEFAULT_MESSAGE_TEMPLATE = `Olá {primeiro_nome}! Eu sou XXXXXX XXXXXXXX, especialista em Negociação e Renovação.

Suas aulas já iniciaram e uma *nova oferta de RENOVAÇÃO* foi liberada para sua matrícula ({matricula}).
Para aproveitar, fale comigo presencialmente em nosso campus ou aqui pelo WhatsApp.`;

const LEGACY_DEFAULT_TEMPLATE = `Olá {primeiro_nome}, tudo bem? Sou da equipe de atendimento da sua instituição. Entramos em contato referente à sua matrícula {matricula} da unidade {unidade}. Notamos que seu status recente é {status}. Como podemos te apoiar hoje?`;

export const BaseAtendimento: React.FC<BaseAtendimentoProps> = ({
  baseAtendimento: propBaseAtendimento,
  base: propBase,
  tabulacoes = [],
  currentUser,
  onSaveItem,
  onBatchImport,
  onDeleteItem,
  onRefreshData,
  onOpenSupabaseScript,
}) => {
  const baseAtendimento = propBaseAtendimento || propBase || [];
  const safeTabulacoes = tabulacoes || [];
  const isAdm = currentUser?.perfil === 'ADM';

  // Template de mensagem personalizada
  const [messageTemplate, setMessageTemplate] = useState<string>(() => {
    const saved = localStorage.getItem('base_atendimento_msg_template');
    if (!saved || saved.trim() === LEGACY_DEFAULT_TEMPLATE.trim()) {
      localStorage.setItem('base_atendimento_msg_template', DEFAULT_MESSAGE_TEMPLATE);
      return DEFAULT_MESSAGE_TEMPLATE;
    }
    return saved;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isTemplateCardExpanded, setIsTemplateCardExpanded] = useState(true);

  // Filtros de busca na tabela
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnidade, setSelectedUnidade] = useState('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [sortField, setSortField] = useState<'nome' | 'matricula' | 'unidade' | 'status'>('nome');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BaseAtendimentoItem | null>(null);

  // Form State
  const [formNome, setFormNome] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formUnidade, setFormUnidade] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formObservacao, setFormObservacao] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Import Batch State
  const [importRawText, setImportRawText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Ref da textarea de mensagem para inserção de variáveis no cursor
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Salvar template quando alterado
  useEffect(() => {
    localStorage.setItem('base_atendimento_msg_template', messageTemplate);
  }, [messageTemplate]);

  // Função para normalizar matrícula/RA para cruzamento seguro
  const normalizeMatricula = (m: string | undefined | null): string => {
    if (!m) return '';
    return m.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  // ------------------------------------------------------------------
  // CÁLCULO DE STATUS DOS ÚLTIMOS 60 DIAS
  // Cruzando o aluno_ra da tabela tabulacoes com a matrícula
  // ------------------------------------------------------------------
  const calculateAlunoStatus = useMemo(() => {
    const now = new Date().getTime();
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

    // Mapa de tabulações indexadas por RA normalizado
    const tabulacoesPorRa: Record<string, Tabulacao[]> = {};

    safeTabulacoes.forEach((tab) => {
      const raKey = normalizeMatricula(tab.alunoRa);
      if (!raKey) return;
      if (!tabulacoesPorRa[raKey]) {
        tabulacoesPorRa[raKey] = [];
      }
      tabulacoesPorRa[raKey].push(tab);
    });

    return (matricula: string): { 
      status: StatusAtendimento60Dias; 
      totalContatos60Dias: number; 
      ultimaTabulacao?: Tabulacao;
      diasDesdeUltima?: number;
    } => {
      const raKey = normalizeMatricula(matricula);
      const studentTabs = tabulacoesPorRa[raKey] || [];

      // Filtra apenas tabulações ocorridas nos últimos 60 dias
      const tabs60Dias = studentTabs.filter((t) => {
        try {
          const tabTime = new Date(t.dataHora).getTime();
          return !isNaN(tabTime) && (now - tabTime) <= SIXTY_DAYS_MS;
        } catch {
          return false;
        }
      });

      if (tabs60Dias.length === 0) {
        return {
          status: 'Sem Histórico',
          totalContatos60Dias: 0,
        };
      }

      // Ordena da mais recente para a mais antiga
      tabs60Dias.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      const maisRecente = tabs60Dias[0];
      const diasDesdeUltima = Math.floor((now - new Date(maisRecente.dataHora).getTime()) / (1000 * 60 * 60 * 24));

      // Regra de classificação de Status:
      // Analisamos se nos últimos 60 dias há Recusa, Negociação ou Informação
      // Prioridade: Negociação recente > Recusa > Informação
      let statusResult: StatusAtendimento60Dias = 'Informação';

      // Verifica no histórico recente se houve Negociação ou Recusa
      const hasNegociacao = tabs60Dias.some(t => 
        (t.categoriaMotivo && t.categoriaMotivo.toUpperCase().includes('NEGOCIA')) ||
        (t.tipoNegociacao && t.tipoNegociacao.trim() !== '') ||
        (t.submotivo && t.submotivo.toUpperCase().includes('ACORDO')) ||
        (t.submotivo && t.submotivo.toUpperCase().includes('PAGAMENTO'))
      );

      const hasRecusa = tabs60Dias.some(t => 
        (t.categoriaMotivo && t.categoriaMotivo.toUpperCase().includes('RECUSA')) ||
        (t.submotivo && t.submotivo.toUpperCase().includes('RECUSA')) ||
        (t.submotivo && t.submotivo.toUpperCase().includes('SEM INTERESSE'))
      );

      const hasInformacao = tabs60Dias.some(t => 
        (t.categoriaMotivo && t.categoriaMotivo.toUpperCase().includes('INFORMA')) ||
        (t.submotivo && t.submotivo.toUpperCase().includes('DUVIDA')) ||
        (t.submotivo && t.submotivo.toUpperCase().includes('SOLICITA'))
      );

      // Decisão pelo contato mais recente ou gravidade
      const catMaisRecente = (maisRecente.categoriaMotivo || '').toUpperCase();
      if (catMaisRecente.includes('NEGOCIA') || (maisRecente.tipoNegociacao && maisRecente.tipoNegociacao.trim() !== '')) {
        statusResult = 'Negociação';
      } else if (catMaisRecente.includes('RECUSA')) {
        statusResult = 'Recusa';
      } else if (catMaisRecente.includes('INFORMA')) {
        statusResult = 'Informação';
      } else if (hasNegociacao) {
        statusResult = 'Negociação';
      } else if (hasRecusa) {
        statusResult = 'Recusa';
      } else if (hasInformacao) {
        statusResult = 'Informação';
      } else {
        statusResult = 'Informação';
      }

      return {
        status: statusResult,
        totalContatos60Dias: tabs60Dias.length,
        ultimaTabulacao: maisRecente,
        diasDesdeUltima,
      };
    };
  }, [safeTabulacoes]);

  // Montar lista enriquecida com o cálculo de status
  const enrichedList = useMemo(() => {
    return baseAtendimento.map((item) => {
      const { status, totalContatos60Dias, ultimaTabulacao, diasDesdeUltima } = calculateAlunoStatus(item.matricula);
      return {
        ...item,
        status60d: status,
        totalContatos60Dias,
        ultimaTabulacao,
        diasDesdeUltima,
      };
    });
  }, [baseAtendimento, calculateAlunoStatus]);

  // Estatísticas de contagem no topo
  const stats = useMemo(() => {
    const total = enrichedList.length;
    let negociacao = 0;
    let recusa = 0;
    let informacao = 0;
    let semHistorico = 0;

    enrichedList.forEach((item) => {
      if (item.status60d === 'Negociação') negociacao++;
      else if (item.status60d === 'Recusa') recusa++;
      else if (item.status60d === 'Informação') informacao++;
      else if (item.status60d === 'Sem Histórico') semHistorico++;
    });

    return { total, negociacao, recusa, informacao, semHistorico };
  }, [enrichedList]);

  // Lista filtrada e ordenada
  const filteredList = useMemo(() => {
    return enrichedList.filter((item) => {
      // Filtro de texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchNome = item.nome.toLowerCase().includes(term);
        const matchMatricula = item.matricula.toLowerCase().includes(term);
        const matchWhats = item.whatsapp.toLowerCase().includes(term);
        if (!matchNome && !matchMatricula && !matchWhats) return false;
      }

      // Filtro de Unidade
      if (selectedUnidade !== 'TODAS' && item.unidade !== selectedUnidade) {
        return false;
      }

      // Filtro de Status
      if (selectedStatus !== 'TODOS' && item.status60d !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'nome') {
        valA = a.nome;
        valB = b.nome;
      } else if (sortField === 'matricula') {
        valA = a.matricula;
        valB = b.matricula;
      } else if (sortField === 'unidade') {
        valA = a.unidade || '';
        valB = b.unidade || '';
      } else if (sortField === 'status') {
        valA = a.status60d;
        valB = b.status60d;
      }

      const cmp = valA.localeCompare(valB, 'pt-BR');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [enrichedList, searchTerm, selectedUnidade, selectedStatus, sortField, sortDirection]);

  // Inserir variável na caixa de mensagem no local do cursor
  const handleInsertVariable = (variableKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageTemplate((prev) => prev + ` ${variableKey}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageTemplate;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newText = before + variableKey + after;
    setMessageTemplate(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableKey.length, start + variableKey.length);
    }, 50);
  };

  // Gerar mensagem personalizada para um aluno específico
  const formatMessageForAluno = (item: typeof enrichedList[0]): string => {
    const primeiroNome = item.nome.trim().split(' ')[0] || item.nome;
    return messageTemplate
      .replace(/{nome}/g, item.nome)
      .replace(/{primeiro_nome}/g, primeiroNome)
      .replace(/{matricula}/g, item.matricula)
      .replace(/{unidade}/g, item.unidade || 'sua unidade')
      .replace(/{status}/g, item.status60d)
      .replace(/{whatsapp}/g, item.whatsapp);
  };

  // Disparar WhatsApp
  const handleOpenWhatsApp = (item: typeof enrichedList[0]) => {
    const rawNumber = item.whatsapp.replace(/\D/g, '');
    if (!rawNumber) {
      alert('Número de WhatsApp inválido.');
      return;
    }

    // Se não tiver o 55 do Brasil, adiciona
    const formattedNumber = rawNumber.length <= 11 ? `55${rawNumber}` : rawNumber;
    const message = formatMessageForAluno(item);
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${formattedNumber}?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copiar mensagem gerada
  const handleCopyMessage = (item: typeof enrichedList[0]) => {
    const msg = formatMessageForAluno(item);
    navigator.clipboard.writeText(msg);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copiar template atual
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(messageTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  // Alternar ordenação
  const handleToggleSort = (field: 'nome' | 'matricula' | 'unidade' | 'status') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormNome('');
    setFormMatricula('');
    setFormUnidade(UNIDADES_LISTA[0] || 'FORTALEZA - CE');
    setFormWhatsapp('');
    setFormObservacao('');
    setIsNewModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (item: BaseAtendimentoItem) => {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormMatricula(item.matricula);
    setFormUnidade(item.unidade || UNIDADES_LISTA[0]);
    setFormWhatsapp(item.whatsapp);
    setFormObservacao(item.observacao || '');
    setIsNewModalOpen(true);
  };

  // Salvar formulário
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formMatricula.trim() || !formWhatsapp.trim()) {
      alert('Preencha Nome, Matrícula e WhatsApp.');
      return;
    }

    setFormSubmitting(true);
    const itemToSave: BaseAtendimentoItem = {
      id: editingItem ? editingItem.id : `base-${Date.now()}`,
      nome: formNome.trim(),
      matricula: formMatricula.trim(),
      unidade: formUnidade.trim(),
      whatsapp: formWhatsapp.trim(),
      observacao: formObservacao.trim(),
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    const success = await onSaveItem(itemToSave);
    setFormSubmitting(false);

    if (success) {
      setIsNewModalOpen(false);
    }
  };

  // Deletar item
  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente remover "${nome}" da Base de Atendimento?`)) {
      await onDeleteItem(id);
    }
  };

  // Processar importação em lote
  const handleProcessImport = async () => {
    if (!isAdm) {
      alert('Apenas usuários com perfil ADM podem importar listas.');
      return;
    }

    if (!importRawText.trim()) {
      alert('Cole o texto das linhas para importar.');
      return;
    }

    setIsImporting(true);
    setImportStatus(null);

    const lines = importRawText.split('\n').filter(l => l.trim().length > 0);
    const itemsToImport: BaseAtendimentoItem[] = [];

    // Tentar detectar delimitador: tabulação (\t), ponto e vírgula (;), ou vírgula (,)
    for (const line of lines) {
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      if (parts.length < 2) parts = line.split(',');

      if (parts.length >= 2) {
        const nome = parts[0]?.trim();
        const matricula = parts[1]?.trim();
        const unidade = parts[2]?.trim() || '';
        const whatsapp = parts[3]?.trim() || parts[2]?.trim() || '';
        const observacao = parts[4]?.trim() || '';

        // Ignorar linha de cabeçalho
        if (nome.toLowerCase().includes('nome') && matricula.toLowerCase().includes('matr')) {
          continue;
        }

        if (nome && matricula) {
          itemsToImport.push({
            id: generateUUID(),
            nome,
            matricula,
            unidade: unidade || 'FORTALEZA - CE',
            whatsapp: whatsapp || '(11) 99999-9999',
            observacao,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    if (itemsToImport.length === 0) {
      setImportStatus('Nenhum registro válido identificado. Certifique-se de usar colunas: Nome, Matrícula, Unidade, WhatsApp.');
      setIsImporting(false);
      return;
    }

    const res = await onBatchImport(itemsToImport);
    setIsImporting(false);

    let count = itemsToImport.length;
    let cloudError: string | null = null;

    if (typeof res === 'object' && res !== null && 'count' in res) {
      count = res.count;
      cloudError = res.error;
    } else if (typeof res === 'number') {
      count = res;
    }

    if (cloudError) {
      setImportStatus(`Salvo localmente (${count} registros), mas o banco Supabase retornou aviso: ${cloudError}`);
    } else {
      setImportStatus(`Sucesso! ${count} registros importados e gravados no banco Supabase na tabela base_atendimento.`);
    }

    setTimeout(() => {
      setIsImportModalOpen(false);
      setImportRawText('');
      setImportStatus(null);
    }, 2000);
  };

  // Preview de mensagem para o primeiro registro
  const sampleStudent = enrichedList[0];
  const sampleMessagePreview = sampleStudent ? formatMessageForAluno(sampleStudent) : '';

  // Cores e Ícones de Status
  const getStatusBadge = (status: StatusAtendimento60Dias, contatos = 0, dias?: number) => {
    switch (status) {
      case 'Negociação':
        return (
          <span 
            title={dias !== undefined ? `Negociação registrada há ${dias} dia(s). Total recente: ${contatos}` : undefined}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Negociação</span>
            {contatos > 1 && (
              <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded-full">
                {contatos}
              </span>
            )}
          </span>
        );
      case 'Recusa':
        return (
          <span 
            title={dias !== undefined ? `Recusa registrada há ${dias} dia(s). Total recente: ${contatos}` : undefined}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Recusa</span>
            {contatos > 1 && (
              <span className="text-[10px] bg-rose-200/80 px-1.5 py-0.2 rounded-full">
                {contatos}
              </span>
            )}
          </span>
        );
      case 'Informação':
        return (
          <span 
            title={dias !== undefined ? `Informação/Dúvida registrada há ${dias} dia(s). Total recente: ${contatos}` : undefined}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200"
          >
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Informação</span>
            {contatos > 1 && (
              <span className="text-[10px] bg-sky-200/80 px-1.5 py-0.2 rounded-full">
                {contatos}
              </span>
            )}
          </span>
        );
      case 'Sem Histórico':
      default:
        return (
          <span 
            title="Nenhum atendimento registrado nos últimos 60 dias"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Sem Histórico</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER DA PÁGINA COM AÇÕES */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Base de Atendimento
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                {stats.total} alunos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cruzamento dos últimos 60 dias com tabulações e acionamento direto via WhatsApp
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Recarregar dados"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {isAdm ? (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-indigo-600/20"
            >
              <Upload className="w-4 h-4" />
              <span>Importar Lista</span>
            </button>
          ) : (
            <button
              disabled
              title="Apenas usuários com perfil ADM podem importar listas"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed opacity-60"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Importar Lista</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CAIXA ÚNICA DE PERSONALIZAÇÃO DE MENSAGEM DO WHATSAPP */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-indigo-500/30 p-5 sm:p-6 shadow-xl shadow-indigo-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Personalização da Mensagem do WhatsApp
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Variáveis Dinâmicas
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Edite a mensagem abaixo. Ao clicar no botão verde do WhatsApp na tabela, o texto já vai preenchido com os dados do aluno!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessageTemplate(DEFAULT_MESSAGE_TEMPLATE)}
              title="Restaurar mensagem padrão"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>

            <button
              onClick={() => setIsTemplateCardExpanded(!isTemplateCardExpanded)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isTemplateCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isTemplateCardExpanded && (
          <div className="mt-4 space-y-3">
            {/* Variáveis Rápidas para Inserção */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1 mr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Clique para inserir:
              </span>
              {[
                { label: '{primeiro_nome}', desc: 'Primeiro Nome' },
                { label: '{nome}', desc: 'Nome Completo' },
                { label: '{matricula}', desc: 'Matrícula' },
                { label: '{unidade}', desc: 'Unidade' },
              ].map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => handleInsertVariable(v.label)}
                  title={`Inserir ${v.desc}`}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-200 hover:text-white text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>{v.label}</span>
                </button>
              ))}
            </div>

            {/* Caixa de Texto Única */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={3}
                placeholder="Escreva a mensagem personalizada aqui. Use variáveis como {primeiro_nome}, {nome}, {matricula} e {unidade}..."
                className="w-full bg-slate-950/70 border border-indigo-500/30 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Pré-visualização com dados reais */}
            {sampleStudent && (
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 max-w-3xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Exemplo de como o aluno recebe (Simulação: {sampleStudent.nome}):
                  </span>
                  <p className="text-slate-200 italic leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    "{sampleMessagePreview}"
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={handleCopyTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer border border-slate-700"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Modelo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BARRA DE FILTROS E BUSCA */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Busca por Nome ou Matrícula */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, matrícula ou WhatsApp..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Filtro por Unidade */}
          <div className="sm:w-56">
            <select
              value={selectedUnidade}
              onChange={(e) => setSelectedUnidade(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
            >
              <option value="TODAS">Todas as Unidades</option>
              {UNIDADES_LISTA.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status 60d */}
          <div className="sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
            >
              <option value="TODOS">Todos os Status (60d)</option>
              <option value="Negociação">Negociação</option>
              <option value="Recusa">Recusa</option>
              <option value="Informação">Informação</option>
              <option value="Sem Histórico">Sem Histórico</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end md:self-center">
          Exibindo <strong>{filteredList.length}</strong> de {enrichedList.length}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABELA DE ALUNOS DA BASE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th 
                  onClick={() => handleToggleSort('nome')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nome do Aluno</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleToggleSort('matricula')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Matrícula</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleToggleSort('unidade')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Unidade</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleToggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status (Últimos 60 Dias)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">
                  WhatsApp & Ação
                </th>
                <th className="py-3 px-3 text-right">
                  Opções
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Nenhum aluno encontrado na base</p>
                      <p className="text-xs text-slate-400">Tente ajustar os filtros ou adicione novos alunos à base.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      {/* Nome */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-900 font-semibold">{item.nome}</div>
                            {item.observacao && (
                              <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs" title={item.observacao}>
                                {item.observacao}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Matrícula */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {item.matricula}
                        </span>
                      </td>

                      {/* Unidade */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{item.unidade || 'Não informada'}</span>
                        </div>
                      </td>

                      {/* Status (60 dias) */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(item.status60d, item.totalContatos60Dias, item.diasDesdeUltima)}
                          {item.ultimaTabulacao && (
                            <span className="text-[10px] text-slate-400">
                              Último: {new Date(item.ultimaTabulacao.dataHora).toLocaleDateString('pt-BR')} ({item.ultimaTabulacao.categoriaMotivo})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp e Ação */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenWhatsApp(item)}
                            title="Iniciar conversa no WhatsApp com mensagem preenchida"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{item.whatsapp}</span>
                          </button>

                          <button
                            onClick={() => handleCopyMessage(item)}
                            title="Copiar mensagem personalizada para a área de transferência"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Opções (Editar / Excluir) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar informações"
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nome)}
                            title="Remover da base"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: NOVO / EDITAR ALUNO NA BASE */}
      {/* ------------------------------------------------------------------ */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">
              {editingItem ? 'Editar Registro na Base' : 'Adicionar Aluno na Base'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira as informações do aluno para acionamento na campanha
            </p>

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Matrícula / RA *
                </label>
                <input
                  type="text"
                  required
                  value={formMatricula}
                  onChange={(e) => setFormMatricula(e.target.value)}
                  placeholder="Ex: RA20240188"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Usado para cruzar automaticamente o histórico dos últimos 60 dias nas tabulações
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade
                </label>
                <select
                  value={formUnidade}
                  onChange={(e) => setFormUnidade(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                >
                  {UNIDADES_LISTA.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp (com DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  value={formObservacao}
                  onChange={(e) => setFormObservacao(e.target.value)}
                  rows={2}
                  placeholder="Anotações sobre a campanha, oferta, etc."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Salvando...' : editingItem ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: IMPORTAÇÃO EM LOTE */}
      {/* ------------------------------------------------------------------ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Importar Alunos em Lote
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Cole as linhas diretamente de uma planilha do Excel ou arquivo CSV/TSV.
              <br />
              Formato esperado (separado por tabulação, ponto e vírgula ou vírgula):
              <br />
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                Nome | Matrícula | Unidade | WhatsApp | Observação
              </code>
            </p>

            <div className="mt-4 space-y-3">
              <textarea
                value={importRawText}
                onChange={(e) => setImportRawText(e.target.value)}
                rows={8}
                placeholder={`Ana Clara;RA20240188;FORTALEZA - CE;(11) 98765-4321;Bolsista\nLucas Ferreira;RA20230512;TOM JOBIM - RJ;(21) 99123-8877;Acordo`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-y"
              />

              {importStatus && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  importStatus.includes('Sucesso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {importStatus}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportRawText(`Ana Clara da Silva\tRA20240188\tFORTALEZA - CE\t(11) 98765-4321\tExemplo 1\nLucas Oliveira Ferreira\tRA20230512\tTOM JOBIM - RJ\t(21) 99123-8877\tExemplo 2`);
                  }}
                  className="text-xs text-indigo-600 hover:underline cursor-pointer"
                >
                  Inserir dados de exemplo
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportStatus(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessImport}
                    disabled={isImporting || !importRawText.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? 'Processando...' : 'Importar Registros'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: SCRIPT SQL PARA CRIAR TABELA NO BANCO */}
      {/* ------------------------------------------------------------------ */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Script SQL: Tabela Base de Atendimento
                </h3>
              </div>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Copie o comando abaixo e execute no <strong>SQL Editor</strong> do seu painel Supabase:
            </p>

            <div className="mt-4 relative">
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
{`-- ==============================================================================
-- TABELA: BASE DE ATENDIMENTO
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.base_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  unidade VARCHAR(100),
  whatsapp VARCHAR(50) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_base_atendimento_matricula ON public.base_atendimento(matricula);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_unidade ON public.base_atendimento(unidade);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_nome ON public.base_atendimento(nome);

-- Políticas de Segurança RLS
ALTER TABLE public.base_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para base_atendimento" ON public.base_atendimento;
CREATE POLICY "Permitir acesso total para base_atendimento" 
ON public.base_atendimento 
FOR ALL 
USING (true) 
WITH CHECK (true);`}
              </pre>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.base_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) NOT NULL,
  unidade VARCHAR(100),
  whatsapp VARCHAR(50) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_base_atendimento_matricula ON public.base_atendimento(matricula);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_unidade ON public.base_atendimento(unidade);
CREATE INDEX IF NOT EXISTS idx_base_atendimento_nome ON public.base_atendimento(nome);

ALTER TABLE public.base_atendimento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acesso total para base_atendimento" ON public.base_atendimento;
CREATE POLICY "Permitir acesso total para base_atendimento" 
ON public.base_atendimento 
FOR ALL 
USING (true) 
WITH CHECK (true);`);
                  alert('Script SQL copiado com sucesso!');
                }}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar SQL</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
