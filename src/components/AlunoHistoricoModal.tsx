import React from 'react';
import { 
  X, 
  History, 
  Calendar, 
  UserCheck, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { Aluno, Tabulacao } from '../types';
import { formatDateTimeBR } from '../utils/cpf';

interface AlunoHistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno | null;
  historico: Tabulacao[];
}

export const AlunoHistoricoModal: React.FC<AlunoHistoricoModalProps> = ({
  isOpen,
  onClose,
  aluno,
  historico,
}) => {
  if (!isOpen || !aluno) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Histórico de Atendimentos do Aluno</h3>
              <p className="text-xs text-slate-300">
                {aluno.nome} • CPF: {aluno.cpf} • Matrícula: {aluno.matricula || aluno.ra}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {historico.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhum atendimento anterior</p>
              <p className="text-xs text-slate-500 mt-1">
                Este aluno ainda não possui tabulações registradas no histórico.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-6">
              {historico.map((tab) => (
                <div key={tab.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white" />

                  <div className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 transition-all shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {tab.protocolo}
                        </span>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {tab.canalAtendimento}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDateTimeBR(tab.dataHora)} • {tab.tempoAtendimentoMinutos || 1} min
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <p className="text-xs font-bold text-slate-800">
                          {tab.categoriaMotivo} <span className="text-slate-400 font-normal">›</span> {tab.submotivo}
                        </p>
                        {tab.categoriaMotivo === 'NEGOCIAÇÃO' && tab.tipoNegociacao && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-850 border border-emerald-200">
                            💳 {tab.tipoNegociacao} • {tab.quantidadeParcelas || 1}x {tab.valorTotalAcordo ? `• Total R$ ${tab.valorTotalAcordo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {tab.detalhamento}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-medium">
                        Atendente: <strong>{tab.atendenteNome}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                        {tab.statusAtendimento}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Fechar Histórico
          </button>
        </div>

      </div>
    </div>
  );
};
