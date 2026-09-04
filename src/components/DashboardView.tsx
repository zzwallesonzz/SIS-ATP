import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarRange,
  Building2,
  Filter,
  Percent,
  TrendingUp,
  Users,
  Wallet,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { Tabulacao, Usuario } from '../types';

interface DashboardViewProps {
  tabulacoes: Tabulacao[];
  usuarios: Usuario[];
}

type UnidadeSortField = 'unidade' | 'quantidadeAtendimentos' | 'quantidadeNegociacao' | 'quantidadeRecusas' | 'valorPrimeiraParcela';
type OperadorSortField = 'operador' | 'supervisor' | 'quantidadeAtendimentos' | 'quantidadeNegociacao' | 'quantidadeRecusas' | 'valorPrimeiraParcela';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);

const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        const str = val === null || val === undefined ? '' : String(val);
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(';');
  };

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(processRow)].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const DashboardView: React.FC<DashboardViewProps> = ({ tabulacoes, usuarios }) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [supervisor, setSupervisor] = useState('Todos');
  const [renovacao, setRenovacao] = useState<'todos' | 'com' | 'sem'>('todos');
  const [atendente, setAtendente] = useState('Todos');
  const [unidade, setUnidade] = useState('Todos');
  const [tipoAtendimento, setTipoAtendimento] = useState('Todos');

  // Sorting state for "Resumo por unidade"
  const [sortUnidadeField, setSortUnidadeField] = useState<UnidadeSortField>('quantidadeAtendimentos');
  const [sortUnidadeDirection, setSortUnidadeDirection] = useState<SortDirection>('desc');

  // Sorting state for "Resumo por operador"
  const [sortOperadorField, setSortOperadorField] = useState<OperadorSortField>('quantidadeAtendimentos');
  const [sortOperadorDirection, setSortOperadorDirection] = useState<SortDirection>('desc');

  // View mode for Recusas: 'barras' (igual a Volume por unidade) or 'tabela'
  const [viewModeRecusas, setViewModeRecusas] = useState<'barras' | 'tabela'>('barras');

  const handleSortUnidade = (field: UnidadeSortField) => {
    if (sortUnidadeField === field) {
      setSortUnidadeDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortUnidadeField(field);
      setSortUnidadeDirection(field === 'unidade' ? 'asc' : 'desc');
    }
  };

  const handleSortOperador = (field: OperadorSortField) => {
    if (sortOperadorField === field) {
      setSortOperadorDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortOperadorField(field);
      setSortOperadorDirection(field === 'operador' || field === 'supervisor' ? 'asc' : 'desc');
    }
  };

  const supervisorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          usuarios
            .filter((u) => u.perfil === 'Supervisor' && u.ativo !== false)
            .map((u) => u.nome)
        )
      ).sort(),
    [usuarios]
  );

  const atendenteOptions = useMemo(
    () => Array.from(new Set(tabulacoes.map((t) => t.atendenteNome))).sort(),
    [tabulacoes]
  );

  const unidadeOptions = useMemo(
    () => Array.from(new Set(tabulacoes.map((t) => t.unidade || 'Sem unidade'))).sort(),
    [tabulacoes]
  );

  const tipoAtendimentoOptions = useMemo(
    () => Array.from(new Set(tabulacoes.map((t) => t.canalAtendimento))).sort(),
    [tabulacoes]
  );

  const filteredTabulacoes = useMemo(() => {
    return tabulacoes.filter((tab) => {
      const tabDate = new Date(tab.dataHora).getTime();

      if (dataInicio) {
        const start = new Date(`${dataInicio}T00:00:00`).getTime();
        if (tabDate < start) return false;
      }

      if (dataFim) {
        const end = new Date(`${dataFim}T23:59:59`).getTime();
        if (tabDate > end) return false;
      }

      if (supervisor !== 'Todos') {
        const operador = usuarios.find(
          (u) => u.matricula === tab.matriculaAtendente || u.nome === tab.atendenteNome
        );

        const supervisorAtual = operador?.supervisor ||
          (operador?.perfil === 'Supervisor' ? operador.nome : '');

        if (!supervisorAtual || supervisorAtual !== supervisor) {
          return false;
        }
      }

      if (renovacao !== 'todos') {
        const matches = renovacao === 'com' ? !!tab.comRenovacao : !tab.comRenovacao;
        if (!matches) return false;
      }

      if (atendente !== 'Todos' && tab.atendenteNome !== atendente) {
        return false;
      }

      if (unidade !== 'Todos' && (tab.unidade || 'Sem unidade') !== unidade) {
        return false;
      }

      if (tipoAtendimento !== 'Todos' && tab.canalAtendimento !== tipoAtendimento) {
        return false;
      }

      return true;
    });
  }, [tabulacoes, usuarios, dataInicio, dataFim, supervisor, renovacao, atendente, unidade, tipoAtendimento]);

  const resumo = useMemo(() => {
    const totalAtendimentos = filteredTabulacoes.length;
    const totalNegociacao = filteredTabulacoes.filter((t) => t.categoriaMotivo === 'NEGOCIAÇÃO').length;
    const totalRecusas = filteredTabulacoes.filter((t) => t.categoriaMotivo === 'RECUSA').length;
    const valorPrimeiraParcela = filteredTabulacoes.reduce((acc, t) => {
      const valor = Number(t.valorEntrada ?? t.valorParcela ?? 0);
      return acc + valor;
    }, 0);

    return {
      totalAtendimentos,
      totalNegociacao,
      totalRecusas,
      valorPrimeiraParcela,
    };
  }, [filteredTabulacoes]);

  const tabelaPorUnidade = useMemo(() => {
    const map = new Map<string, {
      unidade: string;
      quantidadeAtendimentos: number;
      quantidadeNegociacao: number;
      quantidadeRecusas: number;
      valorPrimeiraParcela: number;
    }>();

    filteredTabulacoes.forEach((tab) => {
      const key = tab.unidade || 'Sem unidade';
      const entry = map.get(key) || {
        unidade: key,
        quantidadeAtendimentos: 0,
        quantidadeNegociacao: 0,
        quantidadeRecusas: 0,
        valorPrimeiraParcela: 0,
      };

      entry.quantidadeAtendimentos += 1;
      if (tab.categoriaMotivo === 'NEGOCIAÇÃO') entry.quantidadeNegociacao += 1;
      if (tab.categoriaMotivo === 'RECUSA') entry.quantidadeRecusas += 1;
      entry.valorPrimeiraParcela += Number(tab.valorEntrada ?? tab.valorParcela ?? 0);

      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.quantidadeAtendimentos - a.quantidadeAtendimentos);
  }, [filteredTabulacoes]);

  const tabelaPorOperador = useMemo(() => {
    const map = new Map<string, {
      operador: string;
      supervisor: string;
      quantidadeAtendimentos: number;
      quantidadeNegociacao: number;
      quantidadeRecusas: number;
      valorPrimeiraParcela: number;
    }>();

    filteredTabulacoes.forEach((tab) => {
      const key = tab.atendenteNome || 'Não informado';
      const operador = usuarios.find(
        (u) => u.matricula === tab.matriculaAtendente || u.nome === tab.atendenteNome
      );
      const supervisorAtual = operador?.supervisor || (operador?.perfil === 'Supervisor' ? operador.nome : 'Sem supervisor');

      const entry = map.get(key) || {
        operador: key,
        supervisor: supervisorAtual,
        quantidadeAtendimentos: 0,
        quantidadeNegociacao: 0,
        quantidadeRecusas: 0,
        valorPrimeiraParcela: 0,
      };

      entry.quantidadeAtendimentos += 1;
      if (tab.categoriaMotivo === 'NEGOCIAÇÃO') entry.quantidadeNegociacao += 1;
      if (tab.categoriaMotivo === 'RECUSA') entry.quantidadeRecusas += 1;
      entry.valorPrimeiraParcela += Number(tab.valorEntrada ?? tab.valorParcela ?? 0);
      entry.supervisor = supervisorAtual || entry.supervisor;

      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.quantidadeAtendimentos - a.quantidadeAtendimentos);
  }, [filteredTabulacoes, usuarios]);

  // Sorted arrays based on user selection
  const sortedTabelaPorUnidade = useMemo(() => {
    return [...tabelaPorUnidade].sort((a, b) => {
      let result = 0;
      if (sortUnidadeField === 'unidade') {
        result = a.unidade.localeCompare(b.unidade, 'pt-BR');
      } else {
        result = a[sortUnidadeField] - b[sortUnidadeField];
      }
      return sortUnidadeDirection === 'asc' ? result : -result;
    });
  }, [tabelaPorUnidade, sortUnidadeField, sortUnidadeDirection]);

  const sortedTabelaPorOperador = useMemo(() => {
    return [...tabelaPorOperador].sort((a, b) => {
      let result = 0;
      if (sortOperadorField === 'operador') {
        result = a.operador.localeCompare(b.operador, 'pt-BR');
      } else if (sortOperadorField === 'supervisor') {
        result = a.supervisor.localeCompare(b.supervisor, 'pt-BR');
      } else {
        result = a[sortOperadorField] - b[sortOperadorField];
      }
      return sortOperadorDirection === 'asc' ? result : -result;
    });
  }, [tabelaPorOperador, sortOperadorField, sortOperadorDirection]);

  const canalStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredTabulacoes.forEach((tab) => {
      const key = tab.canalAtendimento || 'Não informado';
      map.set(key, (map.get(key) || 0) + 1);
    });

    const max = Math.max(...Array.from(map.values()), 1);
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, width: `${(value / max) * 100}%` }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTabulacoes]);

  const renovacaoStats = useMemo(() => {
    const com = filteredTabulacoes.filter((t) => t.comRenovacao).length;
    const sem = filteredTabulacoes.filter((t) => !t.comRenovacao).length;
    const total = Math.max(filteredTabulacoes.length, 1);

    return {
      com,
      sem,
      comPct: (com / total) * 100,
      semPct: (sem / total) * 100,
    };
  }, [filteredTabulacoes]);

  const topUnidades = useMemo(() => {
    const max = Math.max(...tabelaPorUnidade.map((item) => item.quantidadeAtendimentos), 1);
    return tabelaPorUnidade.slice(0, 6).map((item) => ({
      ...item,
      width: `${(item.quantidadeAtendimentos / max) * 100}%`,
    }));
  }, [tabelaPorUnidade]);

  // Recusas por "3. Submotivo Específico"
  // Regra estrita: O que for tabulado como Negociação ou Informação não deve ser contabilizado e mostrado
  const recusasSubmotivos = useMemo(() => {
    const recusasOnly = filteredTabulacoes.filter((tab) => {
      const cat = (tab.categoriaMotivo || '').trim().toUpperCase();
      if (cat.includes('NEGOCIA') || cat.includes('INFORMA')) return false;
      return cat === 'RECUSA';
    });

    const total = recusasOnly.length;
    const countMap = new Map<string, number>();

    recusasOnly.forEach((tab) => {
      const sub = (tab.submotivo || '').trim() || 'Não especificado';
      countMap.set(sub, (countMap.get(sub) || 0) + 1);
    });

    const list = Array.from(countMap.entries())
      .map(([submotivo, quantidadeRecusas]) => ({
        submotivo,
        quantidadeRecusas,
        percentual: total > 0 ? (quantidadeRecusas / total) * 100 : 0,
      }))
      .sort((a, b) => b.quantidadeRecusas - a.quantidadeRecusas);

    const max = list.length > 0 ? Math.max(...list.map((item) => item.quantidadeRecusas), 1) : 1;

    return {
      totalRecusas: total,
      itens: list.map((item) => ({
        ...item,
        width: `${(item.quantidadeRecusas / max) * 100}%`,
      })),
    };
  }, [filteredTabulacoes]);

  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setSupervisor('Todos');
    setRenovacao('todos');
    setAtendente('Todos');
    setUnidade('Todos');
    setTipoAtendimento('Todos');
  };

  const exportarResumoUnidade = () => {
    if (sortedTabelaPorUnidade.length === 0) return;
    const headers = [
      'Unidade',
      'Atendimentos',
      'Negociação',
      'Recusas',
      'Valor 1ª parcela (R$)',
    ];
    const rows = sortedTabelaPorUnidade.map((linha) => [
      linha.unidade,
      linha.quantidadeAtendimentos,
      linha.quantidadeNegociacao,
      linha.quantidadeRecusas,
      linha.valorPrimeiraParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(`resumo_por_unidade_${dateStr}.csv`, headers, rows);
  };

  const exportarResumoOperador = () => {
    if (sortedTabelaPorOperador.length === 0) return;
    const headers = [
      'Operador',
      'Supervisor',
      'Atendimentos',
      'Negociação',
      'Recusas',
      'Valor 1ª parcela (R$)',
    ];
    const rows = sortedTabelaPorOperador.map((linha) => [
      linha.operador,
      linha.supervisor,
      linha.quantidadeAtendimentos,
      linha.quantidadeNegociacao,
      linha.quantidadeRecusas,
      linha.valorPrimeiraParcela.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(`resumo_por_operador_${dateStr}.csv`, headers, rows);
  };

  const exportarRecusasSubmotivo = () => {
    if (recusasSubmotivos.itens.length === 0) return;
    const headers = [
      '3. Submotivo Específico',
      'Quantidade de Recusas',
      '% do Total de Recusas',
    ];
    const rows = recusasSubmotivos.itens.map((linha) => [
      linha.submotivo,
      linha.quantidadeRecusas,
      `${linha.percentual.toFixed(1)}%`,
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(`recusas_por_submotivo_${dateStr}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300">Dashboard</p>
              <h2 className="text-2xl font-black tracking-tight">Painel Operacional</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700">
            <CalendarRange className="w-4 h-4 text-emerald-400" />
            <span>{filteredTabulacoes.length} atendimentos filtrados</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.14em]">Filtros</h3>
          </div>

          <button
            type="button"
            onClick={limparFiltros}
            className="text-xs font-bold text-slate-600 hover:text-indigo-700 transition-colors"
          >
            Limpar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Data inicial
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Data final
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Supervisor
            <select
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Todos">Todos</option>
              {supervisorOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Renovação
            <select
              value={renovacao}
              onChange={(e) => setRenovacao(e.target.value as 'todos' | 'com' | 'sem')}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="todos">Todos</option>
              <option value="com">Com renovação</option>
              <option value="sem">Sem renovação</option>
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Atendente
            <select
              value={atendente}
              onChange={(e) => setAtendente(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Todos">Todos</option>
              {atendenteOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Unidade
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Todos">Todos</option>
              {unidadeOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider md:col-span-2 xl:col-span-1">
            Tipo de atendimento
            <select
              value={tipoAtendimento}
              onChange={(e) => setTipoAtendimento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Todos">Todos</option>
              {tipoAtendimentoOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Atendimentos</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{resumo.totalAtendimentos}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Negociação</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{resumo.totalNegociacao}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Recusas</span>
            <Percent className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{resumo.totalRecusas}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">1ª parcela</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-xl font-black text-slate-900">{formatCurrency(resumo.valorPrimeiraParcela)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">Volume por unidade</h3>
          </div>

          <div className="space-y-3">
            {topUnidades.length > 0 ? (
              topUnidades.map((item) => (
                <div key={item.unidade}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span className="truncate pr-2 max-w-[180px]">{item.unidade}</span>
                    <span>{item.quantidadeAtendimentos}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-6 text-center">Sem dados para chart.</div>
            )}
          </div>
        </div>

        {/* Nova Tabela de Recusas igual a 'Volume por unidade' com '3. Submotivo Específico' */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">
                    Volume de Recusas por Submotivo
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">3. Submotivo Específico</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {recusasSubmotivos.totalRecusas} recusa{recusasSubmotivos.totalRecusas === 1 ? '' : 's'}
                </span>

                {/* Alternador de visualização Barras / Tabela */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewModeRecusas('barras')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      viewModeRecusas === 'barras'
                        ? 'bg-white text-rose-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Visualizar em barras (igual a Volume por unidade)"
                  >
                    Barras
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewModeRecusas('tabela')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      viewModeRecusas === 'tabela'
                        ? 'bg-white text-rose-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="Visualizar em tabela detalhada"
                  >
                    Tabela
                  </button>
                </div>

                <button
                  type="button"
                  onClick={exportarRecusasSubmotivo}
                  disabled={recusasSubmotivos.itens.length === 0}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Exportar Recusas para CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {recusasSubmotivos.itens.length > 0 ? (
              viewModeRecusas === 'barras' ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {recusasSubmotivos.itens.map((item) => (
                    <div key={item.submotivo}>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span className="truncate pr-2 max-w-[220px] sm:max-w-[280px]" title={item.submotivo}>
                          {item.submotivo}
                        </span>
                        <span className="shrink-0 font-bold text-slate-800">
                          {item.quantidadeRecusas} <span className="text-slate-400 font-normal">({item.percentual.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500"
                          style={{ width: item.width }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-slate-100 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          3. Submotivo Específico
                        </th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                          Recusas
                        </th>
                        <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {recusasSubmotivos.itens.map((item) => (
                        <tr key={item.submotivo} className="hover:bg-rose-50/40 transition-colors">
                          <td className="px-3 py-2 text-xs font-semibold text-slate-800 break-words">
                            {item.submotivo}
                          </td>
                          <td className="px-3 py-2 text-xs font-bold text-rose-700 text-right whitespace-nowrap">
                            {item.quantidadeRecusas}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500 text-right whitespace-nowrap">
                            {item.percentual.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="text-sm text-slate-500 py-8 text-center flex flex-col items-center justify-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-slate-300" />
                <span>Nenhuma recusa encontrada para os filtros selecionados.</span>
                <span className="text-xs text-slate-400">Atendimentos de Negociação ou Informação não são contabilizados.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">Canal de atendimento</h3>
          </div>

          <div className="space-y-3">
            {canalStats.length > 0 ? (
              canalStats.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 py-6 text-center">Sem dados para chart.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
            <Percent className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">Relação de renovação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Com renovação</span>
                <span>{renovacaoStats.com}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
                  style={{ width: `${renovacaoStats.comPct}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-600 mt-4 mb-2">
                <span>Sem renovação</span>
                <span>{renovacaoStats.sem}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${renovacaoStats.semPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">Com renovação</div>
                <div className="text-2xl font-black text-emerald-900 mt-2">{renovacaoStats.com}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">Sem renovação</div>
                <div className="text-2xl font-black text-amber-900 mt-2">{renovacaoStats.sem}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">Resumo por unidade</h3>
          </div>

          <button
            type="button"
            onClick={exportarResumoUnidade}
            disabled={sortedTabelaPorUnidade.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Exportar dados de unidades para planilha CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Planilha</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  onClick={() => handleSortUnidade('unidade')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Unidade (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Unidade</span>
                    {sortUnidadeField === 'unidade' ? (
                      sortUnidadeDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortUnidade('quantidadeAtendimentos')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Atendimentos (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Atendimentos</span>
                    {sortUnidadeField === 'quantidadeAtendimentos' ? (
                      sortUnidadeDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortUnidade('quantidadeNegociacao')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Negociação (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Negociação</span>
                    {sortUnidadeField === 'quantidadeNegociacao' ? (
                      sortUnidadeDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortUnidade('quantidadeRecusas')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Recusas (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Recusas</span>
                    {sortUnidadeField === 'quantidadeRecusas' ? (
                      sortUnidadeDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortUnidade('valorPrimeiraParcela')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Valor 1ª Parcela (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Valor 1ª parcela</span>
                    {sortUnidadeField === 'valorPrimeiraParcela' ? (
                      sortUnidadeDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedTabelaPorUnidade.length > 0 ? (
                sortedTabelaPorUnidade.map((linha) => (
                  <tr key={linha.unidade} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{linha.unidade}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.quantidadeAtendimentos}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.quantidadeNegociacao}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.quantidadeRecusas}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-700">{formatCurrency(linha.valorPrimeiraParcela)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum atendimento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">Resumo por operador</h3>
          </div>

          <button
            type="button"
            onClick={exportarResumoOperador}
            disabled={sortedTabelaPorOperador.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Exportar dados de operadores para planilha CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Planilha</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  onClick={() => handleSortOperador('operador')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Operador (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Operador</span>
                    {sortOperadorField === 'operador' ? (
                      sortOperadorDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortOperador('supervisor')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Supervisor (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supervisor</span>
                    {sortOperadorField === 'supervisor' ? (
                      sortOperadorDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortOperador('quantidadeAtendimentos')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Atendimentos (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Atendimentos</span>
                    {sortOperadorField === 'quantidadeAtendimentos' ? (
                      sortOperadorDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortOperador('quantidadeNegociacao')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Negociação (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Negociação</span>
                    {sortOperadorField === 'quantidadeNegociacao' ? (
                      sortOperadorDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortOperador('quantidadeRecusas')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Recusas (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Recusas</span>
                    {sortOperadorField === 'quantidadeRecusas' ? (
                      sortOperadorDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortOperador('valorPrimeiraParcela')}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group"
                  title="Ordenar por Valor 1ª Parcela (Maior/Menor)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Valor 1ª parcela</span>
                    {sortOperadorField === 'valorPrimeiraParcela' ? (
                      sortOperadorDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedTabelaPorOperador.length > 0 ? (
                sortedTabelaPorOperador.map((linha) => (
                  <tr key={linha.operador} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{linha.operador}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.supervisor}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.quantidadeAtendimentos}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.quantidadeNegociacao}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{linha.quantidadeRecusas}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-700">{formatCurrency(linha.valorPrimeiraParcela)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum atendimento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
