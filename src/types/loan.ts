export interface LoanPackage {
  id: string;
  label: string;
  amount: number;
  durations: number[]; // in months
  rateMonthly: number; // e.g. 0.05 for 5%
  badgeColor?: string;
}

export const PRESET_LOAN_PACKAGES: LoanPackage[] = [
  { id: 'p1', label: 'Starter', amount: 1000, durations: [1, 3, 6, 12], rateMonthly: 0.05, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'p2', label: 'Bronze', amount: 2000, durations: [3, 6, 12, 18, 24], rateMonthly: 0.05, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'p3', label: 'Silver', amount: 3000, durations: [3, 6, 12, 18, 24, 36], rateMonthly: 0.045, badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'p4', label: 'Gold', amount: 5000, durations: [6, 12, 18, 24, 36, 48], rateMonthly: 0.04, badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'p5', label: 'Platinum', amount: 10000, durations: [6, 12, 18, 24, 36, 48, 60], rateMonthly: 0.038, badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { id: 'p6', label: 'Diamond', amount: 15000, durations: [12, 18, 24, 36, 48, 60], rateMonthly: 0.035, badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'p7', label: 'Premier', amount: 20000, durations: [12, 18, 24, 36, 48, 72], rateMonthly: 0.033, badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'p8', label: 'Elite', amount: 30000, durations: [12, 24, 36, 48, 60, 72], rateMonthly: 0.03, badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'p9', label: 'Executive', amount: 50000, durations: [12, 24, 36, 48, 60, 72], rateMonthly: 0.028, badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
];

export interface LoanApplication {
  reference_id: string;
  submitted_at: string;
  status: 'Pending Review' | 'Under Review' | 'Approved' | 'Disbursed' | 'Rejected';

  // Personal Information
  full_name_on_payslip: string;
  date_of_birth: string;
  marital_status: string;
  gender: string;
  id_type: string;
  id_number: string;
  id_issue_date: string;
  id_expiry_date: string;
  place_of_issue: string;
  email: string;
  mobile_phone: string;
  office_phone?: string;
  home_phone?: string;
  residential_address: string;
  gps_address: string;
  residential_landmark?: string;

  // Next of Kin
  nok_full_name: string;
  nok_phone: string;
  nok_relationship: string;
  nok_residential_address: string;
  nok_residential_landmark?: string;
  nok_work_address?: string;
  nok_email?: string;

  // Employment
  occupation: string;
  employer: string;
  employee_number: string;
  department: string;
  region: string;
  years_with_employer: string;
  employment_start_date: string;
  work_address?: string;
  work_landmark?: string;

  // Loan Request & Calculations
  package_id?: string;
  request_type: string;
  requested_amount: number;
  loan_duration_months: number;
  monthly_interest_rate: number;
  monthly_repayment: number;
  total_repayment: number;
  total_interest: number;

  // Disbursement / Banking
  mode_of_payment: 'Mobile Money' | 'Bank Account';
  momo_network?: string;
  momo_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  account_holder_name?: string;

  // Verification & Consent
  contact_consent: boolean;
  terms_accepted: boolean;
  notes?: string;
}

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North',
];

export const GHANA_BANKS = [
  'GCB Bank Limited',
  'Ecobank Ghana',
  'Absa Bank Ghana',
  'Fidelity Bank Ghana',
  'Stanbic Bank Ghana',
  'CalBank',
  'Standard Chartered Bank',
  'Zenith Bank Ghana',
  'Access Bank Ghana',
  'United Bank for Africa (UBA)',
  'Republic Bank Ghana',
  'Societe Generale Ghana',
  'Prudential Bank',
  'Consolidated Bank Ghana (CBG)',
  'FBNBank Ghana',
  'Agricultural Development Bank (ADB)',
  'First National Bank Ghana',
  'National Investment Bank (NIB)',
  'Other Bank',
];

export const MOMO_NETWORKS = [
  'MTN Mobile Money (MoMo)',
  'Telecel Cash (formerly Vodafone Cash)',
  'ATMoney (AirtelTigo Money)',
];

export const LOAN_PURPOSES = [
  'Personal & Family Expense',
  'Salary Advance / Bridge Loan',
  'Business Expansion & Inventory',
  'School Fees / Education',
  'Medical & Emergency Care',
  'Home Renovation / Rent Advance',
  'Vehicle Purchase / Repairs',
  'Agricultural Input / Farm Operations',
];

export const SHEET_COLUMNS = [
  'Reference ID',
  'Timestamp',
  'Status',
  'Applicant Full Name',
  'Email',
  'Mobile Phone',
  'Ghana Card / ID Number',
  'ID Type',
  'Date of Birth',
  'Gender',
  'Marital Status',
  'GPS Digital Address',
  'Residential Address',
  'Employer',
  'Occupation',
  'Staff / Employee No',
  'Department',
  'Region',
  'Years with Employer',
  'Loan Amount (GHS)',
  'Duration (Months)',
  'Monthly Repayment (GHS)',
  'Total Repayment (GHS)',
  'Loan Purpose',
  'Disbursement Mode',
  'Payment Details (Bank/MoMo)',
  'Next of Kin Name',
  'Next of Kin Phone',
  'Next of Kin Relation',
  'Consent Confirmed',
];
