import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Calendar, 
  User, 
  Eye, 
  X, 
  Copy, 
  Check,
  Mail,
  Phone,
  MessageCircle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  CalendarRange,
  RotateCcw,
  Headphones
} from 'lucide-react';
import { Aluno, Tabulacao } from '../types';
import { 
  formatDateTimeBR, 
  formatDateBR, 
  cleanDigits,
  normalizeCpf,
  formatCPF,
  extractLocalDateOnly,
  getLocalDateString,
  getSaoPauloDateString
} from '../utils/cpf';
import { Usuario } from '../types';

interface HistoricoTabulacoesProps {
  tabulacoes: Tabulacao[];
  alunos?: Aluno[];
  onSelectAlunoCpf?: (cpf: string) => void;
  currentUser?: Usuario | null;
}

export const HistoricoTabulacoes: React.FC<HistoricoTabulacoesProps> = ({
  tabulacoes,
  alunos = [],
  onSelectAlunoCpf,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [campoDataFiltro, setCampoDataFiltro] = useState<'acordo' | 'vencimento'>('acordo');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [filterTipoNegociacao, setFilterTipoNegociacao] = useState<string>('Todos');
  const [selectedTabulacao, setSelectedTabulacao] = useState<Tabulacao | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter base tabulações based on user role (Operador only sees their own; Supervisor & ADM see all)
  const scopedTabulacoes = useMemo(() => {
    if (currentUser && currentUser.perfil === 'Operador') {
      const userNome = currentUser.nome.toLowerCase().trim();
      const userMatricula = currentUser.matricula?.toLowerCase().trim();
      const userLogin = currentUser.usuario.toLowerCase().trim();

      return tabulacoes.filter((t) => {
        const atendenteNome = (t.atendenteNome || '').toLowerCase().trim();
        const atendenteMatricula = (t.matriculaAtendente || '').toLowerCase().trim();

        const matchMatricula = Boolean(userMatricula && atendenteMatricula && atendenteMatricula === userMatricula);
        const matchNome = Boolean(userNome && atendenteNome && (atendenteNome === userNome || atendenteNome.includes(userNome) || userNome.includes(atendenteNome)));
        const matchLogin = Boolean(userLogin && atendenteNome && atendenteNome.includes(userLogin));

        return matchMatricula || matchNome || matchLogin;
      });
    }
    return tabulacoes;
  }, [tabulacoes, currentUser]);

  // Quick lookup map for aluno details (Email, Telefone, Matrícula) by CPF
  const alunosMap = useMemo(() => {
    const map: Record<string, Aluno> = {};
    alunos.forEach((a) => {
      map[normalizeCpf(a.cpf)] = a;
      map[cleanDigits(a.cpf)] = a;
      map[formatCPF(a.cpf)] = a;
      map[a.cpf] = a;
    });
    return map;
  }, [alunos]);

  // Filter ONLY negotiations from scoped list
  const negociacoes = useMemo(() => {
    return scopedTabulacoes.filter((t) => {
      return t.categoriaMotivo === 'NEGOCIAÇÃO' || Boolean(t.tipoNegociacao);
    });
  }, [scopedTabulacoes]);

  // Filtered List by Search, Date Range, and Tipo de Negociação
  const filteredList = useMemo(() => {
    return negociacoes.filter((t) => {
      // 1. Search term match (Nome, CPF, Matrícula, E-mail, Telefone, Protocolo)
      const alunoObj = alunosMap[cleanDigits(t.alunoCpf)] || alunosMap[t.alunoCpf];
      const email = t.alunoEmail || alunoObj?.email || '';
      const telefone = t.alunoTelefone || alunoObj?.telefone || '';
      const matricula = t.alunoRa || alunoObj?.matricula || alunoObj?.ra || '';

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        t.alunoNome.toLowerCase().includes(term) ||
        t.alunoCpf.includes(term) ||
        matricula.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        telefone.includes(term) ||
        t.protocolo.toLowerCase().includes(term) ||
        (t.tipoNegociacao && t.tipoNegociacao.toLowerCase().includes(term));

      // 2. Tipo de Negociação match
      const matchTipo =
        filterTipoNegociacao === 'Todos' ||
        t.tipoNegociacao === filterTipoNegociacao;

      // 3. Date Range filter (Data do Acordo vs. Data do Vencimento da Entrada)
      let matchDate = true;
      let itemDateStr = '';
      if (campoDataFiltro === 'acordo') {
        itemDateStr = extractLocalDateOnly(t.dataHora || t.createdAt);
      } else {
        // Vencimento da entrada / 1ª parcela
        itemDateStr = extractLocalDateOnly(t.dataPrimeiraParcela) || extractLocalDateOnly(t.dataHora || t.createdAt);
      }

      let minDate = dataInicio;
      let maxDate = dataFim;
      if (dataInicio && dataFim && dataInicio > dataFim) {
        minDate = dataFim;
        maxDate = dataInicio;
      }

      if (minDate && maxDate) {
        matchDate = itemDateStr >= minDate && itemDateStr <= maxDate;
      } else if (minDate) {
        matchDate = itemDateStr >= minDate;
      } else if (maxDate) {
        matchDate = itemDateStr <= maxDate;
      }

      return matchSearch && matchTipo && matchDate;
    });
  }, [negociacoes, searchTerm, filterTipoNegociacao, campoDataFiltro, dataInicio, dataFim, alunosMap]);

  // Statistics calculation for negotiations
  const stats = useMemo(() => {
    const totalNegociacoes = filteredList.length;
    const valorTotalNegociado = filteredList.reduce((acc, t) => {
      const val = t.valorTotalAcordo || t.valorEntrada || 0;
      return acc + Number(val);
    }, 0);
    const ticketMedio = totalNegociacoes > 0 ? valorTotalNegociado / totalNegociacoes : 0;
    const totalEntradas = filteredList.reduce((acc, t) => acc + (t.valorEntrada ? Number(t.valorEntrada) : 0), 0);

    return { totalNegociacoes, valorTotalNegociado, ticketMedio, totalEntradas };
  }, [filteredList]);

  // Helper for quick date presets standardized for São Paulo
  const applyDatePreset = (preset: 'hoje' | '7dias' | '30dias' | 'esteMes' | 'todos') => {
    const todayStr = getSaoPauloDateString();

    if (preset === 'hoje') {
      setDataInicio(todayStr);
      setDataFim(todayStr);
    } else if (preset === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDataInicio(getSaoPauloDateString(d));
      setDataFim(todayStr);
    } else if (preset === '30dias') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setDataInicio(getSaoPauloDateString(d));
      setDataFim(todayStr);
    } else if (preset === 'esteMes') {
      const [yearStr, monthStr] = todayStr.split('-');
      setDataInicio(`${yearStr}-${monthStr}-01`);
      setDataFim(todayStr);
    } else {
      setDataInicio('');
      setDataFim('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Format phone to WhatsApp link clean digits
  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null;
    const digits = cleanDigits(phone);
    if (!digits) return null;
    // Add Brazil country code 55 if not present
    const fullNumber = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${fullNumber}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Operator Filter Notice */}
      {currentUser?.perfil === 'Operador' && (
        <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                Visualização Operacional Filtrada
              </p>
              <p className="text-xs text-indigo-700">
                Exibindo exclusivamente os atendimentos e acordos registrados por <strong>{currentUser.nome}</strong> ({currentUser.matricula || `@${currentUser.usuario}`}).
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-indigo-200 text-indigo-900 px-3 py-1 rounded-full whitespace-nowrap">
            Perfil: Operador
          </span>
        </div>
      )}

      {/* KPI Overview Cards for Negotiations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Negociações</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalNegociacoes}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Acordos registrados
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume Total Negociado</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              R$ {stats.valorTotalNegociado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Soma total dos acordos
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total em Entradas</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              R$ {stats.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Valores de 1ª parcela / à vista
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Médio / Acordo</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Média por negociação
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Filter and Date Bar */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/70 space-y-4">
          
          {/* Top Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nome do Aluno, CPF, Matrícula, E-mail ou WhatsApp..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tipo de Negociação Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-tipo-neg" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Tipo:
              </label>
              <select
                id="filter-tipo-neg"
                value={filterTipoNegociacao}
                onChange={(e) => setFilterTipoNegociacao(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="PIX">PIX</option>
                <option value="BOLETO">BOLETO</option>
                <option value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</option>
                <option value="FGTS">FGTS</option>
                <option value="FICOU FACIL">FICOU FÁCIL</option>
              </select>
            </div>
          </div>

          {/* Date Filter Controls Row */}
          <div className="pt-3 border-t border-slate-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-wrap">
            
            {/* Date Inputs and Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <CalendarRange className="w-4 h-4 text-emerald-600" />
                Filtrar por:
              </span>

              {/* Toggle Acordo vs Vencimento */}
              <div className="inline-flex rounded-xl bg-slate-200/90 p-0.5 border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCampoDataFiltro('acordo')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    campoDataFiltro === 'acordo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Data do Acordo
                </button>
                <button
                  type="button"
                  onClick={() => setCampoDataFiltro('vencimento')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    campoDataFiltro === 'vencimento'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Data do Vencimento
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300">
                <span className="text-[11px] text-slate-400 font-semibold">De:</span>
                <input
                  type="date"
                  id="data-inicio-filtro"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300">
                <span className="text-[11px] text-slate-400 font-semibold">Até:</span>
                <input
                  type="date"
                  id="data-fim-filtro"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              {(dataInicio || dataFim) && (
                <button
                  type="button"
                  onClick={() => {
                    setDataInicio('');
                    setDataFim('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                  title="Limpar filtro de data"
                >
                  <X className="w-3 h-3" /> Limpar Data
                </button>
              )}
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Atalhos:</span>
              <button
                type="button"
                onClick={() => applyDatePreset('hoje')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  dataInicio === getLocalDateString(new Date()) && dataFim === getLocalDateString(new Date())
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('7dias')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Últimos 7 dias
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('esteMes')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('todos')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Todas as Datas
              </button>
            </div>

          </div>

        </div>

        {/* Negotiations Table */}
        <div className="overflow-x-auto">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma negociação encontrada</p>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar o filtro de datas ou os termos da busca.
              </p>
              {(dataInicio || dataFim || searchTerm || filterTipoNegociacao !== 'Todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setDataInicio('');
                    setDataFim('');
                    setFilterTipoNegociacao('Todos');
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nome</th>
                  <th className="py-3.5 px-4">CPF</th>
                  <th className="py-3.5 px-4">Matrícula</th>
                  <th className="py-3.5 px-4">E-mail</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4">Tipo de Negociação</th>
                  <th className="py-3.5 px-4">Vencimento da Entrada</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredList.map((t) => {
                  const alunoObj = alunosMap[cleanDigits(t.alunoCpf)] || alunosMap[t.alunoCpf];
                  const email = t.alunoEmail || alunoObj?.email || 'Não informado';
                  const telefone = t.alunoTelefone || alunoObj?.telefone || 'Não informado';
                  const matricula = t.alunoRa || alunoObj?.matricula || alunoObj?.ra || 'Sem matrícula';
                  const whatsappLink = getWhatsAppLink(telefone !== 'Não informado' ? telefone : undefined);

                  return (
                    <tr key={t.id} className="hover:bg-emerald-50/30 transition-colors">
                      
                      {/* 1. Nome */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]" title={t.alunoNome}>{t.alunoNome}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span 
                            className={`text-[10px] flex items-center gap-1 font-medium transition-colors ${
                              campoDataFiltro === 'acordo' 
                                ? 'text-emerald-800 bg-emerald-100 font-bold px-1.5 py-0.5 rounded-md' 
                                : 'text-slate-400'
                            }`}
                            title="Data do Registro do Acordo"
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTimeBR(t.dataHora)}
                          </span>
                        </div>
                      </td>

                      {/* 2. CPF */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-800">{t.alunoCpf}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(t.alunoCpf)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Copiar CPF"
                          >
                            {copiedText === t.alunoCpf ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 3. Matrícula */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-[11px] border border-slate-200">
                          {matricula}
                        </span>
                      </td>

                      {/* 4. E-mail */}
                      <td className="py-3.5 px-4">
                        {email !== 'Não informado' ? (
                          <a
                            href={`mailto:${email}`}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 truncate max-w-[160px] text-[11px]"
                            title={email}
                          >
                            <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">{email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Não informado</span>
                        )}
                      </td>

                      {/* 5. WhatsApp */}
                      <td className="py-3.5 px-4">
                        {telefone !== 'Não informado' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 font-medium text-[11px] whitespace-nowrap">{telefone}</span>
                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-700" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Não informado</span>
                        )}
                      </td>

                      {/* 6. Tipo de Negociação */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                            {t.tipoNegociacao || 'PIX'}
                            {t.quantidadeParcelas && t.quantidadeParcelas > 1 ? (
                              <span className="text-emerald-700 font-extrabold">({t.quantidadeParcelas}x)</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-[10px]">(À vista)</span>
                            )}
                          </span>

                          {/* Tag de Renovação */}
                          {t.comRenovacao !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              t.comRenovacao 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {t.comRenovacao ? '✓ Com Renovação' : '✕ Sem Renovação'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Vencimento da Entrada */}
                      <td className="py-3.5 px-4">
                        <div className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap rounded-lg px-2 py-1 transition-colors ${
                          campoDataFiltro === 'vencimento'
                            ? 'bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-300'
                            : 'text-slate-800'
                        }`}>
                          <Calendar className={`w-3.5 h-3.5 ${campoDataFiltro === 'vencimento' ? 'text-emerald-700' : 'text-slate-400'} shrink-0`} />
                          {t.dataPrimeiraParcela ? (
                            <span>{formatDateBR(t.dataPrimeiraParcela)}</span>
                          ) : (
                            <span className="text-slate-500 font-normal">À vista / Imediato</span>
                          )}
                        </div>
                      </td>

                      {/* 8. Valor */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          R$ {(t.valorTotalAcordo || t.valorEntrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {t.valorEntrada && t.valorTotalAcordo && t.valorEntrada !== t.valorTotalAcordo && (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Entrada: R$ {t.valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      {/* Action Detalhes */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTabulacao(t)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition-colors border border-slate-200 hover:border-emerald-300"
                          title="Visualizar detalhes completos do acordo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Exibindo <strong>{filteredList.length}</strong> negociações
            {dataInicio || dataFim ? (
              <span>
                {' '}filtradas por <strong>{campoDataFiltro === 'acordo' ? 'Data do Acordo' : 'Data do Vencimento'}</strong>
                {dataInicio && dataFim ? ` entre ${formatDateBR(dataInicio)} e ${formatDateBR(dataFim)}` : dataInicio ? ` a partir de ${formatDateBR(dataInicio)}` : ` até ${formatDateBR(dataFim)}`}
              </span>
            ) : ''}
          </span>
          <span className="text-[11px] text-slate-400">
            Relatório de acordos financeiros sincronizado em tempo real.
          </span>
        </div>

      </div>

      {/* Negotiation Detail Modal */}
      {selectedTabulacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-emerald-400">Detalhamento da Negociação</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedTabulacao.tipoNegociacao || 'Acordo'}
                  </span>
                </div>
                <h3 className="text-lg font-black font-mono mt-0.5">{selectedTabulacao.protocolo}</h3>
              </div>
              <button
                onClick={() => setSelectedTabulacao(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Aluno Header in modal */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">{selectedTabulacao.alunoNome}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap font-medium">
                    <span>CPF: <strong>{selectedTabulacao.alunoCpf}</strong></span>
                    {selectedTabulacao.alunoRa && <span>Matrícula: <strong>{selectedTabulacao.alunoRa}</strong></span>}
                    {(selectedTabulacao.alunoEmail || alunosMap[cleanDigits(selectedTabulacao.alunoCpf)]?.email) && (
                      <span>E-mail: <strong>{selectedTabulacao.alunoEmail || alunosMap[cleanDigits(selectedTabulacao.alunoCpf)]?.email}</strong></span>
                    )}
                    {(selectedTabulacao.alunoTelefone || alunosMap[cleanDigits(selectedTabulacao.alunoCpf)]?.telefone) && (
                      <span>WhatsApp: <strong>{selectedTabulacao.alunoTelefone || alunosMap[cleanDigits(selectedTabulacao.alunoCpf)]?.telefone}</strong></span>
                    )}
                  </div>
                </div>
                {onSelectAlunoCpf && (
                  <button
                    onClick={() => {
                      onSelectAlunoCpf(selectedTabulacao.alunoCpf);
                      setSelectedTabulacao(null);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    Abrir Aluno <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Negotiation Breakdown Card */}
              <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950">
                <div className="flex items-center justify-between font-bold text-emerald-900 mb-2">
                  <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    💳 Condições e Valores do Acordo
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                    {selectedTabulacao.quantidadeParcelas || 1}x {selectedTabulacao.quantidadeParcelas === 1 ? '(À Vista / Cota única)' : 'Parcelado'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-2.5 border-t border-emerald-200/80">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Tipo Negociação</span>
                    <span className="font-bold text-xs text-emerald-950">{selectedTabulacao.tipoNegociacao || 'PIX'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Renovação</span>
                    <span className="font-bold text-xs text-emerald-950">
                      {selectedTabulacao.comRenovacao !== undefined ? (
                        selectedTabulacao.comRenovacao ? (
                          <span className="text-emerald-700 font-extrabold">Com Renovação</span>
                        ) : (
                          <span className="text-slate-600">Sem Renovação</span>
                        )
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Parcelas</span>
                    <span className="font-bold text-xs text-emerald-950">{selectedTabulacao.quantidadeParcelas || 1}x</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Vencimento Entrada</span>
                    <span className="font-bold text-xs text-emerald-950">
                      {selectedTabulacao.dataPrimeiraParcela ? formatDateBR(selectedTabulacao.dataPrimeiraParcela) : 'Imediato'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Valor da Entrada</span>
                    <span className="font-bold text-xs text-emerald-950">
                      {selectedTabulacao.valorEntrada ? `R$ ${selectedTabulacao.valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Total Value Bar */}
                <div className="mt-3 pt-2.5 border-t border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-emerald-800">
                    {selectedTabulacao.quantidadeParcelas && selectedTabulacao.quantidadeParcelas > 1 && selectedTabulacao.valorParcela ? (
                      <span>Demais parcelas: <strong>{selectedTabulacao.quantidadeParcelas - 1}x de R$ {selectedTabulacao.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                    ) : (
                      <span>Pagamento integral em cota única</span>
                    )}
                  </span>
                  <span className="text-sm font-black text-emerald-950 bg-emerald-200/60 px-3 py-1 rounded-lg">
                    Valor Total: R$ {(selectedTabulacao.valorTotalAcordo || selectedTabulacao.valorEntrada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Operational Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Data / Horário</span>
                  <span className="font-bold text-slate-800">{formatDateTimeBR(selectedTabulacao.dataHora)}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Canal</span>
                  <span className="font-bold text-slate-800">{selectedTabulacao.canalAtendimento}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Atendente</span>
                  <span className="font-bold text-slate-800">{selectedTabulacao.atendenteNome} ({selectedTabulacao.matriculaAtendente})</span>
                </div>

                {selectedTabulacao.unidade && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Unidade</span>
                    <span className="font-bold text-slate-800">{selectedTabulacao.unidade}</span>
                  </div>
                )}

                {selectedTabulacao.assessoriaAtendimento && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Assessoria</span>
                    <span className="font-bold text-slate-800">{selectedTabulacao.assessoriaAtendimento}</span>
                  </div>
                )}

                {selectedTabulacao.statusAluno && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">Status do Aluno</span>
                    <span className="font-bold text-slate-800">{selectedTabulacao.statusAluno}</span>
                  </div>
                )}

              </div>

              {/* Detalhamento */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Detalhamento da Ocorrência
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                  {selectedTabulacao.detalhamento}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => copyToClipboard(selectedTabulacao.protocolo)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Protocolo ({selectedTabulacao.protocolo})
              </button>
              <button
                onClick={() => setSelectedTabulacao(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
