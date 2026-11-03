import { jsPDF } from 'jspdf';
import { LoanApplication } from '../types/loan';

/**
 * Builds the official jsPDF document instance with all formatted client application data.
 */
export function buildLoanApplicationPDFDoc(
  loan: LoanApplication,
  spreadsheetId?: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // --- Header Banner ---
  doc.setFillColor(15, 42, 74); // Deep Navy Blue
  doc.rect(margin, y, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ILMG GHANA LTD. - OFFICIAL LOAN DOSSIER', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 220, 245);
  doc.text(
    'Government Employee Loan Experts | Google Sheets Registry Record',
    margin + 6,
    y + 16
  );

  y += 28;

  // --- Reference & Status Meta Bar ---
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(218, 225, 233);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(70, 80, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REFERENCE ID:', margin + 4, y + 6);
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 75, 160);
  doc.text(loan.reference_id || 'N/A', margin + 30, y + 6);

  doc.setTextColor(70, 80, 95);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SUBMITTED AT:', margin + 85, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const formattedDate = loan.submitted_at
    ? new Date(loan.submitted_at).toLocaleString('en-GB')
    : new Date().toLocaleString('en-GB');
  doc.text(formattedDate, margin + 112, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 80, 95);
  doc.text('STATUS:', margin + 4, y + 11);
  doc.setTextColor(16, 120, 70); // Green
  doc.text((loan.status || 'Pending Review').toUpperCase(), margin + 30, y + 11);

  doc.setTextColor(70, 80, 95);
  doc.text('DISBURSEMENT:', margin + 85, y + 11);
  doc.setTextColor(16, 120, 70);
  doc.text(loan.mode_of_payment || 'Direct Transfer', margin + 112, y + 11);

  y += 19;

  // Helper function to draw section title
  const drawSectionHeader = (title: string, iconNumber: string) => {
    doc.setFillColor(235, 242, 250);
    doc.setDrawColor(180, 205, 230);
    doc.rect(margin, y, contentWidth, 6.5, 'FD');

    doc.setFillColor(15, 75, 160);
    doc.circle(margin + 4, y + 3.25, 2.2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(iconNumber, margin + 3.2, y + 4.1);

    doc.setTextColor(15, 42, 74);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, margin + 8, y + 4.5);
    y += 9;
  };

  // Helper function to draw key-value table grid
  const drawGrid = (rows: [string, string, string, string][]) => {
    const col1W = 38;
    const col2W = 52;
    const col3W = 38;
    const col4W = 54;
    const rowH = 6;

    doc.setFontSize(8);

    rows.forEach((r, idx) => {
      // Row zebra background
      if (idx % 2 === 0) {
        doc.setFillColor(252, 253, 254);
        doc.rect(margin, y, contentWidth, rowH, 'F');
      }

      doc.setDrawColor(230, 235, 242);
      doc.line(margin, y + rowH, margin + contentWidth, y + rowH);

      // Col 1 Key
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 100, 115);
      doc.text(r[0], margin + 2, y + 4.2);

      // Col 2 Value
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 25, 35);
      const val1 = String(r[1] || '—');
      doc.text(val1.length > 28 ? val1.substring(0, 28) + '...' : val1, margin + col1W, y + 4.2);

      // Col 3 Key
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 100, 115);
      doc.text(r[2], margin + col1W + col2W + 2, y + 4.2);

      // Col 4 Value
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 25, 35);
      const val2 = String(r[3] || '—');
      doc.text(val2.length > 28 ? val2.substring(0, 28) + '...' : val2, margin + col1W + col2W + col3W, y + 4.2);

      y += rowH;
    });

    y += 3;
  };

  // --- Section 1: Personal Details ---
  drawSectionHeader('1. PERSONAL & IDENTITY INFORMATION', '1');
  drawGrid([
    ['Full Name (Payslip):', loan.full_name_on_payslip || '—', 'Date of Birth:', loan.date_of_birth || '—'],
    ['Gender / Status:', `${loan.gender || '—'} / ${loan.marital_status || '—'}`, 'ID Type & Number:', `${loan.id_type || 'ID'}: ${loan.id_number || '—'}`],
    ['ID Expiry Date:', loan.id_expiry_date || '—', 'Place of Issue:', loan.place_of_issue || '—'],
    ['Mobile Phone:', loan.mobile_phone || '—', 'Email Address:', loan.email || '—'],
    ['Digital Address (GPS):', loan.gps_address || '—', 'Residential Landmark:', loan.residential_landmark || '—'],
    ['Residential Address:', loan.residential_address || '—', 'Alternate Phone:', loan.office_phone || loan.home_phone || 'None'],
  ]);

  // --- Section 2: Employment Details ---
  drawSectionHeader('2. EMPLOYMENT & SALARY DETAILS', '2');
  drawGrid([
    ['Employer Name:', loan.employer || '—', 'Staff / Employee ID:', loan.employee_number || '—'],
    ['Occupation / Role:', loan.occupation || '—', 'Department:', loan.department || '—'],
    ['Region:', loan.region || '—', 'Tenure with Employer:', loan.years_with_employer || '—'],
    ['Workplace Address:', loan.work_address || '—', 'Employment Start:', loan.employment_start_date || '—'],
  ]);

  // --- Section 3: Loan Request Details ---
  drawSectionHeader('3. LOAN AMOUNT & REPAYMENT PERIOD', '3');
  
  // Highlight box for loan request
  doc.setFillColor(240, 246, 255);
  doc.setDrawColor(190, 215, 250);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setTextColor(15, 75, 160);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REQUESTED LOAN AMOUNT', margin + 6, y + 5);
  doc.setFontSize(13);
  doc.setTextColor(10, 40, 100);
  doc.text(`GHS ${(loan.requested_amount || 0).toLocaleString()}`, margin + 6, y + 11.5);

  doc.setFontSize(8);
  doc.setTextColor(15, 75, 160);
  doc.text('REPAYMENT TENURE', margin + 75, y + 5);
  doc.setFontSize(12);
  doc.setTextColor(10, 40, 100);
  doc.text(`${loan.loan_duration_months || 12} Months`, margin + 75, y + 11.5);

  doc.setFontSize(8);
  doc.setTextColor(15, 75, 160);
  doc.text('PURPOSE OF LOAN', margin + 130, y + 5);
  doc.setFontSize(9.5);
  doc.setTextColor(10, 40, 100);
  const truncatedPurpose = (loan.request_type || 'Personal Loan').length > 25 
    ? (loan.request_type || 'Personal Loan').substring(0, 23) + '...'
    : (loan.request_type || 'Personal Loan');
  doc.text(truncatedPurpose, margin + 130, y + 11.5);

  y += 20;

  drawGrid([
    ['Requested Loan Amount:', `GHS ${(loan.requested_amount || 0).toLocaleString()}`, 'Repayment Tenure:', `${loan.loan_duration_months || 12} Months`],
    ['Purpose of Loan:', loan.request_type || 'Personal Loan', 'Application Status:', loan.status || 'Pending Review'],
  ]);

  // --- Section 4: Disbursement & Next of Kin ---
  drawSectionHeader('4. DISBURSEMENT & EMERGENCY CONTACT', '4');
  const disburseDetails =
    loan.mode_of_payment === 'Mobile Money'
      ? `${loan.momo_network || 'MoMo'}: ${loan.momo_number || ''}`
      : `${loan.bank_name || 'Bank'} (Acc: ${loan.bank_account_number || ''}, Branch: ${loan.bank_branch || 'N/A'})`;

  drawGrid([
    ['Disbursement Channel:', loan.mode_of_payment || 'Mobile Money', 'Payment Target Details:', disburseDetails],
    ['Account Holder Name:', loan.account_holder_name || loan.full_name_on_payslip || '—', 'Next of Kin Name:', loan.nok_full_name || '—'],
    ['NOK Relationship:', loan.nok_relationship || '—', 'NOK Phone Number:', loan.nok_phone || '—'],
    ['NOK Residential Addr:', loan.nok_residential_address || '—', 'Contact Consent Given:', loan.contact_consent ? 'YES (Authorized)' : 'NO'],
  ]);

  // --- Section 5: Legal Declarations & Signatures ---
  y += 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 70, 85);
  doc.text('APPLICANT DECLARATION & DIGITAL VERIFICATION:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 110, 125);
  doc.text(
    'I certify that all statements made in this application are correct, accurate, and complete.',
    margin + 4,
    y + 9
  );
  doc.text(
    'I authorize the lender to verify this information, contact my employer and next of kin, and submit details to credit reference agencies in Ghana.',
    margin + 4,
    y + 12.5
  );

  // Digital Signatures lines
  doc.setDrawColor(180, 190, 205);
  doc.line(margin + 6, y + 20, margin + 70, y + 20);
  doc.line(margin + 105, y + 20, margin + 170, y + 20);

  doc.setFontSize(6.5);
  doc.setFont('courier', 'bold');
  doc.setTextColor(30, 60, 120);
  doc.text(`Digital Sign: ${loan.full_name_on_payslip || 'Applicant'}`, margin + 6, y + 18.5);
  doc.text(`Timestamp: ${formattedDate}`, margin + 105, y + 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 120, 135);
  doc.text('Applicant Digital Acceptance', margin + 6, y + 22.5);
  doc.text('System Certified Timestamp', margin + 105, y + 22.5);

  // --- Footer ---
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 165);
  doc.setFont('helvetica', 'normal');
  const footerText = `Form Generated by Loan App Hub | Linked to Google Sheet ID: ${
    spreadsheetId || '1UlKJq-2NaQuoGHrTOm1nWJfXr2IcfzhIZ2FomE-vk1s'
  } | Verified Digital Record | Confidential`;
  doc.text(footerText, margin, pageHeight - 6);
  doc.text(`Page 1 of 1`, pageWidth - margin - 15, pageHeight - 6);

  return doc;
}

/**
 * Generates and downloads the official Loan Application PDF file.
 */
export function generateLoanApplicationPDF(loan: LoanApplication, spreadsheetId?: string): void {
  const doc = buildLoanApplicationPDFDoc(loan, spreadsheetId);
  const filename = `Loan_Application_${loan.reference_id || 'Document'}.pdf`;
  doc.save(filename);
}

/**
 * Generates a Blob Object URL to open or embed the PDF document directly in the browser.
 */
export function generateLoanApplicationPDFUrl(loan: LoanApplication, spreadsheetId?: string): string {
  const doc = buildLoanApplicationPDFDoc(loan, spreadsheetId);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Converts a raw sheet row array into a LoanApplication object
 */
export function rowToLoanApplication(row: string[], headers?: string[]): LoanApplication {
  const ref = row[0] || 'LN-RECORD';
  const timestamp = row[1] || new Date().toISOString();
  const status = (row[2] as any) || 'Pending Review';
  const fullName = row[3] || '';
  const email = row[4] || '';
  const mobile = row[5] || '';
  const idNumber = row[6] || '';
  const idType = row[7] || 'Ghana Card';
  const dob = row[8] || '';
  const gender = row[9] || 'Male';
  const marital = row[10] || 'Single';
  const gps = row[11] || '';
  const address = row[12] || '';
  const employer = row[13] || '';
  const occupation = row[14] || '';
  const empNo = row[15] || '';
  const dept = row[16] || '';
  const region = row[17] || 'Greater Accra';
  const years = row[18] || '';
  const amount = parseFloat(String(row[19] || '0').replace(/[^0-9.]/g, '')) || 0;
  const duration = parseInt(String(row[20] || '12'), 10) || 12;
  const monthly = parseFloat(String(row[21] || '0').replace(/[^0-9.]/g, '')) || 0;
  const total = parseFloat(String(row[22] || '0').replace(/[^0-9.]/g, '')) || 0;
  const purpose = row[23] || 'Personal Loan';
  const disburseMode = (row[24] as any) || 'Mobile Money';
  const paymentDetails = row[25] || '';
  const nokName = row[26] || '';
  const nokPhone = row[27] || '';
  const nokRel = row[28] || '';
  const consent = String(row[29]).toUpperCase() === 'YES';

  return {
    reference_id: ref,
    submitted_at: timestamp,
    status,
    full_name_on_payslip: fullName,
    email,
    mobile_phone: mobile,
    id_number: idNumber,
    id_type: idType,
    date_of_birth: dob,
    gender,
    marital_status: marital,
    gps_address: gps,
    residential_address: address,
    place_of_issue: 'Ghana',
    id_issue_date: '',
    id_expiry_date: '',
    employer,
    occupation,
    employee_number: empNo,
    department: dept,
    region,
    years_with_employer: years,
    employment_start_date: '',
    requested_amount: amount,
    loan_duration_months: duration,
    monthly_repayment: monthly,
    total_repayment: total,
    total_interest: total > amount ? total - amount : 0,
    monthly_interest_rate: 0.04,
    request_type: purpose,
    mode_of_payment: disburseMode === 'Bank Account' ? 'Bank Account' : 'Mobile Money',
    momo_number: paymentDetails,
    bank_name: paymentDetails,
    bank_account_number: paymentDetails,
    account_holder_name: fullName,
    nok_full_name: nokName,
    nok_phone: nokPhone,
    nok_relationship: nokRel,
    nok_residential_address: '',
    contact_consent: consent,
    terms_accepted: true,
  };
}
