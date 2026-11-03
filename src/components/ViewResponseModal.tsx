import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  Briefcase,
  CreditCard,
  Copy,
  Check,
  Eye,
  Maximize2,
} from 'lucide-react';
import { LoanApplication } from '../types/loan';
import {
  generateLoanApplicationPDF,
  generateLoanApplicationPDFUrl,
} from '../services/pdfGenerator';
import { useToast } from '../context/ToastContext';

interface ViewResponseModalProps {
  isOpen: boolean;
  loan: LoanApplication | null;
  spreadsheetId?: string;
  onClose: () => void;
}

export function ViewResponseModal({
  isOpen,
  loan,
  spreadsheetId,
  onClose,
}: ViewResponseModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'document' | 'preview' | 'details'>('document');
  const [copied, setCopied] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Generate blob URL when modal opens
  useEffect(() => {
    if (isOpen && loan) {
      try {
        const url = generateLoanApplicationPDFUrl(loan, spreadsheetId);
        setPdfBlobUrl(url);

        return () => {
          if (url) URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.warn('Could not generate PDF blob URL:', err);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [isOpen, loan, spreadsheetId]);

  if (!isOpen || !loan) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(loan.reference_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    generateLoanApplicationPDF(loan, spreadsheetId);
    showToast({
      type: 'success',
      title: 'PDF Dossier Downloaded!',
      message: `Official PDF for ${loan.full_name_on_payslip} (${loan.reference_id}) downloaded.`,
      iconType: 'pdf',
    });
  };

  // Staff action: View in PDF Form in new tab/window
  const handleOpenPDFInNewWindow = () => {
    try {
      const url = pdfBlobUrl || generateLoanApplicationPDFUrl(loan, spreadsheetId);
      window.open(url, '_blank');
      showToast({
        type: 'success',
        title: 'Opening PDF Viewer',
        message: `Displaying official PDF form for ${loan.full_name_on_payslip}.`,
        iconType: 'pdf',
      });
    } catch (err) {
      console.error('Error opening PDF:', err);
      setActiveTab('document');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = loan.submitted_at
    ? new Date(loan.submitted_at).toLocaleString('en-GB')
    : new Date().toLocaleString('en-GB');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Client Submission Dossier
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {loan.status || 'Pending Review'}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
                <span>Ref: {loan.reference_id}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="hover:text-white inline-flex items-center gap-1 text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </p>
            </div>
          </div>

          {/* Action buttons with Staff "View in PDF Form" */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Staff Button: View in PDF Form */}
            <button
              type="button"
              onClick={handleOpenPDFInNewWindow}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
              title="Open full PDF form in browser viewer for staff"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View in PDF Form ↗</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg transition-colors border border-white/10"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                activeTab === 'document'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 Official Form Layout
            </button>

            {pdfBlobUrl && (
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔍 Interactive PDF Frame</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Data Fields Breakdown
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenPDFInNewWindow}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Open PDF Fullscreen ↗</span>
            </button>

            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>View in Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {activeTab === 'preview' && pdfBlobUrl ? (
            /* Interactive PDF Viewer Frame */
            <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-200">
              <iframe
                src={`${pdfBlobUrl}#view=FitH`}
                title="Loan Application PDF Viewer"
                className="w-full h-full border-none"
              />
            </div>
          ) : activeTab === 'document' ? (
            /* Official Paper Document View */
            <div className="max-w-2xl mx-auto bg-white border border-slate-300 shadow-md rounded-xl p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Document Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg tracking-tight">
                    <Building className="w-5 h-5 text-blue-700" />
                    <span>CREDIT LOAN APPLICATION DOSSIER</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ghana National Micro-Credit Registry &bull; Verified Digital Form
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-800 font-mono font-bold text-xs rounded border border-blue-200">
                    {loan.reference_id}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{formattedDate}</p>
                </div>
              </div>

              {/* Status & Sync Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-700">{loan.status || 'Pending'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Requested Amount</span>
                  <span className="font-extrabold text-blue-700">GHS {loan.requested_amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Repayment Tenure</span>
                  <span className="font-extrabold text-blue-700">{loan.loan_duration_months} Months</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Purpose of Loan</span>
                  <span className="font-semibold text-slate-800 truncate block">{loan.request_type || 'Personal Loan'}</span>
                </div>
              </div>

              {/* 1. Applicant Personal Identity */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  <span>1. Applicant Personal Identity</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Full Name (on Payslip)</span>
                    <span className="font-bold text-slate-800">{loan.full_name_on_payslip}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ID Document & Number</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {loan.id_type}: {loan.id_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Date of Birth & Gender</span>
                    <span className="font-medium text-slate-800">
                      {loan.date_of_birth} ({loan.gender})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mobile Contact</span>
                    <span className="font-semibold text-slate-800">{loan.mobile_phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Email Address</span>
                    <span className="font-medium text-slate-800 truncate block">{loan.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">GPS Digital Address</span>
                    <span className="font-mono font-bold text-blue-700">{loan.gps_address || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block">Residential Street Address</span>
                    <span className="text-slate-800">{loan.residential_address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Marital Status</span>
                    <span className="text-slate-800">{loan.marital_status}</span>
                  </div>
                </div>
              </div>

              {/* 2. Employment Information */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                  <span>2. Employment & Salary Source</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Employer</span>
                    <span className="font-bold text-slate-800">{loan.employer}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Staff / Employee ID</span>
                    <span className="font-mono font-semibold text-slate-800">{loan.employee_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Occupation / Position</span>
                    <span className="text-slate-800">{loan.occupation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Department & Region</span>
                    <span className="text-slate-800">{loan.department} ({loan.region})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Years with Employer</span>
                    <span className="text-slate-800">{loan.years_with_employer} years</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Workplace Location</span>
                    <span className="text-slate-800">{loan.work_address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Loan Request & Terms */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                  <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                  <span>3. Loan Request & Repayment Period</span>
                </h4>
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-blue-600 block uppercase font-bold">Requested Loan Amount</span>
                    <span className="text-base font-extrabold text-blue-900">
                      GHS {loan.requested_amount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 block uppercase font-bold">Repayment Duration</span>
                    <span className="text-base font-extrabold text-slate-800">
                      {loan.loan_duration_months} Months
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-600 block uppercase font-bold">Purpose of Loan</span>
                    <span className="text-sm font-bold text-slate-800">
                      {loan.request_type || 'Personal Loan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Disbursement & Next of Kin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                    Disbursement Channel
                  </h5>
                  <div className="space-y-1">
                    <p className="text-slate-600">Mode: <strong className="text-slate-900">{loan.mode_of_payment}</strong></p>
                    <p className="text-slate-600">
                      Details:{' '}
                      <strong className="text-blue-700 font-mono">
                        {loan.mode_of_payment === 'Mobile Money'
                          ? `${loan.momo_network || 'MoMo'}: ${loan.momo_number || ''}`
                          : `${loan.bank_name} (${loan.bank_account_number})`}
                      </strong>
                    </p>
                    <p className="text-slate-600">Account Holder: <strong>{loan.account_holder_name || loan.full_name_on_payslip}</strong></p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                    Next of Kin Contact
                  </h5>
                  <div className="space-y-1">
                    <p className="text-slate-600">Name: <strong className="text-slate-900">{loan.nok_full_name}</strong></p>
                    <p className="text-slate-600">Relationship: <strong className="text-slate-900">{loan.nok_relationship}</strong></p>
                    <p className="text-slate-600">Phone: <strong className="text-slate-900">{loan.nok_phone}</strong></p>
                  </div>
                </div>
              </div>

              {/* Legal Declarations & Digital Stamp */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digitally certified submission &bull; Verified Credit Application</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  ID: {loan.reference_id} &bull; Timestamp: {formattedDate}
                </div>
              </div>
            </div>
          ) : (
            /* Structured Field Cards View */
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Personal Details</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Full Name</span>
                    <span className="font-bold text-slate-800">{loan.full_name_on_payslip}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">ID Number</span>
                    <span className="font-mono font-bold text-slate-800">{loan.id_type}: {loan.id_number}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Date of Birth</span>
                    <span className="font-medium text-slate-800">{loan.date_of_birth}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Phone</span>
                    <span className="font-bold text-slate-800">{loan.mobile_phone}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Email</span>
                    <span className="text-slate-800">{loan.email}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Ghana GPS</span>
                    <span className="font-mono font-bold text-blue-700">{loan.gps_address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Employment & Organization</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Employer</span>
                    <span className="font-bold text-slate-800">{loan.employer}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Staff ID</span>
                    <span className="font-mono text-slate-800">{loan.employee_number}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Role</span>
                    <span className="text-slate-800">{loan.occupation}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Region</span>
                    <span className="text-slate-800">{loan.region}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tenure</span>
                    <span className="text-slate-800">{loan.years_with_employer} years</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                    <span className="text-slate-800">{loan.department}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Loan Request & Details</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Loan Amount</span>
                    <span className="font-extrabold text-blue-700">GHS {loan.requested_amount.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Repayment Tenure</span>
                    <span className="font-extrabold text-blue-700">{loan.loan_duration_months} Months</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Purpose</span>
                    <span className="font-medium text-slate-800">{loan.request_type || 'Personal'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-md">
                    <span className="text-[10px] text-slate-400 block font-semibold">Disbursement</span>
                    <span className="font-medium text-slate-800">{loan.mode_of_payment}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Staff Review Portal &bull; Verified Client Record</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPDFInNewWindow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View in PDF Form</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
