import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Check, 
  AlertCircle, 
  GraduationCap, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  Hash,
  Save
} from 'lucide-react';
import { Aluno } from '../types';
import { formatCPF, formatPhone, isValidCPF, cleanDigits, getSaoPauloDateString } from '../utils/cpf';

interface AlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aluno: Aluno) => void;
  alunoToEdit?: Aluno | null;
  initialCpf?: string;
  isNewMatricula?: boolean;
  existingAluno?: Aluno | null;
}

export const AlunoModal: React.FC<AlunoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  alunoToEdit,
  initialCpf,
  isNewMatricula = false,
  existingAluno,
}) => {
  const isEditing = !!alunoToEdit && !isNewMatricula;

  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    matricula: '',
    email: '',
    telefone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alunoToEdit && !isNewMatricula) {
      setFormData({
        cpf: alunoToEdit.cpf || '',
        nome: alunoToEdit.nome || '',
        matricula: alunoToEdit.matricula || alunoToEdit.ra || '',
        email: alunoToEdit.email || '',
        telefone: alunoToEdit.telefone || '',
      });
    } else if (isNewMatricula && existingAluno) {
      setFormData({
        cpf: existingAluno.cpf || initialCpf || '',
        nome: existingAluno.nome || '',
        matricula: '',
        email: existingAluno.email || '',
        telefone: existingAluno.telefone || '',
      });
    } else {
      setFormData({
        cpf: initialCpf || '',
        nome: '',
        matricula: '',
        email: '',
        telefone: '',
      });
    }
    setErrors({});
  }, [alunoToEdit, initialCpf, isNewMatricula, existingAluno, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};

    // 1. CPF Validation
    const cleanCpf = cleanDigits(formData.cpf);
    if (!formData.cpf || cleanCpf.length !== 11) {
      errs.cpf = 'CPF incompleto (11 dígitos).';
    } else if (!isValidCPF(formData.cpf)) {
      errs.cpf = 'CPF inválido pelo algoritmo verificador.';
    }

    // 2. Nome Completo Validation
    if (!formData.nome || formData.nome.trim().length < 3) {
      errs.nome = 'Nome completo é obrigatório (mínimo 3 letras).';
    }

    // 3. Matrícula Validation (deve ter exatamente 12 caracteres/dígitos)
    const cleanMatricula = formData.matricula.trim();
    if (!cleanMatricula) {
      errs.matricula = 'Matrícula do aluno é obrigatória.';
    } else if (cleanMatricula.length !== 12) {
      errs.matricula = `A matrícula deve conter exatamente 12 caracteres (inseridos: ${cleanMatricula.length}).`;
    }

    // 4. E-mail Validation
    if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
      errs.email = 'Informe um e-mail válido (ex: aluno@email.com).';
    }

    // 5. Telefone Validation
    const cleanTel = cleanDigits(formData.telefone);
    if (!formData.telefone || cleanTel.length < 10) {
      errs.telefone = 'Telefone com DDD é obrigatório (ex: (11) 98888-7777).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matriculaVal = formData.matricula.trim();

    // Se estiver editando um cadastro existente, preserva o ID. Se for nova matrícula, gera novo ID
    const newId = isEditing && alunoToEdit ? alunoToEdit.id : `alu-${Date.now()}`;

    const alunoCompleto: Aluno = {
      id: newId,
      cpf: formData.cpf.trim(),
      nome: formData.nome.trim(),
      matricula: matriculaVal,
      ra: matriculaVal,
      email: formData.email.trim(),
      telefone: formData.telefone.trim(),
      curso: (isEditing ? alunoToEdit?.curso : existingAluno?.curso) || '',
      polo: (isEditing ? alunoToEdit?.polo : existingAluno?.polo) || '',
      statusAcademico: isEditing ? (alunoToEdit?.statusAcademico || 'ATIVO') : 'ATIVO',
      modalidade: isEditing ? (alunoToEdit?.modalidade || 'Presencial') : (existingAluno?.modalidade || 'Presencial'),
      semestre: isEditing ? (alunoToEdit?.semestre || '1º Semestre') : '1º Semestre',
      dataCadastro: isEditing && alunoToEdit ? alunoToEdit.dataCadastro : getSaoPauloDateString(),
    };

    onSave(alunoCompleto);
    onClose();
  };

  const isCpfValidFormat = cleanDigits(formData.cpf).length === 11 && isValidCPF(formData.cpf);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner">
              {isEditing ? (
                <GraduationCap className="w-5 h-5" />
              ) : isNewMatricula ? (
                <Hash className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isEditing 
                  ? 'Editar Cadastro do Aluno' 
                  : isNewMatricula 
                  ? 'Nova Matrícula para o Aluno' 
                  : 'Cadastrar Novo Aluno'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing 
                  ? 'Atualize os dados desta matrícula' 
                  : isNewMatricula 
                  ? `Cadastre uma matrícula adicional para ${formData.nome || 'o aluno'}`
                  : 'Informe os dados para identificação e atendimento'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative banner if adding new matricula */}
        {isNewMatricula && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 flex items-center gap-2 text-xs text-indigo-900">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              O CPF e dados do aluno foram mantidos. Digite a <strong>nova matrícula</strong> (12 dígitos) abaixo.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Row 1: CPF and Matrícula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Campo 1: CPF do Aluno */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  CPF do Aluno <span className="text-rose-500">*</span>
                </label>
                {isCpfValidFormat && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Válido
                  </span>
                )}
              </div>
              <input
                type="text"
                id="modal-input-cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={isEditing}
                className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.cpf ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-900'
                }`}
              />
              {errors.cpf && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.cpf}</p>}
            </div>

            {/* Campo 2: Matrícula */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  Matrícula <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[11px] font-mono font-medium ${
                  formData.matricula.length === 12
                    ? 'text-emerald-600 font-bold'
                    : formData.matricula.length > 0
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}>
                  {formData.matricula.length}/12 dígitos
                </span>
              </div>
              <input
                type="text"
                id="modal-input-matricula"
                value={formData.matricula}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, matricula: onlyNumbers });
                }}
                placeholder="000000000000 (12 dígitos)"
                maxLength={12}
                className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.matricula ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-900'
                }`}
              />
              {errors.matricula && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.matricula}</p>}
            </div>

          </div>

          {/* Row 2: Nome Completo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Nome Completo <span className="text-rose-500">*</span>
              </span>
            </label>
            <input
              type="text"
              id="modal-input-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Ana Clara Silva Ribeiro"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.nome ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-900'
              }`}
            />
            {errors.nome && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.nome}</p>}
          </div>

          {/* Row 3: E-mail and Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Campo 4: E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  E-mail <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="email"
                id="modal-input-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aluno@email.com"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.email ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-900'
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
            </div>

            {/* Campo 5: Telefone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  Telefone / WhatsApp <span className="text-rose-500">*</span>
                </span>
              </label>
              <input
                type="text"
                id="modal-input-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.telefone ? 'border-rose-400 bg-rose-50/50 text-rose-900' : 'border-slate-300 text-slate-900'
                }`}
              />
              {errors.telefone && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.telefone}</p>}
            </div>

          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="modal-btn-salvar-aluno"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Salvar Alterações' : isNewMatricula ? 'Cadastrar Nova Matrícula' : 'Cadastrar e Selecionar'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
