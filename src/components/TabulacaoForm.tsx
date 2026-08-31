import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Copy, 
  Check, 
  Send, 
  RotateCcw, 
  Play, 
  Pause, 
  Clock, 
  Headphones, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  FileText, 
  Landmark, 
  Wallet,
  Calendar,
  Calculator,
  Edit3,
  Building2,
  Users,
  UserCheck,
  RefreshCw,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { 
  Aluno, 
  CanalAtendimento, 
  Tabulacao,
  TipoNegociacao,
  TipoRenovacao 
} from '../types';
import { 
  CATEGORIAS_MOTIVOS, 
  FRASES_RAPIDAS,
  UNIDADES_LISTA,
  ASSESSORIAS_ATENDIMENTO_LISTA,
  STATUS_ALUNO_LISTA
} from '../data/mockData';
import { generateProtocolo, getSaoPauloDateString, getSaoPauloISOString } from '../utils/cpf';

interface TabulacaoFormProps {
  selectedAluno: Aluno | null;
  atendenteNome: string;
  matriculaAtendente: string;
  onSaveTabulacao: (tabulacao: Tabulacao) => void;
  onOpenNovoAlunoModal: () => void;
  onResetForm?: () => void;
}

export const TabulacaoForm: React.FC<TabulacaoFormProps> = ({
  selectedAluno,
  atendenteNome,
  matriculaAtendente,
  onSaveTabulacao,
  onOpenNovoAlunoModal,
  onResetForm,
}) => {
  // Protocol & Timer
  const [protocolo, setProtocolo] = useState<string>(generateProtocolo());
  const [copiedProtocolo, setCopiedProtocolo] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Top Operational Lists (Unidade, Assessoria de Atendimento, Status do Aluno)
  const [unidade, setUnidade] = useState<string>('');
  const [assessoriaAtendimento, setAssessoriaAtendimento] = useState<string>('');
  const [statusAluno, setStatusAluno] = useState<string>('');

  // Sync with selectedAluno when changed
  useEffect(() => {
    setUnidade('');
    setStatusAluno('');
  }, [selectedAluno]);

  // Form Fields
  const [canalAtendimento, setCanalAtendimento] = useState<CanalAtendimento | ''>('');
  const [categoriaMotivo, setCategoriaMotivo] = useState<string>('NEGOCIAÇÃO');
  const [submotivo, setSubmotivo] = useState<string>(CATEGORIAS_MOTIVOS[0].submotivos[0]);
  
  // Negotiation details
  const [tipoNegociacao, setTipoNegociacao] = useState<TipoNegociacao>('PIX');
  
  // Renovação da Negociação: Regra obrigatória: Apenas alunos com status ATIVO podem fazer renovação
  const isAlunoAtivo = statusAluno === 'ATIVO';
  const [comRenovacao, setComRenovacao] = useState<boolean>(false);

  // Sincronizar comRenovacao com o status acadêmico do aluno: se INATIVO, bloqueia e desmarca renovação
  useEffect(() => {
    if (!isAlunoAtivo) {
      setComRenovacao(false);
    }
  }, [isAlunoAtivo]);

  const [quantidadeParcelas, setQuantidadeParcelas] = useState<number>(1);
  const [isOutrasParcelas, setIsOutrasParcelas] = useState<boolean>(false);
  const [outrasParcelasInput, setOutrasParcelasInput] = useState<string>('24');
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState<string>(
    getSaoPauloDateString()
  );
  const [valorEntrada, setValorEntrada] = useState<string>('');
  const [valorParcela, setValorParcela] = useState<string>('');

  const [detalhamento, setDetalhamento] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastSavedProtocol, setLastSavedProtocol] = useState('');

  // Is only 1x allowed for this negotiation type? (CARTÃO, PIX, FGTS, FICOU FACIL = 1x only; BOLETO = parcelado allowed)
  const isApenasUmaParcela = tipoNegociacao !== 'BOLETO';

  // Automatically adjust installments when negotiation type changes
  useEffect(() => {
    if (isApenasUmaParcela) {
      setQuantidadeParcelas(1);
      setIsOutrasParcelas(false);
      setValorParcela('');
    }
  }, [tipoNegociacao, isApenasUmaParcela]);

  // Update submotivos whenever categoriaMotivo changes
  useEffect(() => {
    const found = CATEGORIAS_MOTIVOS.find((c) => c.nome === categoriaMotivo);
    if (found && found.submotivos.length > 0) {
      setSubmotivo(found.submotivos[0]);
    }
  }, [categoriaMotivo]);

  // Live Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Calculated values for negotiation
  const numParcelasEfetivas = isOutrasParcelas 
    ? (parseInt(outrasParcelasInput, 10) || 1) 
    : quantidadeParcelas;

  const entradaNum = parseFloat(valorEntrada.replace(',', '.')) || 0;
  const parcelaNum = parseFloat(valorParcela.replace(',', '.')) || 0;

  const valorTotalCalculado = React.useMemo(() => {
    if (numParcelasEfetivas <= 1) {
      return entradaNum;
    }
    const parcelasRestantes = Math.max(0, numParcelasEfetivas - 1);
    return entradaNum + (parcelasRestantes * parcelaNum);
  }, [numParcelasEfetivas, entradaNum, parcelaNum]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyProtocolo = () => {
    navigator.clipboard.writeText(protocolo);
    setCopiedProtocolo(true);
    setTimeout(() => setCopiedProtocolo(false), 2000);
  };

  const insertFraseRapida = (texto: string) => {
    if (detalhamento.trim()) {
      setDetalhamento((prev) => `${prev}\n${texto}`);
    } else {
      setDetalhamento(texto);
    }
  };

  const handleSelectParcela = (n: number) => {
    setIsOutrasParcelas(false);
    setQuantidadeParcelas(n);
  };

  const handleSelectOutras = () => {
    setIsOutrasParcelas(true);
    const parsed = parseInt(outrasParcelasInput, 10) || 24;
    setQuantidadeParcelas(parsed);
  };

  const handleOutrasParcelasInputChange = (val: string) => {
    setOutrasParcelasInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setQuantidadeParcelas(parsed);
    }
  };

  const handleResetForm = () => {
    setProtocolo(generateProtocolo());
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setUnidade('');
    setAssessoriaAtendimento('');
    setStatusAluno('');
    setCanalAtendimento('');
    setCategoriaMotivo('NEGOCIAÇÃO');
    setSubmotivo(CATEGORIAS_MOTIVOS[0].submotivos[0]);
    setTipoNegociacao('PIX');
    setComRenovacao(false);
    setQuantidadeParcelas(1);
    setIsOutrasParcelas(false);
    setOutrasParcelasInput('24');
    setDataPrimeiraParcela(getSaoPauloDateString());
    setValorEntrada('');
    setValorParcela('');
    setDetalhamento('');
    setErrors({});
    if (onResetForm) {
      onResetForm();
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!selectedAluno) {
      errs.aluno = 'Por favor, selecione ou cadastre um aluno antes de registrar a tabulação.';
    }

    if (!unidade.trim()) {
      errs.unidade = 'Selecione a unidade do atendimento.';
    }

    if (!assessoriaAtendimento.trim()) {
      errs.assessoriaAtendimento = 'Selecione a assessoria de atendimento.';
    }

    if (!statusAluno.trim()) {
      errs.statusAluno = 'Selecione o status do aluno.';
    }

    if (!canalAtendimento) {
      errs.canalAtendimento = 'Selecione o canal de atendimento.';
    }

    if (categoriaMotivo === 'NEGOCIAÇÃO') {
      if (!tipoNegociacao) {
        errs.tipoNegociacao = 'Selecione o tipo de negociação.';
      }
      if (numParcelasEfetivas < 1) {
        errs.quantidadeParcelas = 'Informe uma quantidade válida de parcelas.';
      }
      if (!dataPrimeiraParcela) {
        errs.dataPrimeiraParcela = 'Informe a data da 1ª parcela / entrada.';
      }
      if (entradaNum <= 0) {
        errs.valorEntrada = numParcelasEfetivas === 1 
          ? 'Informe o valor total do pagamento à vista.' 
          : 'Informe o valor da entrada.';
      }
      if (numParcelasEfetivas >= 2 && parcelaNum <= 0) {
        errs.valorParcela = 'Informe o valor de cada parcela restante.';
      }
    }

    if (!detalhamento || detalhamento.trim().length < 10) {
      errs.detalhamento = 'O detalhamento do atendimento deve ter pelo menos 10 caracteres.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tempoMinutos = Math.max(1, Math.ceil(timerSeconds / 60));
    const nowSaoPauloISO = getSaoPauloISOString();

    const novaTabulacao: Tabulacao = {
      id: `tab-${Date.now()}`,
      protocolo,
      unidade,
      assessoriaAtendimento,
      statusAluno,
      alunoCpf: selectedAluno!.cpf,
      alunoNome: selectedAluno!.nome,
      alunoEmail: selectedAluno!.email,
      alunoTelefone: selectedAluno!.telefone,
      alunoRa: selectedAluno!.matricula || selectedAluno!.ra || '',
      alunoCurso: selectedAluno!.curso || '',
      alunoPolo: selectedAluno!.polo || unidade,
      dataHora: nowSaoPauloISO,
      atendenteNome,
      matriculaAtendente,
      canalAtendimento: canalAtendimento as CanalAtendimento,
      categoriaMotivo,
      submotivo,
      tipoNegociacao: categoriaMotivo === 'NEGOCIAÇÃO' ? tipoNegociacao : undefined,
      comRenovacao: categoriaMotivo === 'NEGOCIAÇÃO' ? (isAlunoAtivo ? comRenovacao : false) : undefined,
      quantidadeParcelas: categoriaMotivo === 'NEGOCIAÇÃO' ? numParcelasEfetivas : undefined,
      dataPrimeiraParcela: categoriaMotivo === 'NEGOCIAÇÃO' ? dataPrimeiraParcela : undefined,
      valorEntrada: categoriaMotivo === 'NEGOCIAÇÃO' ? entradaNum : undefined,
      valorParcela: (categoriaMotivo === 'NEGOCIAÇÃO' && numParcelasEfetivas >= 2) ? parcelaNum : undefined,
      valorTotalAcordo: categoriaMotivo === 'NEGOCIAÇÃO' ? valorTotalCalculado : undefined,
      statusAtendimento: 'Resolvido no 1º Contato',
      tempoAtendimentoMinutos: tempoMinutos,
      detalhamento: detalhamento.trim(),
      acoesTomadas: [],
      createdAt: nowSaoPauloISO,
    };

    onSaveTabulacao(novaTabulacao);
    setLastSavedProtocol(protocolo);
    setShowSuccessToast(true);
    handleResetForm();

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 6000);
  };

  const canais: { label: CanalAtendimento; icon: string; description: string }[] = [
    { label: 'WhatsApp', icon: '💬', description: 'Mensagens e chat oficial' },
    { label: 'Presencial', icon: '🏢', description: 'Atendimento no polo / campus' },
    { label: 'Telefone', icon: '📞', description: 'Chamada de voz (ativo/receptivo)' },
  ];

  const tiposNegociacao: { id: TipoNegociacao; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'PIX', label: 'PIX', icon: <QrCode className="w-4 h-4 text-emerald-600" />, desc: 'Pagamento instantâneo via QR Code / Chave' },
    { id: 'CARTÃO DE CRÉDITO', label: 'CARTÃO DE CRÉDITO', icon: <CreditCard className="w-4 h-4 text-indigo-600" />, desc: 'Cartão de crédito à vista ou parcelado' },
    { id: 'BOLETO', label: 'BOLETO', icon: <FileText className="w-4 h-4 text-amber-600" />, desc: 'Boleto bancário registrado' },
    { id: 'FGTS', label: 'FGTS', icon: <Landmark className="w-4 h-4 text-blue-600" />, desc: 'Saldo FGTS / Saque aniversário' },
    { id: 'FICOU FACIL', label: 'FICOU FACIL', icon: <Wallet className="w-4 h-4 text-purple-600" />, desc: 'Condição facilitada especial' },
  ];

  const parcelasOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      
      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Tabulação registrada com sucesso! Protocolo: <strong>{lastSavedProtocol}</strong></span>
          </div>
          <button 
            onClick={() => setShowSuccessToast(false)}
            className="text-emerald-100 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Campos Operacionais em Lista Anteriores ao Protocolo: UNIDADE, ASSESSORIA DE ATENDIMENTO, STATUS DO ALUNO */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700/80">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              Classificação & Triagem da Operação
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800/90 border border-slate-700 px-2.5 py-0.5 rounded-full uppercase">
            Seleção Operacional
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* UNIDADE */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/70">
            <label htmlFor="select-unidade" className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Unidade
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Polo / Campus</span>
            </label>
            <div className="relative">
              <select
                id="select-unidade"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer ${errors.unidade ? 'border-rose-400' : 'border-slate-600'}`}
              >
                <option value="" className="bg-slate-900 text-slate-400">Selecione a unidade</option>
                {UNIDADES_LISTA.map((u) => (
                  <option key={u} value={u} className="bg-slate-900 text-white font-medium py-1">
                    {u}
                  </option>
                ))}
              </select>
              {errors.unidade && <p className="text-[10px] text-rose-300 mt-1.5 font-medium">{errors.unidade}</p>}
            </div>
          </div>

          {/* ASSESSORIA DE ATENDIMENTO */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/70">
            <label htmlFor="select-assessoria-atendimento" className="block text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Assessoria de Atendimento
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Equipe</span>
            </label>
            <div className="relative">
              <select
                id="select-assessoria-atendimento"
                value={assessoriaAtendimento}
                onChange={(e) => setAssessoriaAtendimento(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer ${errors.assessoriaAtendimento ? 'border-rose-400' : 'border-slate-600'}`}
              >
                <option value="" className="bg-slate-900 text-slate-400">Selecione a assessoria</option>
                {ASSESSORIAS_ATENDIMENTO_LISTA.map((a) => (
                  <option key={a} value={a} className="bg-slate-900 text-white font-medium py-1">
                    {a}
                  </option>
                ))}
              </select>
              {errors.assessoriaAtendimento && <p className="text-[10px] text-rose-300 mt-1.5 font-medium">{errors.assessoriaAtendimento}</p>}
            </div>
          </div>

          {/* STATUS DO ALUNO */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/70">
            <label htmlFor="select-status-aluno" className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Status do Aluno
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Situação</span>
            </label>
            <div className="relative">
              <select
                id="select-status-aluno"
                value={statusAluno}
                onChange={(e) => {
                  const novoStatus = e.target.value;
                  setStatusAluno(novoStatus);
                  if (novoStatus !== 'ATIVO') {
                    setComRenovacao(false);
                  }
                }}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer ${errors.statusAluno ? 'border-rose-400' : 'border-slate-600'}`}
              >
                <option value="" className="bg-slate-900 text-slate-400">Selecione o status</option>
                {STATUS_ALUNO_LISTA.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white font-medium py-1">
                    {s}
                  </option>
                ))}
              </select>
              {errors.statusAluno && <p className="text-[10px] text-rose-300 mt-1.5 font-medium">{errors.statusAluno}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Header com Protocolo e Cronômetro */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Protocolo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Protocolo de Atendimento</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                GERADO AUTOMATICAMENTE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-black font-mono text-slate-900 tracking-tight">
                {protocolo}
              </span>
              <button
                type="button"
                id="btn-copiar-protocolo"
                onClick={handleCopyProtocolo}
                title="Copiar Protocolo"
                className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {copiedProtocolo ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              {copiedProtocolo && (
                <span className="text-[11px] font-bold text-emerald-600 animate-in fade-in">Copiado!</span>
              )}
            </div>
          </div>
        </div>

        {/* Cronômetro e Atendente */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Live Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <div className="text-right">
              <span className="text-[10px] block font-bold text-slate-400 leading-none">TEMPO EM LINHA</span>
              <span className="font-mono text-xs font-bold text-slate-800">{formatTimer(timerSeconds)}</span>
            </div>
            <button
              type="button"
              id="btn-toggle-timer"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              title={isTimerRunning ? 'Pausar Cronômetro' : 'Iniciar Cronômetro'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Atendente Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
            <Headphones className="w-4 h-4 text-indigo-600" />
            <div className="text-left">
              <span className="text-[10px] block font-bold text-indigo-500 leading-none">OPERADOR</span>
              <span className="font-bold text-indigo-950 text-xs">{atendenteNome} ({matriculaAtendente})</span>
            </div>
          </div>

        </div>

      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        
        {/* Error Banner if validation fails */}
        {errors.aluno && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errors.aluno}</span>
            </div>
            <button
              type="button"
              onClick={onOpenNovoAlunoModal}
              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors text-[11px]"
            >
              + Cadastrar Aluno
            </button>
          </div>
        )}

        {/* Section 1: Canal de Atendimento */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Canal de Atendimento <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Origem da interação</span>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${errors.canalAtendimento ? 'rounded-xl border border-rose-200 bg-rose-50/40 p-2' : ''}`}>
            {canais.map((c) => {
              const isSelected = canalAtendimento === c.label;
              return (
                <button
                  key={c.label}
                  type="button"
                  id={`canal-${c.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setCanalAtendimento(c.label)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/70 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{c.icon}</span>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {c.label}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                      {c.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.canalAtendimento && <p className="text-rose-500 text-xs font-medium mt-2">{errors.canalAtendimento}</p>}
        </div>

        {/* Section 2: Categoria (Macro-Assunto) & Submotivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Categoria / Assunto Principal <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-categoria-motivo"
              value={categoriaMotivo}
              onChange={(e) => setCategoriaMotivo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              {CATEGORIAS_MOTIVOS.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome} — ({cat.descricao})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Submotivo Específico <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-submotivo"
              value={submotivo}
              onChange={(e) => setSubmotivo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              {CATEGORIAS_MOTIVOS.find((c) => c.nome === categoriaMotivo)?.submotivos.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Conditional Section: Informações de Negociação */}
        {categoriaMotivo === 'NEGOCIAÇÃO' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-slate-50 to-indigo-50/50 border border-emerald-200/90 shadow-xs space-y-4 transition-all">
            
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Detalhes da Negociação & Acordo
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Defina o meio de pagamento, datas, parcelas e simulação dos valores
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {tipoNegociacao} • {numParcelasEfetivas}x {numParcelasEfetivas === 1 ? '(À vista)' : ''}
              </span>
            </div>

            {/* Tipo de Negociação */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Tipo de Negociação <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {tiposNegociacao.map((item) => {
                  const isSelected = tipoNegociacao === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`tipo-negociacao-${item.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => setTipoNegociacao(item.id)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-white border-emerald-500 text-slate-900 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white/80 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="p-1.5 rounded-lg bg-slate-100/90">
                          {item.icon}
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <span className="font-bold text-xs leading-tight">{item.label}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.tipoNegociacao && (
                <p className="text-rose-500 text-xs font-medium mt-1">{errors.tipoNegociacao}</p>
              )}
            </div>

            {/* Pergunta de Renovação (Abaixo de Tipo de Negociação) */}
            <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    A negociação foi com ou sem renovação? <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isAlunoAtivo 
                      ? 'Aluno ATIVO: selecione se o acordo inclui ou não a renovação da matrícula.' 
                      : 'Aluno INATIVO: a opção "Com Renovação" está bloqueada. Apenas alunos ativos podem renovar.'}
                  </p>
                </div>

                {!isAlunoAtivo && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Bloqueado (Apenas Aluno ATIVO)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Opção 1: Com Renovação */}
                <button
                  type="button"
                  id="btn-negociacao-com-renovacao"
                  disabled={!isAlunoAtivo}
                  onClick={() => isAlunoAtivo && setComRenovacao(true)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    !isAlunoAtivo 
                      ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none'
                      : comRenovacao
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      comRenovacao && isAlunoAtivo ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Com Renovação</span>
                      <span className="text-[10px] text-slate-500">
                        {!isAlunoAtivo ? 'Bloqueado (Aluno Inativo)' : 'Inclui rematrícula / renovação de semestre'}
                      </span>
                    </div>
                  </div>
                  {comRenovacao && isAlunoAtivo && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  )}
                </button>

                {/* Opção 2: Sem Renovação */}
                <button
                  type="button"
                  id="btn-negociacao-sem-renovacao"
                  onClick={() => setComRenovacao(false)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    !comRenovacao
                      ? 'bg-slate-900 border-slate-900 text-white ring-2 ring-slate-900/20 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      !comRenovacao ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`font-bold text-xs block ${!comRenovacao ? 'text-white' : 'text-slate-900'}`}>
                        Sem Renovação
                      </span>
                      <span className={`text-[10px] ${!comRenovacao ? 'text-slate-300' : 'text-slate-500'}`}>
                        Apenas quitação / regularização de débitos
                      </span>
                    </div>
                  </div>
                  {!comRenovacao && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  )}
                </button>

              </div>
            </div>

            {/* Quantidade de Parcelas (1x para PIX/CARTÃO/FGTS/FICOU FÁCIL, ou 1 a 12x + Outras para BOLETO) */}
            <div className="pt-2 border-t border-emerald-100/80">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Quantidade de Parcelas <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-slate-600">
                  Condição: <strong className="text-emerald-700 font-bold">{numParcelasEfetivas}x {numParcelasEfetivas === 1 ? '(À vista / Cota única)' : 'Parcelado'}</strong>
                </span>
              </div>

              {isApenasUmaParcela ? (
                /* Only 1x available for PIX, CARTÃO, FGTS, FICOU FÁCIL */
                <div className="p-3 rounded-xl bg-white border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="parcela-1x-fixed"
                      className="py-1.5 px-4 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-xs"
                    >
                      1x (À vista)
                    </button>
                    <span className="text-xs text-slate-700 font-medium">
                      Pagamento em cota única obrigatório para <strong>{tipoNegociacao}</strong>.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    Cota Única
                  </span>
                </div>
              ) : (
                /* Full options for BOLETO (1..12x + Outras) */
                <div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1.5">
                    {parcelasOptions.map((n) => {
                      const isSelected = !isOutrasParcelas && quantidadeParcelas === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          id={`parcela-${n}x`}
                          onClick={() => handleSelectParcela(n)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {n}x
                        </button>
                      );
                    })}
                    
                    {/* Outras opções button */}
                    <button
                      type="button"
                      id="parcela-outras"
                      onClick={handleSelectOutras}
                      className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all flex items-center justify-center gap-1 ${
                        isOutrasParcelas
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-indigo-700'
                      }`}
                      title="Digitar quantidade personalizada de parcelas no boleto (ex: 24x, 36x)"
                    >
                      <Edit3 className="w-3 h-3" />
                      Outras
                    </button>
                  </div>

                  {/* Custom parcel input if "Outras" is active */}
                  {isOutrasParcelas && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-emerald-300 flex items-center gap-3 animate-in fade-in duration-150">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Informe o número personalizado de parcelas (ex: 18, 24, 36, 48):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            id="input-outras-parcelas"
                            value={outrasParcelasInput}
                            onChange={(e) => handleOutrasParcelasInputChange(e.target.value)}
                            placeholder="Ex: 24"
                            className="w-32 px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-700">parcelas</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Selecionado</span>
                        <span className="text-base font-black text-emerald-700">{numParcelasEfetivas}x</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errors.quantidadeParcelas && (
                <p className="text-rose-500 text-xs font-medium mt-1">{errors.quantidadeParcelas}</p>
              )}
            </div>

            {/* Data da 1ª Parcela e Valores Financeiros */}
            <div className="pt-3 border-t border-emerald-100/80 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* Data da 1ª Parcela / Entrada */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Data da 1ª Parcela / Entrada <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      id="input-data-primeira-parcela"
                      value={dataPrimeiraParcela}
                      onChange={(e) => setDataPrimeiraParcela(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 ${
                        errors.dataPrimeiraParcela ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.dataPrimeiraParcela && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.dataPrimeiraParcela}</p>
                  )}
                </div>

                {/* Valor da Entrada (ou Valor à Vista para 1x) */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {numParcelasEfetivas === 1 ? 'Valor à Vista (R$)' : 'Valor da Entrada (R$)'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="input-valor-entrada"
                      value={valorEntrada}
                      onChange={(e) => setValorEntrada(e.target.value)}
                      placeholder="0,00"
                      className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                        errors.valorEntrada ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.valorEntrada && (
                    <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.valorEntrada}</p>
                  )}
                </div>

                {/* Valor de cada Parcela Restante (somente quando >= 2x) */}
                {numParcelasEfetivas >= 2 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Valor das {numParcelasEfetivas - 1}x Demais Parcelas (R$) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="input-valor-parcela"
                        value={valorParcela}
                        onChange={(e) => setValorParcela(e.target.value)}
                        placeholder="0,00"
                        className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 ${
                          errors.valorParcela ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.valorParcela && (
                      <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.valorParcela}</p>
                    )}
                  </div>
                )}

              </div>

              {/* Box de Cálculo Automático do Acordo */}
              <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Resumo Financeiro Calculado
                    </span>
                    <p className="text-xs text-emerald-950 font-medium">
                      {numParcelasEfetivas === 1 ? (
                        <span>Pagamento à vista de <strong>R$ {entradaNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                      ) : (
                        <span>
                          Entrada de <strong>R$ {entradaNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> + <strong>{numParcelasEfetivas - 1}x</strong> de <strong>R$ {parcelaNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/80">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block leading-tight">Valor Total do Acordo</span>
                  <span className="text-base sm:text-lg font-black text-emerald-950 font-mono">
                    R$ {valorTotalCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Section 4: Detalhamento & Quick Phrases */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              4. Detalhamento da Ocorrência & Observações <span className="text-rose-500">*</span>
            </label>
            
            {/* Quick Templates Insert */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Frases Rápidas:
              </span>
              {FRASES_RAPIDAS.map((f, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`btn-frase-rapida-${idx}`}
                  onClick={() => insertFraseRapida(f.texto)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                >
                  +{f.categoria}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="textarea-detalhamento"
            rows={4}
            value={detalhamento}
            onChange={(e) => setDetalhamento(e.target.value)}
            placeholder="Descreva de forma clara e objetiva a solicitação do aluno, termos do acordo, esclarecimentos prestados e desfecho..."
            className={`w-full p-3 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed text-slate-800 ${
              errors.detalhamento ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
            }`}
          />
          {errors.detalhamento && (
            <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.detalhamento}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <button
            type="button"
            id="btn-limpar-formulario"
            onClick={handleResetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar / Novo Formulário
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              id="btn-salvar-tabulacao"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Salvar Tabulação de Atendimento</span>
            </button>
          </div>

        </div>

      </form>

    </div>
  );
};
