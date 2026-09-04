import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  GraduationCap,
  Hash,
  Building2,
  Check,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Aluno } from '../types';
import { formatCPF, cleanDigits, isValidCPF, formatCompleteCPF } from '../utils/cpf';

interface CpfSearchProps {
  currentCpf: string;
  onCpfChange: (cpf: string) => void;
  onSearch: (cpf: string) => void;
  selectedAluno: Aluno | null;
  matchingAlunos?: Aluno[];
  onSelectAluno?: (aluno: Aluno) => void;
  searchAttempted: boolean;
  onOpenNovoAlunoModal: (cpfPreFill?: string, isNewMatriculaForExistingCpf?: boolean) => void;
  onClear?: () => void;
}

export const CpfSearch: React.FC<CpfSearchProps> = ({
  currentCpf,
  onCpfChange,
  onSearch,
  selectedAluno,
  matchingAlunos = [],
  onSelectAluno,
  searchAttempted,
  onOpenNovoAlunoModal,
  onClear,
}) => {
  const [inputVal, setInputVal] = useState(currentCpf);

  // Keep input in sync if currentCpf changes externally (e.g., from reset)
  React.useEffect(() => {
    setInputVal(currentCpf);
  }, [currentCpf]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const formatted = formatCPF(rawInput);
    setInputVal(formatted);
    onCpfChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const digits = cleanDigits(inputVal);
      if (digits.length >= 10) {
        const fullCpf = formatCompleteCPF(inputVal);
        onSearch(fullCpf);
      }
    }
  };

  const handleSearchClick = () => {
    const digits = cleanDigits(inputVal);
    if (digits.length >= 10) {
      const fullCpf = formatCompleteCPF(inputVal);
      onSearch(fullCpf);
    }
  };

  const handleClear = () => {
    setInputVal('');
    onCpfChange('');
    if (onClear) {
      onClear();
    }
  };

  const digits = cleanDigits(inputVal);
  const isComplete = digits.length >= 10;
  const isCpfValid = isComplete ? isValidCPF(inputVal) : null;
  const canSearch = digits.length >= 10;

  const effectiveAlunos = matchingAlunos.length > 0 
    ? matchingAlunos 
    : (selectedAluno ? [selectedAluno] : []);
  const hasMatriculas = effectiveAlunos.length > 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 mb-6">
      
      {/* Header and instruction */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          Identificação do Aluno por CPF
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Digite o CPF e clique em <strong>Consultar Aluno</strong> para selecionar a matrícula desejada para atendimento.
        </p>
      </div>

      {/* Input row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
              CPF
            </span>
          </div>

          <input
            id="input-busca-cpf"
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full pl-16 pr-20 py-3 text-base font-semibold text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-wider"
          />

          {/* Validation & Clear buttons inside input */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            {inputVal && (
              <button
                type="button"
                id="btn-clear-cpf"
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 cursor-pointer"
                title="Limpar campo"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isComplete && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isCpfValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isCpfValid ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Válido
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Inválido
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          id="btn-buscar-cpf"
          onClick={handleSearchClick}
          disabled={!canSearch}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Consultar Aluno</span>
        </button>

        <button
          type="button"
          id="btn-novo-aluno-header"
          onClick={() => onOpenNovoAlunoModal(inputVal, false)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo</span>
        </button>
      </div>

      {/* Feedback quando nenhum aluno é localizado após clicar em Consultar */}
      {searchAttempted && matchingAlunos.length === 0 && !selectedAluno && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-900 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Nenhum aluno encontrado para o CPF informado. Utilize o botão <strong>Cadastrar Novo</strong> acima para registrá-lo.
          </span>
        </div>
      )}

      {/* Painel de Seleção de Matrículas (quando há 1 ou mais matrículas para o mesmo CPF) */}
      {hasMatriculas && (
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  {effectiveAlunos.length === 1 ? (
                    <span>Aluno possui 1 matrícula cadastrada</span>
                  ) : (
                    <span>Aluno possui {effectiveAlunos.length} matrículas cadastradas</span>
                  )}
                  {effectiveAlunos[0]?.nome && (
                    <span className="text-[11px] font-semibold bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-full">
                      {effectiveAlunos[0]?.nome}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {effectiveAlunos.length === 1
                    ? 'Selecione abaixo a matrícula para atendimento e abertura do formulário de tabulação:'
                    : 'Selecione abaixo qual matrícula você deseja atender para abrir o formulário de tabulação:'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-adicionar-nova-matricula"
              onClick={() => onOpenNovoAlunoModal(inputVal || currentCpf, true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-300 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] self-start sm:self-auto cursor-pointer"
              title="Cadastrar outra matrícula para este mesmo aluno"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Matrícula para este CPF</span>
            </button>
          </div>

          {/* Cards de Matrículas disponíveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3.5">
            {effectiveAlunos.map((item, idx) => {
              const isSelected = selectedAluno?.id === item.id || (
                selectedAluno && 
                (selectedAluno.matricula || selectedAluno.ra) === (item.matricula || item.ra)
              );
              const isAtivo = (item.statusAcademico || 'ATIVO').toUpperCase() === 'ATIVO';

              return (
                <div
                  key={item.id || item.matricula || idx}
                  onClick={() => onSelectAluno && onSelectAluno(item)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/50'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                      <Hash className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-200' : 'text-indigo-600'}`} />
                      <span>{item.matricula || item.ra || 'S/ Matrícula'}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? isAtivo
                            ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40'
                            : 'bg-rose-400/30 text-rose-100 border border-rose-300/40'
                          : isAtivo
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.statusAcademico || 'ATIVO'}
                    </span>
                  </div>

                  {/* Informação de Curso removida conforme solicitação do usuário */}
                  {item.polo && (
                    <div className="space-y-1">
                      <p className={`text-[11px] flex items-center gap-1 line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{item.polo}</span>
                      </p>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-slate-100/40 flex items-center justify-between">
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isSelected ? 'text-emerald-300' : 'text-indigo-600 group-hover:text-indigo-700'
                    }`}>
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Atendendo agora</span>
                        </>
                      ) : (
                        <>
                          <span>Selecionar matrícula</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
