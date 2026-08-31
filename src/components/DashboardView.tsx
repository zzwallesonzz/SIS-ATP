import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarRange, Building2, Filter, Percent, TrendingUp, Users, Wallet } from 'lucide-react';
import { Tabulacao, Usuario } from '../types';

interface DashboardViewProps {
  tabulacoes: Tabulacao[];
  usuarios: Usuario[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);

export const DashboardView: React.FC<DashboardViewProps> = ({ tabulacoes, usuarios }) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [supervisor, setSupervisor] = useState('Todos');
  const [renovacao, setRenovacao] = useState<'todos' | 'com' | 'sem'>('todos');
  const [atendente, setAtendente] = useState('Todos');
  const [unidade, setUnidade] = useState('Todos');
  const [tipoAtendimento, setTipoAtendimento] = useState('Todos');

  const supervisorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          usuarios
            .filter((u) => (u.perfil === 'Supervisor' || u.perfil === 'ADM') && u.ativo !== false)
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
        const supervisorAtual = operador?.supervisor || (operador?.perfil === 'Supervisor' ? operador.nome : '');

        if (supervisorAtual !== supervisor) {
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

  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setSupervisor('Todos');
    setRenovacao('todos');
    setAtendente('Todos');
    setUnidade('Todos');
    setTipoAtendimento('Todos');
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-800">Resumo por unidade</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">Unidade</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">Atendimentos</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">Negociação</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">Recusas</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">Valor 1ª parcela</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {tabelaPorUnidade.length > 0 ? (
                tabelaPorUnidade.map((linha) => (
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
    </div>
  );
};
