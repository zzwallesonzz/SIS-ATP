import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck
} from 'lucide-react';
import { Aluno } from '../types';
import { formatCPF, cleanDigits, isValidCPF } from '../utils/cpf';

interface CpfSearchProps {
  currentCpf: string;
  onCpfChange: (cpf: string) => void;
  onSearch: (cpf: string) => void;
  selectedAluno: Aluno | null;
  searchAttempted: boolean;
  onOpenNovoAlunoModal: (cpfPreFill?: string) => void;
  onClear?: () => void;
}

export const CpfSearch: React.FC<CpfSearchProps> = ({
  currentCpf,
  onCpfChange,
  onSearch,
  selectedAluno,
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
      if (digits.length === 11) {
        onSearch(inputVal);
      }
    }
  };

  const handleSearchClick = () => {
    const digits = cleanDigits(inputVal);
    if (digits.length === 11) {
      onSearch(inputVal);
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
  const isComplete = digits.length === 11;
  const isCpfValid = isComplete ? isValidCPF(inputVal) : null;
  const canSearch = isComplete && (isCpfValid || true); // Allow search even if CPF format is incomplete, backend will validate

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 mb-6">
      
      {/* Header and instruction */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          Identificação do Aluno por CPF
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Digite o CPF e clique em <strong>Consultar Aluno</strong> para carregar as informações ou utilize <strong>Cadastrar Novo</strong> caso não possua cadastro.
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
          onClick={() => onOpenNovoAlunoModal(inputVal)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo</span>
        </button>
      </div>

      {/* Feedback quando nenhum aluno é localizado após clicar em Consultar */}
      {searchAttempted && !selectedAluno && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-900 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Nenhum aluno encontrado para o CPF informado. Utilize o botão <strong>Cadastrar Novo</strong> acima para registrá-lo.
          </span>
        </div>
      )}

      {/* Feedback quando o aluno for localizado */}
      {selectedAluno && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-3.5 py-2 rounded-lg border border-emerald-200 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Aluno identificado: <strong>{selectedAluno.nome}</strong> (RA/Matrícula: {selectedAluno.matricula || selectedAluno.ra})</span>
        </div>
      )}

    </div>
  );
};
