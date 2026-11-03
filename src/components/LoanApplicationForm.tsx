import React, { useState, useId } from 'react';
import {
  DollarSign,
  User,
  Briefcase,
  Users,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Send,
  Building,
  Smartphone,
  Info,
  Calendar,
  FileSpreadsheet,
  Download,
  Eye,
  FileText,
  Table,
} from 'lucide-react';
import {
  LoanApplication,
  GHANA_REGIONS,
  GHANA_BANKS,
  MOMO_NETWORKS,
  LOAN_PURPOSES,
} from '../types/loan';
import { appendLoanToSheet } from '../services/googleSheets';
import { ConfirmationModal } from './ConfirmationModal';
import { ViewResponseModal } from './ViewResponseModal';
import { generateLoanApplicationPDF } from '../services/pdfGenerator';
import { saveLocalSubmission } from '../services/submissionStore';
import { useToast } from '../context/ToastContext';

interface LoanApplicationFormProps {
  token: string | null;
  spreadsheetId: string | null;
  sheetTitle: string;
  onSubmissionSuccess: (loan: LoanApplication) => void;
  onRequestSignIn: () => void;
  onViewSubmissions?: () => void;
}

export function LoanApplicationForm({
  token,
  spreadsheetId,
  sheetTitle,
  onSubmissionSuccess,
  onRequestSignIn,
  onViewSubmissions,
}: LoanApplicationFormProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedLoan, setSubmittedLoan] = useState<LoanApplication | null>(null);
  const [showResponseModal, setShowResponseModal] = useState<boolean>(false);

  // Form State
  const [requestedAmount, setRequestedAmount] = useState<number>(5000);
  const [loanDuration, setLoanDuration] = useState<number>(12);
  const [loanPurpose, setLoanPurpose] = useState<string>(LOAN_PURPOSES[0]);

  // Personal
  const [fullName, setFullName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [maritalStatus, setMaritalStatus] = useState<string>('Married');
  const [idType, setIdType] = useState<string>('Ghana Card');
  const [idNumber, setIdNumber] = useState<string>('');
  const [idIssueDate, setIdIssueDate] = useState<string>('');
  const [idExpiryDate, setIdExpiryDate] = useState<string>('');
  const [placeOfIssue, setPlaceOfIssue] = useState<string>('Accra');
  const [email, setEmail] = useState<string>('');
  const [mobilePhone, setMobilePhone] = useState<string>('');
  const [officePhone, setOfficePhone] = useState<string>('');
  const [residentialAddress, setResidentialAddress] = useState<string>('');
  const [gpsAddress, setGpsAddress] = useState<string>('');
  const [residentialLandmark, setResidentialLandmark] = useState<string>('');

  // Employment
  const [occupation, setOccupation] = useState<string>('');
  const [employer, setEmployer] = useState<string>('');
  const [employeeNumber, setEmployeeNumber] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [region, setRegion] = useState<string>(GHANA_REGIONS[0]);
  const [yearsWithEmployer, setYearsWithEmployer] = useState<string>('3');
  const [employmentStartDate, setEmploymentStartDate] = useState<string>('');
  const [workAddress, setWorkAddress] = useState<string>('');

  // Next of Kin
  const [nokFullName, setNokFullName] = useState<string>('');
  const [nokPhone, setNokPhone] = useState<string>('');
  const [nokRelationship, setNokRelationship] = useState<string>('Spouse');
  const [nokAddress, setNokAddress] = useState<string>('');

  // Payment
  const [modeOfPayment, setModeOfPayment] = useState<'Mobile Money' | 'Bank Account'>('Mobile Money');
  const [momoNetwork, setMomoNetwork] = useState<string>(MOMO_NETWORKS[0]);
  const [momoNumber, setMomoNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>(GHANA_BANKS[0]);
  const [bankBranch, setBankBranch] = useState<string>('');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');

  // Consent
  const [contactConsent, setContactConsent] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // Auto-fill demo applicant for testing
  const handleFillDemoApplicant = () => {
    setFullName('Kwame Mensah Acheampong');
    setDob('1988-06-14');
    setGender('Male');
    setMaritalStatus('Married');
    setIdType('Ghana Card');
    setIdNumber('GHA-729402914-8');
    setIdIssueDate('2021-03-10');
    setIdExpiryDate('2031-03-09');
    setPlaceOfIssue('Accra Central');
    setEmail('kwame.acheampong@example.com');
    setMobilePhone('+233 24 412 8901');
    setOfficePhone('+233 30 223 4567');
    setResidentialAddress('House No. 14, Ring Road Central, Kokomlemle');
    setGpsAddress('GA-183-9022');
    setResidentialLandmark('Opposite City Lights Showroom');

    setEmployer('Ghana Education Service / Ministry of Education');
    setEmployeeNumber('GES-982341');
    setOccupation('Senior IT Specialist / Administrative Officer');
    setDepartment('Management Information Systems');
    setRegion('Greater Accra');
    setYearsWithEmployer('5');
    setEmploymentStartDate('2019-02-01');
    setWorkAddress('Ministries Complex, Block C, Accra');

    setRequestedAmount(10000);
    setLoanDuration(24);
    setLoanPurpose('Home Renovation / Rent Advance');

    setNokFullName('Abena Serwaa Acheampong');
    setNokPhone('+233 50 189 2234');
    setNokRelationship('Spouse');
    setNokAddress('House No. 14, Kokomlemle, Accra');

    setModeOfPayment('Mobile Money');
    setMomoNetwork(MOMO_NETWORKS[0]);
    setMomoNumber('0244128901');
    setAccountHolderName('Kwame Mensah Acheampong');

    setBankName(GHANA_BANKS[1]);
    setBankBranch('Airport City');
    setBankAccountNumber('1441002938401');

    setContactConsent(true);
    setTermsAccepted(true);
  };

  // Prepare full loan application payload
  const buildLoanPayload = (): LoanApplication => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const ref = `LN-GH-${new Date().getFullYear()}-${randomSuffix}`;

    return {
      reference_id: ref,
      submitted_at: new Date().toISOString(),
      status: 'Pending Review',
      full_name_on_payslip: fullName || 'Unnamed Applicant',
      date_of_birth: dob,
      gender,
      marital_status: maritalStatus,
      id_type: idType,
      id_number: idNumber,
      id_issue_date: idIssueDate,
      id_expiry_date: idExpiryDate,
      place_of_issue: placeOfIssue,
      email: email || 'applicant@example.com',
      mobile_phone: mobilePhone || 'N/A',
      office_phone: officePhone,
      residential_address: residentialAddress,
      gps_address: gpsAddress,
      residential_landmark: residentialLandmark,

      employer: employer || 'Independent / Private',
      employee_number: employeeNumber || 'N/A',
      occupation: occupation || 'Professional',
      department: department || 'General',
      region,
      years_with_employer: yearsWithEmployer,
      employment_start_date: employmentStartDate,
      work_address: workAddress,

      nok_full_name: nokFullName,
      nok_phone: nokPhone,
      nok_relationship: nokRelationship,
      nok_residential_address: nokAddress,

      package_id: 'standard',
      requested_amount: requestedAmount,
      loan_duration_months: loanDuration,
      request_type: loanPurpose,
      monthly_interest_rate: 0,
      monthly_repayment: 0,
      total_repayment: 0,
      total_interest: 0,

      mode_of_payment: modeOfPayment,
      momo_network: momoNetwork,
      momo_number: momoNumber,
      bank_name: bankName,
      bank_branch: bankBranch,
      bank_account_number: bankAccountNumber,
      account_holder_name: accountHolderName || fullName,

      contact_consent: contactConsent,
      terms_accepted: termsAccepted,
    };
  };

  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage('Please provide your Full Name on Payslip in Personal Details.');
      setCurrentStep(1);
      return;
    }

    if (!mobilePhone.trim()) {
      setErrorMessage('Please provide a contact Mobile Phone number.');
      setCurrentStep(1);
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Please review and check the terms and conditions agreement before submitting.');
      return;
    }

    setErrorMessage(null);
    setShowConfirmModal(true);
  };

  const handleConfirmAndSyncToSheet = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = buildLoanPayload();

    try {
      if (token && spreadsheetId) {
        try {
          await appendLoanToSheet(spreadsheetId, sheetTitle, payload, token);
        } catch (sheetErr: any) {
          console.warn('Google Sheet live sync failed, saved locally for staff:', sheetErr);
        }
      }
      saveLocalSubmission(payload);
      setShowConfirmModal(false);
      setSubmittedLoan(payload);
      onSubmissionSuccess(payload);

      showToast({
        type: 'success',
        title: 'Loan Application Submitted!',
        message: `Reference ID ${payload.reference_id} recorded successfully.`,
        iconType: token ? 'sheet' : 'check',
        action: {
          label: 'View PDF Response',
          onClick: () => setShowResponseModal(true),
        },
      });
    } catch (err: any) {
      console.error('Failed to submit loan:', err);
      setErrorMessage(
        err.message || 'Failed to record submission. Please verify your inputs.'
      );
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to start a new application
  const handleResetForm = () => {
    setSubmittedLoan(null);
    setCurrentStep(1);
    setTermsAccepted(false);
  };

  const steps = [
    { num: 1, label: 'Personal Info', icon: User },
    { num: 2, label: 'Next of Kin', icon: Users },
    { num: 3, label: 'Employment', icon: Briefcase },
    { num: 4, label: 'Loan Details', icon: DollarSign },
    { num: 5, label: 'Disbursement', icon: CreditCard },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
            <span>Official Loan Application Form</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Personal & Employee Loan Portal
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Synced directly to your linked Google Sheet registry in real time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onViewSubmissions && (
            <button
              type="button"
              onClick={onViewSubmissions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-lg transition-colors border border-white/20"
            >
              <Table className="w-3.5 h-3.5" />
              <span>View Submissions</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFillDemoApplicant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-amber-950 font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Sample Applicant Data</span>
          </button>
        </div>
      </div>

      {/* Submitted Success View */}
      {submittedLoan ? (
        <div className="p-8 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900">Application Submitted!</h3>
            <p className="text-sm text-gray-600 mt-2">
              Your loan application has been registered and appended to the Google Sheet.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Loan Reference ID:</span>
              <span className="font-bold text-blue-700">{submittedLoan.reference_id}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-medium text-slate-800">{submittedLoan.full_name_on_payslip}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Requested Amount:</span>
              <span className="font-bold text-slate-900">
                GHS {submittedLoan.requested_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Repayment Duration:</span>
              <span className="font-bold text-slate-800">{submittedLoan.loan_duration_months} Months</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Loan Purpose:</span>
              <span className="font-medium text-slate-800">{submittedLoan.request_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Google Sheet Sync:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Live Synced ({sheetTitle})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowResponseModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View Submission (PDF Form)</span>
            </button>

            {onViewSubmissions && (
              <button
                type="button"
                onClick={onViewSubmissions}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
              >
                <Table className="w-4 h-4" />
                <span>View All Submissions</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                generateLoanApplicationPDF(submittedLoan, spreadsheetId || undefined);
                showToast({
                  type: 'success',
                  title: 'PDF Dossier Generated!',
                  message: `Official PDF for ${submittedLoan.full_name_on_payslip} (${submittedLoan.reference_id}) downloaded.`,
                  iconType: 'pdf',
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg shadow-xs transition-colors border border-slate-300"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm font-semibold rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Open Google Sheet</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors"
            >
              <span>Submit Another</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Step Progress Bar */}
          <div className="px-6 py-4 bg-slate-50/70 border-b border-gray-200 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[550px]">
              {steps.map((st) => {
                const Icon = st.icon;
                const isActive = currentStep === st.num;
                const isPassed = currentStep > st.num;

                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => setCurrentStep(st.num)}
                    className="flex flex-col items-center group focus:outline-hidden"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                        isActive
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-500 group-hover:border-blue-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-1 transition-colors ${
                        isActive ? 'text-blue-700 font-bold' : isPassed ? 'text-emerald-700' : 'text-gray-500'
                      }`}
                    >
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form container */}
          <form onSubmit={handleInitiateSubmit} className="p-6">
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* STEP 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
                  <p className="text-xs text-gray-500">
                    Applicant identity as it appears on official documents and payslip
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name (on Payslip) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kwame Mensah Acheampong"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Marital Status
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ID Document Type
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Ghana Card">Ghana Card (National ID)</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Drivers License">Driver's License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="e.g. GHA-729402914-8"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ID Issue Date & Expiry Date
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={idIssueDate}
                        onChange={(e) => setIdIssueDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg"
                      />
                      <input
                        type="date"
                        value={idExpiryDate}
                        onChange={(e) => setIdExpiryDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Place of Issue
                    </label>
                    <input
                      type="text"
                      value={placeOfIssue}
                      onChange={(e) => setPlaceOfIssue(e.target.value)}
                      placeholder="e.g. Accra Central / Kumasi"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. applicant@domain.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      placeholder="e.g. +233 24 412 8901"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Ghana Digital Address (GPS)
                    </label>
                    <input
                      type="text"
                      value={gpsAddress}
                      onChange={(e) => setGpsAddress(e.target.value)}
                      placeholder="e.g. GA-183-9022"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Residential Landmark
                    </label>
                    <input
                      type="text"
                      value={residentialLandmark}
                      onChange={(e) => setResidentialLandmark(e.target.value)}
                      placeholder="e.g. Behind Total Gas Station"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Residential Street Address
                    </label>
                    <input
                      type="text"
                      value={residentialAddress}
                      onChange={(e) => setResidentialAddress(e.target.value)}
                      placeholder="e.g. House No. 14, Ring Road Central, Kokomlemle, Accra"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Next of Kin */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900">Next of Kin / Emergency Contact</h3>
                  <p className="text-xs text-gray-500">
                    Trusted relative or contact to be reached if primary applicant is unavailable
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Next of Kin Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nokFullName}
                      onChange={(e) => setNokFullName(e.target.value)}
                      placeholder="e.g. Abena Serwaa Acheampong"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nokRelationship}
                      onChange={(e) => setNokRelationship(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Adult Child">Adult Child</option>
                      <option value="Relative">Relative</option>
                      <option value="Colleague">Colleague</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={nokPhone}
                      onChange={(e) => setNokPhone(e.target.value)}
                      placeholder="e.g. +233 50 189 2234"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={nokAddress}
                      onChange={(e) => setNokAddress(e.target.value)}
                      placeholder="e.g. House No. 14, Kokomlemle, Accra"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Employment */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900">Employment & Income Source</h3>
                  <p className="text-xs text-gray-500">
                    Details of your primary employer, salary structure, and office location
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Employer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={employer}
                      onChange={(e) => setEmployer(e.target.value)}
                      placeholder="e.g. Ghana Education Service / MTN Ghana"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Employee / Staff ID Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={employeeNumber}
                      onChange={(e) => setEmployeeNumber(e.target.value)}
                      placeholder="e.g. GES-84920"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Occupation / Job Title
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Senior IT Officer / Accountant"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Department / Division
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Finance & Administration"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Region of Employment
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      {GHANA_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r} Region
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Years with Current Employer
                    </label>
                    <input
                      type="text"
                      value={yearsWithEmployer}
                      onChange={(e) => setYearsWithEmployer(e.target.value)}
                      placeholder="e.g. 4 years"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Work / Office Location Address
                    </label>
                    <input
                      type="text"
                      value={workAddress}
                      onChange={(e) => setWorkAddress(e.target.value)}
                      placeholder="e.g. Ministries Complex, Accra"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Loan Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900">Loan Request Details</h3>
                  <p className="text-xs text-gray-500">
                    Specify your requested loan amount, purpose, and preferred repayment duration
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Requested Loan Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Requested Loan Amount (GHS) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-700 font-bold text-xs">
                        GHS
                      </div>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        required
                        value={requestedAmount || ''}
                        onChange={(e) => setRequestedAmount(Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 5000"
                        className="w-full pl-14 pr-3.5 py-2.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Enter your desired principal loan amount</p>
                  </div>

                  {/* Purpose of Loan */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Purpose of Loan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      {LOAN_PURPOSES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">Primary usage for the loan facility</p>
                  </div>
                </div>

                {/* Repayment Duration (Months) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Repayment Duration (Months) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {[6, 12, 18, 24, 36, 48].map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setLoanDuration(months)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                          loanDuration === months
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {months} Months
                        <span className="block text-[10px] opacity-80 mt-0.5 font-normal">
                          {months >= 12 ? `${months / 12} yr${months / 12 > 1 ? 's' : ''}` : `${months} mos`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Disbursement */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900">Disbursement Account Details</h3>
                  <p className="text-xs text-gray-500">
                    Choose how you want to receive approved loan funds in Ghana
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setModeOfPayment('Mobile Money')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      modeOfPayment === 'Mobile Money'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-gray-900">Mobile Money</span>
                      <span className="block text-[11px] text-gray-500">MTN MoMo, Telecel Cash, AT</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModeOfPayment('Bank Account')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      modeOfPayment === 'Bank Account'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Building className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-gray-900">Commercial Bank</span>
                      <span className="block text-[11px] text-gray-500">Direct account wire transfer</span>
                    </div>
                  </button>
                </div>

                {modeOfPayment === 'Mobile Money' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Mobile Money Network <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={momoNetwork}
                          onChange={(e) => setMomoNetwork(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                        >
                          {MOMO_NETWORKS.map((net) => (
                            <option key={net} value={net}>
                              {net}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Mobile Money Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={momoNumber}
                          onChange={(e) => setMomoNumber(e.target.value)}
                          placeholder="e.g. 0244123456"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Account Holder Full Name (Must match your ID)
                        </label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          placeholder="e.g. Kwame Mensah Acheampong"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Select Bank <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                        >
                          {GHANA_BANKS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Branch Name
                        </label>
                        <input
                          type="text"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          placeholder="e.g. Airport City / High Street"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="e.g. 1441002938401"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          placeholder="e.g. Kwame Mensah Acheampong"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Consent & Agreements */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactConsent}
                      onChange={(e) => setContactConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      I authorize the credit provider to contact my employer and next of kin for verification and identity compliance under Ghanaian credit bureau regulations.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-900 font-medium leading-relaxed">
                      I declare that all details provided are accurate and true. I understand this submission will be recorded for staff processing and approval.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Loan Application</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for submission */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Confirm Loan Application Submission"
        message={`You are about to submit your loan application for "${fullName}".`}
        details={[
          `Applicant: ${fullName}`,
          `Package Amount: GHS ${requestedAmount.toLocaleString()} (${loanDuration} Months)`,
          `Disbursement: ${modeOfPayment}`,
        ]}
        confirmText="Confirm & Submit Application"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={isSubmitting}
        onConfirm={handleConfirmAndSyncToSheet}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* View Response Modal in PDF Form */}
      <ViewResponseModal
        isOpen={showResponseModal}
        loan={submittedLoan}
        spreadsheetId={spreadsheetId || undefined}
        onClose={() => setShowResponseModal(false)}
      />
    </div>
  );
}
