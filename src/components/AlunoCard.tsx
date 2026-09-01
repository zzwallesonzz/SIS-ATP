import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Edit3, 
  History, 
  MessageCircle,
  Hash,
  CreditCard,
  Calendar,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { Aluno, Tabulacao } from '../types';
import { formatDateBR, formatCPF } from '../utils/cpf';

interface AlunoCardProps {
  aluno: Aluno;
  onEditAluno: (aluno: Aluno) => void;
  historicoAluno: Tabulacao[];
  onOpenHistoricoAluno: () => void;
}

export const AlunoCard: React.FC<AlunoCardProps> = ({
  aluno,
  onEditAluno,
  historicoAluno,
  onOpenHistoricoAluno,
}) => {
  const matricula = aluno.matricula || aluno.ra || 'Não informada';
  const cleanPhone = aluno.telefone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${cleanPhone}`;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/90 mb-6 transition-all hover:border-slate-300">
      
      {/* Top row with name, core chips, and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20 flex-shrink-0">
            {aluno.nome.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{aluno.nome}</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aluno Selecionado
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="font-mono bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md font-semibold border border-slate-200 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-500" />
                CPF: {formatCPF(aluno.cpf)}
              </span>
              <span className="font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-semibold border border-indigo-100 flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-600" />
                Matrícula: {matricula}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            id="btn-ver-historico-aluno"
            onClick={onOpenHistoricoAluno}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
            title="Ver atendimentos anteriores deste aluno"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Histórico ({historicoAluno.length})</span>
          </button>

          <button
            type="button"
            id="btn-editar-aluno"
            onClick={() => onEditAluno(aluno)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Cadastro</span>
          </button>
        </div>
      </div>

      {/* Core Contact & Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        
        {/* CPF */}
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 flex-shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPF do Aluno</p>
            <p className="text-sm font-mono font-bold text-slate-800">{aluno.cpf}</p>
            <span className="text-[10px] text-slate-400">Documento Principal</span>
          </div>
        </div>

        {/* Matrícula */}
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0 mt-0.5">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matrícula</p>
            <p className="text-sm font-mono font-bold text-indigo-700">{matricula}</p>
            <span className="text-[10px] text-slate-400">Identificador Acadêmico</span>
          </div>
        </div>

        {/* E-mail */}
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
            <Mail className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
            <a 
              href={`mailto:${aluno.email}`} 
              className="text-xs font-semibold text-indigo-600 hover:underline break-all block truncate"
              title={aluno.email}
            >
              {aluno.email}
            </a>
            <span className="text-[10px] text-slate-400">Comunicação e notificações</span>
          </div>
        </div>

        {/* Telefone & WhatsApp */}
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0 mt-0.5">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone</p>
            <p className="text-xs font-bold text-slate-800">{aluno.telefone}</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold mt-0.5"
            >
              <MessageCircle className="w-3 h-3" />
              Abrir WhatsApp
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};
