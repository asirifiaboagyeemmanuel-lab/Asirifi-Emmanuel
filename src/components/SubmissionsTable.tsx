import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Download,
  PlusCircle,
  Check,
  ShieldCheck,
  ExternalLink,
  Copy,
  Sliders,
  FileText,
  X,
  Edit3,
} from 'lucide-react';
import { fetchSheetSubmissions, clearSheetRows, SpreadsheetMetadata } from '../services/googleSheets';
import { ConfirmationModal } from './ConfirmationModal';
import { ViewResponseModal } from './ViewResponseModal';
import { StaffReviewModal } from './StaffReviewModal';
import { SheetManager } from './SheetManager';
import { rowToLoanApplication, generateLoanApplicationPDF } from '../services/pdfGenerator';
import {
  getLocalSubmissions,
  saveLocalSubmission,
  clearLocalSubmissions,
} from '../services/submissionStore';
import { LoanApplication } from '../types/loan';
import { useToast } from '../context/ToastContext';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SubmissionsTableProps {
  token: string | null;
  user?: any;
  spreadsheetId: string | null;
  spreadsheetName?: string;
  sheetTitle: string;
  sheetUrl?: string;
  refreshTrigger: number;
  onLogin?: () => void;
  onLogout?: () => void;
  onSheetConfigured?: (metadata: SpreadsheetMetadata, sheetTitle: string) => void;
  onNavigateToForm?: () => void;
}

export function SubmissionsTable({
  token,
  user,
  spreadsheetId,
  spreadsheetName,
  sheetTitle,
  sheetUrl,
  refreshTrigger,
  onLogin,
  onLogout,
  onSheetConfigured,
  onNavigateToForm,
}: SubmissionsTableProps) {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<LoanApplication[]>(() => getLocalSubmissions());
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanForView, setSelectedLoanForView] = useState<LoanApplication | null>(null);
  const [selectedLoanForStaffReview, setSelectedLoanForStaffReview] = useState<LoanApplication | null>(null);
  const [downloadSuccessRef, setDownloadSuccessRef] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSheetConfig, setShowSheetConfig] = useState(false);

  const handleSaveStaffDecision = (updatedLoan: LoanApplication) => {
    const updated = saveLocalSubmission(updatedLoan);
    setSubmissions(updated);
  };

  // Destructive clear modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Direct Google Sheet URL
  const directSheetUrl =
    sheetUrl ||
    (spreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      : 'https://docs.google.com/spreadsheets/d/1UlKJq-2NaQuoGHrTOm1nWJfXr2IcfzhIZ2FomE-vk1s/edit?usp=sharing');

  // Load and merge submissions from both Google Sheets & Local storage
  const loadSubmissions = async () => {
    // 1. Start with local applications so submissions are immediately seen
    const local = getLocalSubmissions();
    let merged = [...local];

    // 2. If token & spreadsheetId are active, fetch latest live rows from Google Sheets
    if (token && spreadsheetId) {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const sheetData = await fetchSheetSubmissions(spreadsheetId, sheetTitle, token);
        setHeaders(sheetData.headers);

        if (sheetData.rows && sheetData.rows.length > 0) {
          // Convert sheet rows into typed LoanApplication objects
          const sheetApps = sheetData.rows.map((row) =>
            rowToLoanApplication(row, sheetData.headers)
          );

          // Merge: sheet apps + any local ones not yet in sheet
          const sheetRefMap = new Set(sheetApps.map((a) => a.reference_id));
          const localOnly = local.filter((a) => !sheetRefMap.has(a.reference_id));
          merged = [...sheetApps, ...localOnly];
        }
      } catch (err: any) {
        console.warn('Google Sheet fetch notice:', err);
        // Do not block viewing local submissions if Google Sheets network has temporary hiccup
        if (local.length === 0) {
          setErrorMessage(err.message || 'Unable to fetch submissions from Google Sheet.');
        }
      } finally {
        setIsLoading(false);
      }
    }

    setSubmissions(merged);
  };

  useEffect(() => {
    loadSubmissions();
  }, [token, spreadsheetId, sheetTitle, refreshTrigger]);

  // Copy Google Sheet URL to clipboard
  const handleCopySheetLink = () => {
    navigator.clipboard.writeText(directSheetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast({
      type: 'success',
      title: 'Google Sheet Link Copied!',
      message: 'The direct spreadsheet URL has been copied to your clipboard.',
      iconType: 'check',
    });
  };

  // Handler for on-the-fly PDF generation and download
  const handleDownloadPDF = (loan: LoanApplication) => {
    try {
      generateLoanApplicationPDF(loan, spreadsheetId || undefined);
      setDownloadSuccessRef(loan.reference_id);
      setTimeout(() => setDownloadSuccessRef(null), 3000);

      showToast({
        type: 'success',
        title: 'PDF Generated Successfully!',
        message: `Official loan dossier for ${loan.full_name_on_payslip} (${loan.reference_id}) downloaded.`,
        iconType: 'pdf',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF document. Please try again.');
    }
  };

  // Add sample submission for testing
  const handleAddSampleSubmission = () => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const sample: LoanApplication = {
      reference_id: `LN-GH-${new Date().getFullYear()}-${randomSuffix}`,
      submitted_at: new Date().toISOString(),
      status: 'Pending Review',
      full_name_on_payslip: 'Kofi Owusu Darko',
      date_of_birth: '1990-04-12',
      gender: 'Male',
      marital_status: 'Married',
      id_type: 'Ghana Card',
      id_number: `GHA-${Math.floor(100000000 + Math.random() * 900000000)}-4`,
      id_issue_date: '2021-06-10',
      id_expiry_date: '2031-06-09',
      place_of_issue: 'Tema Metropolitan',
      email: 'kofi.owusu@example.com',
      mobile_phone: '+233 24 991 8820',
      office_phone: '',
      residential_address: 'Community 11, House 42, Tema',
      gps_address: 'GT-089-1022',
      residential_landmark: 'Near Shell Station',
      employer: 'Ghana National Petroleum Corp (GNPC)',
      employee_number: `GNPC-${randomSuffix}`,
      occupation: 'Operations Engineer',
      department: 'Upstream Development',
      region: 'Greater Accra',
      years_with_employer: '6',
      employment_start_date: '2018-05-01',
      work_address: 'Petroleum House, Tema',
      package_id: 'p6',
      requested_amount: 15000,
      loan_duration_months: 24,
      monthly_interest_rate: 0.035,
      monthly_repayment: 928,
      total_repayment: 22272,
      total_interest: 7272,
      request_type: 'Personal & Family Expense',
      mode_of_payment: 'Mobile Money',
      momo_network: 'MTN Mobile Money (MoMo)',
      momo_number: '0249918820',
      account_holder_name: 'Kofi Owusu Darko',
      nok_full_name: 'Yaa Asantewaa Darko',
      nok_phone: '+233 55 412 8890',
      nok_relationship: 'Spouse',
      nok_residential_address: 'Community 11, Tema',
      contact_consent: true,
      terms_accepted: true,
    };

    const updated = saveLocalSubmission(sample);
    setSubmissions(updated);

    showToast({
      type: 'success',
      title: 'Sample Application Added!',
      message: `Applicant ${sample.full_name_on_payslip} (${sample.reference_id}) added to submissions.`,
      iconType: 'check',
    });
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      if (token && spreadsheetId) {
        await clearSheetRows(spreadsheetId, sheetTitle, token);
      }
      clearLocalSubmissions();
      setSubmissions([]);
      setIsClearModalOpen(false);
      showToast({
        type: 'info',
        title: 'Submissions Cleared',
        message: 'All application records have been cleared from the view.',
        iconType: 'check',
      });
    } catch (err: any) {
      alert(`Error clearing rows: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  // Filter submissions by client name or ID (Ghana Card / National ID, Reference ID, Employee ID)
  const filteredSubmissions = submissions.filter((loan) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (loan.full_name_on_payslip && loan.full_name_on_payslip.toLowerCase().includes(term)) ||
      (loan.account_holder_name && loan.account_holder_name.toLowerCase().includes(term)) ||
      (loan.reference_id && loan.reference_id.toLowerCase().includes(term)) ||
      (loan.id_number && loan.id_number.toLowerCase().includes(term)) ||
      (loan.employee_number && loan.employee_number.toLowerCase().includes(term)) ||
      (loan.email && loan.email.toLowerCase().includes(term)) ||
      (loan.mobile_phone && loan.mobile_phone.toLowerCase().includes(term)) ||
      (loan.employer && loan.employer.toLowerCase().includes(term))
    );
  });

  // Calculate high-level portfolio metrics
  const totalSubmissions = submissions.length;
  const totalVolume = submissions.reduce((acc, loan) => acc + (loan.requested_amount || 0), 0);
  const avgLoan = totalSubmissions > 0 ? Math.round(totalVolume / totalSubmissions) : 0;
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length;

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* GOOGLE SIGN IN & GOOGLE SHEETS SYNC CONTROL CENTER */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl shadow-md border border-slate-700/80 p-5 sm:p-6 text-white overflow-hidden relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
          {/* Left Column: Google Sheets Sync Information */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Google Sheets Sync
                </span>

                {token ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Cloud Sync Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Offline (Sign in to sync)
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {spreadsheetName || 'Target Loan Submissions Google Sheet'}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Client loan submissions are stored here and synchronize automatically with the connected Google Sheet spreadsheet.
                </p>
              </div>

              {/* Sheet Metadata pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400 text-[11px]">Sheet ID:</span>
                  <span className="text-blue-300 font-bold">
                    {spreadsheetId || '1UlKJq-2NaQuoGHrTOm1nWJfXr2IcfzhIZ2FomE-vk1s'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400 text-[11px]">Tab:</span>
                  <span className="font-semibold text-emerald-300">
                    {sheetTitle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400 text-[11px]">In Registry:</span>
                  <span className="font-bold text-white">{totalSubmissions}</span>
                </div>
              </div>
            </div>

            {/* Sheets Sync Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={directSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:shadow-emerald-900/30"
                title="Open the target Google Sheet in a new browser tab"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Open in Google Sheets ↗</span>
              </a>

              <button
                type="button"
                onClick={handleCopySheetLink}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                title="Copy the Google Sheet URL"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Sheet Link'}</span>
              </button>

              <button
                type="button"
                onClick={loadSubmissions}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
                title="Sync and pull latest rows from Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync with Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSheetConfig(!showSheetConfig)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 font-semibold text-xs rounded-xl border border-blue-700/50 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showSheetConfig ? 'Hide Config' : 'Configure Tab'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Sign In with Google Card */}
          <div className="lg:col-span-5 bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Google Authentication
                </span>
                {token ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Authorized
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Sign In Required
                  </span>
                )}
              </div>

              {user ? (
                /* Signed-in user profile */
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full border border-blue-400/40 shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {user.displayName || 'Authorized Admin'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-300/90 leading-tight">
                    Your Google account is connected. Submissions are synced with read/write access.
                  </p>
                </div>
              ) : (
                /* Not signed in prompt */
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">Sign in with Google</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Authenticate to grant Google Sheets permission and write new submissions directly to your spreadsheet.
                  </p>
                </div>
              )}
            </div>

            {/* Auth Action button */}
            <div className="pt-4 mt-2 border-t border-slate-700/60 flex items-center justify-between">
              {user ? (
                <>
                  <span className="text-[11px] text-slate-400">Manage session</span>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="w-full">
                  {onLogin && (
                    <GoogleSignInButton
                      onClick={onLogin}
                      size="sm"
                      label="Sign in with Google"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Sheet Configuration Panel */}
        {showSheetConfig && onSheetConfigured && (
          <div className="mt-5 pt-5 border-t border-slate-700/80">
            <SheetManager
              user={user}
              token={token}
              onLogin={onLogin || (() => {})}
              onLogout={onLogout || (() => {})}
              selectedSheetId={spreadsheetId || ''}
              selectedSheetTitle={sheetTitle}
              onSheetConfigured={(meta, tab) => {
                onSheetConfigured(meta, tab);
                setShowSheetConfig(false);
              }}
            />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SUBMISSIONS TABLE & DOSSIER REGISTRY */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Top Banner / Notification */}
        {downloadSuccessRef && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>PDF Dossier downloaded successfully for {downloadSuccessRef}!</span>
            </div>
            <span className="text-[11px] opacity-80">Generated on the fly</span>
          </div>
        )}

        {/* Table Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
              <span>Client Loan Submissions</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {totalSubmissions} Records
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Submissions automatically synced with Google Sheet tab{' '}
                <code className="font-mono text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded">
                  {sheetTitle}
                </code>
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToForm && (
              <button
                type="button"
                onClick={onNavigateToForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>New Application Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddSampleSubmission}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Test Submission</span>
            </button>

            <button
              type="button"
              onClick={loadSubmissions}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {submissions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Row (only displayed when records exist) */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100 bg-slate-50/50">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Submissions
                </p>
                <p className="text-lg font-extrabold text-gray-900">{totalSubmissions}</p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Requested Volume
                </p>
                <p className="text-lg font-extrabold text-emerald-700">
                  GHS {totalVolume.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Avg Loan Size
                </p>
                <p className="text-lg font-extrabold text-gray-900">
                  GHS {avgLoan.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Approved
                </p>
                <p className="text-lg font-extrabold text-amber-800">
                  {approvedCount} / {totalSubmissions}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar for Staff (Active when there are submissions) */}
        {submissions.length > 0 && (
          <div className="p-4 bg-slate-50/70 border-b border-gray-200/70">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchTerm('');
                  }}
                  placeholder="Filter applications by client name or ID (e.g. Kwame, LN-GH-..., GHA-7...)"
                  className="w-full pl-10 pr-9 py-2.5 text-xs font-medium bg-white text-gray-900 border border-gray-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
                  >
                    <X className="w-4 h-4 bg-gray-100 hover:bg-gray-200 rounded-full p-0.5" />
                  </button>
                )}
              </div>

              {/* Status & results count */}
              <div className="flex items-center gap-2.5 text-xs text-gray-600 self-end md:self-auto">
                {searchTerm ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      <span>Found {filteredSubmissions.length} of {submissions.length}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-2"
                    >
                      Reset filter
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    All {submissions.length} applications loaded
                  </span>
                )}
                <span className="hidden sm:inline text-gray-300">|</span>
                <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
                  Client Name / Reference ID / Ghana Card
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading && submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-sm font-semibold">Reading submissions from registry...</p>
            </div>
          ) : errorMessage && submissions.length === 0 ? (
            <div className="p-8 text-center text-red-600 space-y-2">
              <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          ) : submissions.length > 0 && filteredSubmissions.length === 0 ? (
            /* Search yielded no results */
            <div className="p-12 text-center text-gray-500 space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-base font-bold text-gray-900">No Matching Applications Found</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  No records matched your search query <span className="font-semibold text-gray-800">"{searchTerm}"</span>. You can search by client name, Reference ID (LN-GH-...), Ghana Card number, or employee ID.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search Filter</span>
                </button>
              </div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center text-gray-500 space-y-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-base font-bold text-gray-800">No Submissions Recorded Yet</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Client responses submitted through the loan application web form will appear here and sync to your Google Sheet in real time.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onNavigateToForm && (
                  <button
                    type="button"
                    onClick={onNavigateToForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Go to Application Form</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddSampleSubmission}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Insert Test Application</span>
                </button>
                <a
                  href={directSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open Google Sheet ↗</span>
                </a>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Employer & Role</th>
                  <th className="px-4 py-3 text-right">Requested (GHS)</th>
                  <th className="px-4 py-3">Loan Purpose</th>
                  <th className="px-4 py-3">Disbursement</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center min-w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((loan, idx) => {
                  const formattedDate = loan.submitted_at
                    ? new Date(loan.submitted_at).toLocaleDateString('en-GB')
                    : '';

                  const statusColors = {
                    Approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    Disbursed: 'bg-blue-50 text-blue-800 border-blue-200',
                    'Under Review': 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    'Pending Review': 'bg-amber-50 text-amber-800 border-amber-200',
                    Rejected: 'bg-rose-50 text-rose-800 border-rose-200',
                  };
                  const statusClass =
                    statusColors[loan.status as keyof typeof statusColors] ||
                    'bg-gray-100 text-gray-800 border-gray-200';

                  return (
                    <tr key={loan.reference_id || idx} className="hover:bg-blue-50/40 transition-colors">
                      {/* Reference ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-700 block">
                          {loan.reference_id}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {formattedDate}
                        </span>
                      </td>

                      {/* Applicant Name & ID */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 block">
                          {loan.full_name_on_payslip}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono block">
                          {loan.id_type}: {loan.id_number}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{loan.mobile_phone}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                          {loan.email}
                        </div>
                      </td>

                      {/* Employer */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 truncate max-w-[150px]">
                          {loan.employer}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[150px]">
                          {loan.occupation || 'Employee'} ({loan.region})
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-extrabold text-gray-900 block">
                          GHS {loan.requested_amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {loan.loan_duration_months} Months
                        </span>
                      </td>

                      {/* Loan Purpose */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800 block text-xs truncate max-w-[150px]">
                          {loan.request_type || 'Personal Loan'}
                        </span>
                      </td>

                      {/* Disbursement */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {loan.mode_of_payment}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}
                        >
                          {loan.status}
                        </span>
                      </td>

                      {/* Actions: Staff Review & Submit + Modify + View Submission + Download PDF */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLoanForStaffReview(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
                            title="Staff Review: Review application details and submit decision"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review & Submit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedLoanForStaffReview(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs transition-colors"
                            title="Modify application terms, requested amount, duration, or details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Modify</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedLoanForView(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Submission</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(loan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Confirmation Modal for Clearing Rows */}
        <ConfirmationModal
          isOpen={isClearModalOpen}
          title="Clear Submissions Registry?"
          message={`Are you sure you want to clear all ${submissions.length} submission records? This action removes rows from the in-app log and the connected Google Sheet tab "${sheetTitle}".`}
          details={[
            `Total records to clear: ${submissions.length}`,
            `Target Spreadsheet: ${sheetTitle}`,
          ]}
          confirmText="Confirm Clear"
          cancelText="Cancel"
          isDestructive={true}
          isLoading={isClearing}
          onConfirm={handleConfirmClear}
          onCancel={() => setIsClearModalOpen(false)}
        />

        {/* View Response Modal in PDF Form */}
        <ViewResponseModal
          isOpen={Boolean(selectedLoanForView)}
          loan={selectedLoanForView}
          spreadsheetId={spreadsheetId || undefined}
          onClose={() => setSelectedLoanForView(null)}
        />

        {/* Staff Review & Decision Modal */}
        <StaffReviewModal
          isOpen={Boolean(selectedLoanForStaffReview)}
          loan={selectedLoanForStaffReview}
          spreadsheetId={spreadsheetId || undefined}
          sheetTitle={sheetTitle}
          onClose={() => setSelectedLoanForStaffReview(null)}
          onSubmitDecision={handleSaveStaffDecision}
        />
      </div>
    </div>
  );
}
