import { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle,
  Clock,
  Check,
  XCircle,
  CreditCard,
  User,
  Briefcase,
  Users,
  Building,
  Smartphone,
  Save,
  Send,
  FileSpreadsheet,
  Edit3,
} from 'lucide-react';
import { LoanApplication, LOAN_PURPOSES } from '../types/loan';
import { useToast } from '../context/ToastContext';

interface StaffReviewModalProps {
  isOpen: boolean;
  loan: LoanApplication | null;
  spreadsheetId?: string;
  sheetTitle?: string;
  onClose: () => void;
  onSubmitDecision: (updatedLoan: LoanApplication) => void;
}

export function StaffReviewModal({
  isOpen,
  loan,
  spreadsheetId,
  sheetTitle = 'Submissions',
  onClose,
  onSubmitDecision,
}: StaffReviewModalProps) {
  const { showToast } = useToast();

  const [decisionStatus, setDecisionStatus] = useState<LoanApplication['status']>(
    loan?.status || 'Approved'
  );
  const [requestedAmount, setRequestedAmount] = useState<number>(
    loan?.requested_amount || 5000
  );
  const [loanDuration, setLoanDuration] = useState<number>(
    loan?.loan_duration_months || 12
  );
  const [loanPurpose, setLoanPurpose] = useState<string>(
    loan?.request_type || LOAN_PURPOSES[0]
  );
  const [applicantName, setApplicantName] = useState<string>(
    loan?.full_name_on_payslip || ''
  );
  const [contactPhone, setContactPhone] = useState<string>(
    loan?.mobile_phone || ''
  );
  const [officerName, setOfficerName] = useState<string>('Staff Credit Officer');
  const [officerNotes, setOfficerNotes] = useState<string>(loan?.notes || '');
  const [showEditFields, setShowEditFields] = useState<boolean>(false);

  const [checklist, setChecklist] = useState({
    payslipVerified: true,
    idVerified: true,
    nokContacted: true,
    employmentConfirmed: true,
    disbursementAccountValid: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !loan) return null;

  const handleToggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updated: LoanApplication = {
        ...loan,
        full_name_on_payslip: applicantName.trim() || loan.full_name_on_payslip,
        mobile_phone: contactPhone.trim() || loan.mobile_phone,
        requested_amount: Number(requestedAmount) || loan.requested_amount,
        loan_duration_months: Number(loanDuration) || loan.loan_duration_months,
        request_type: loanPurpose,
        status: decisionStatus,
        notes: officerNotes,
      };

      onSubmitDecision(updated);

      showToast({
        type: 'success',
        title: 'Application Modified & Saved!',
        message: `Application ${loan.reference_id} (${updated.full_name_on_payslip}) saved successfully.`,
        iconType: 'check',
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to submit staff decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Staff Review & Modification
              </div>
              <h2 className="text-base font-bold tracking-tight">
                Review & Modify Application
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                {loan.reference_id} &bull; {loan.full_name_on_payslip}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Summary Cards (Package & EMI removed) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Applicant</span>
              <span className="font-bold text-slate-900 block truncate mt-0.5">{applicantName || loan.full_name_on_payslip}</span>
              <span className="text-[10px] text-slate-500">{contactPhone || loan.mobile_phone}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Requested Loan</span>
              <span className="font-extrabold text-blue-700 block text-sm mt-0.5">
                GHS {Number(requestedAmount).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">{loanDuration} Months tenure</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Loan Purpose</span>
              <span className="font-bold text-slate-800 block text-xs mt-0.5 truncate">
                {loanPurpose || 'Personal Loan'}
              </span>
              <span className="text-[10px] text-slate-500">Facility Type</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Disbursement</span>
              <span className="font-bold text-slate-900 block truncate mt-0.5">{loan.mode_of_payment}</span>
              <span className="text-[10px] text-slate-500 truncate block">
                {loan.mode_of_payment === 'Mobile Money' ? loan.momo_number : loan.bank_account_number}
              </span>
            </div>
          </div>

          {/* Toggle Button to Modify Application Fields */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800">
              Application Parameters
            </span>
            <button
              type="button"
              onClick={() => setShowEditFields(!showEditFields)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showEditFields ? 'Hide Modify Fields' : 'Modify Application Details'}</span>
            </button>
          </div>

          {/* Modify Fields Section */}
          {showEditFields && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                <span>Modify Loan & Applicant Values</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Loan Amount (GHS)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repayment Duration (Months)
                  </label>
                  <select
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} Months ({m >= 12 ? `${m / 12} yrs` : `${m} mos`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose of Loan
                  </label>
                  <select
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {LOAN_PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applicant Full Name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dossier Details Grid */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Applicant & Verification Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-slate-700">
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">National ID:</span>
                <span className="font-mono font-semibold">{loan.id_type} ({loan.id_number})</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Employer:</span>
                <span className="font-semibold">{loan.employer}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Staff / Employee ID:</span>
                <span className="font-mono font-semibold">{loan.employee_number}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Role / Occupation:</span>
                <span className="font-semibold">{loan.occupation} ({loan.region})</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Next of Kin:</span>
                <span className="font-semibold">{loan.nok_full_name} ({loan.nok_relationship})</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-500">Next of Kin Phone:</span>
                <span className="font-mono font-semibold">{loan.nok_phone}</span>
              </div>
            </div>
          </div>

          {/* Staff Verification Checklist */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Credit Officer Due Diligence Checklist</span>
            </h4>
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.payslipVerified}
                  onChange={() => handleToggleCheck('payslipVerified')}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <span>Payslip & Monthly Net Income confirmed</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.idVerified}
                  onChange={() => handleToggleCheck('idVerified')}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <span>Ghana Card National ID validated and active</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.nokContacted}
                  onChange={() => handleToggleCheck('nokContacted')}
                  className="w-4 h-4 text-blue-600 rounded-slate-300 border-slate-300 focus:ring-blue-500"
                />
                <span>Next of Kin contact verified</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.disbursementAccountValid}
                  onChange={() => handleToggleCheck('disbursementAccountValid')}
                  className="w-4 h-4 text-blue-600 rounded-slate-300 border-slate-300 focus:ring-blue-500"
                />
                <span>Disbursement mobile money / bank account ownership verified</span>
              </label>
            </div>
          </div>

          {/* Staff Decision Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Staff Decision & Loan Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { status: 'Approved', color: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500' },
                { status: 'Under Review', color: 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500' },
                { status: 'Disbursed', color: 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500' },
                { status: 'Rejected', color: 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500' },
              ].map((item) => {
                const isSelected = decisionStatus === item.status;
                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => setDecisionStatus(item.status as LoanApplication['status'])}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? item.color
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {item.status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staff Officer Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reviewing Officer Name / Staff ID
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                placeholder="e.g. Officer Akoto (Credit Div.)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Officer Approval Notes / Conditions
              </label>
              <input
                type="text"
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="e.g. Approved subject to salary deduction mandate"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Staff Decision</span>
          </button>
        </div>
      </div>
    </div>
  );
}
