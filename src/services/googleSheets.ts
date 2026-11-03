import { LoanApplication, SHEET_COLUMNS } from '../types/loan';

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  sheets: { id: number; title: string }[];
  url: string;
}

/**
 * Extracts spreadsheet ID from various formats:
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * - https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 * - 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Regex to match Google Sheet URL patterns
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if it's already an ID
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Fetch spreadsheet metadata: Title, sheet names, sheet IDs.
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets(properties(sheetId,title))`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Failed to access Google Sheet (${res.status} ${res.statusText}). Check your sheet ID and permissions.`
    );
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    id: s.properties?.sheetId ?? 0,
    title: s.properties?.title || 'Sheet1',
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    sheets,
    url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

/**
 * Create a brand new Google Spreadsheet dedicated to Loan Applications.
 */
export async function createLoanSpreadsheet(
  title: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const body = {
    properties: {
      title: title || 'Loan Applications Submissions',
    },
    sheets: [
      {
        properties: {
          title: 'Submissions',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to create spreadsheet (${res.status}).`
    );
  }

  const created = await res.json();
  const spreadsheetId = created.spreadsheetId;
  const sheetTitle = 'Submissions';

  // Populate row 1 with headers
  await setupSheetHeaders(spreadsheetId, sheetTitle, accessToken);

  return {
    id: spreadsheetId,
    title: created.properties?.title || title,
    sheets: [{ id: 0, title: sheetTitle }],
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Ensures headers are present on the sheet and styles them nicely.
 */
export async function setupSheetHeaders(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<void> {
  // 1. Write the headers into row 1
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetTitle
  )}!A1:${String.fromCharCode(64 + SHEET_COLUMNS.length)}1?valueInputOption=USER_ENTERED`;

  const res = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [SHEET_COLUMNS],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 'Failed to initialize sheet header columns.'
    );
  }

  // 2. Format header row: bold, background color, auto-resize columns
  try {
    const meta = await getSpreadsheetDetails(spreadsheetId, accessToken);
    const targetSheet = meta.sheets.find((s) => s.title === sheetTitle) || meta.sheets[0];
    const sheetId = targetSheet?.id ?? 0;

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Format header row with Navy Blue background and White bold text
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: SHEET_COLUMNS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.28, blue: 0.42 }, // Deep navy
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  wrapStrategy: 'WRAP',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
            },
          },
          // Freeze row 1
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Formatting batch update was skipped or failed non-critically:', err);
  }
}

/**
 * Maps a LoanApplication object into the ordered sheet columns
 */
export function formatLoanRow(loan: LoanApplication): (string | number)[] {
  const paymentDetails =
    loan.mode_of_payment === 'Mobile Money'
      ? `${loan.momo_network || 'MoMo'}: ${loan.momo_number || ''}`
      : `${loan.bank_name || 'Bank'} (Acc: ${loan.bank_account_number || ''}, Branch: ${loan.bank_branch || 'N/A'}, Name: ${loan.account_holder_name || ''})`;

  return [
    loan.reference_id,
    new Date(loan.submitted_at).toLocaleString('en-GB'),
    loan.status,
    loan.full_name_on_payslip,
    loan.email,
    loan.mobile_phone,
    loan.id_number,
    loan.id_type,
    loan.date_of_birth,
    loan.gender,
    loan.marital_status,
    loan.gps_address,
    loan.residential_address,
    loan.employer,
    loan.occupation,
    loan.employee_number,
    loan.department,
    loan.region,
    loan.years_with_employer,
    loan.requested_amount,
    loan.loan_duration_months,
    loan.monthly_repayment,
    loan.total_repayment,
    loan.request_type,
    loan.mode_of_payment,
    paymentDetails,
    loan.nok_full_name,
    loan.nok_phone,
    loan.nok_relationship,
    loan.contact_consent ? 'YES' : 'NO',
  ];
}

/**
 * Appends a new loan application submission to the sheet.
 */
export async function appendLoanToSheet(
  spreadsheetId: string,
  sheetTitle: string,
  loan: LoanApplication,
  accessToken: string
): Promise<{ updatedRange: string; updatedRows: number }> {
  // Auto-check if row 1 is empty; if so, populate standard headers first
  try {
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:AD1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (!checkData.values || checkData.values.length === 0 || checkData.values[0].length === 0) {
        await setupSheetHeaders(spreadsheetId, sheetTitle, accessToken);
      }
    }
  } catch (err) {
    console.warn('Auto-header check skipped non-critically:', err);
  }

  const rowValues = formatLoanRow(loan);
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetTitle
  )}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Failed to append row to Google Sheet (${res.status} ${res.statusText}).`
    );
  }

  const result = await res.json();
  return {
    updatedRange: result.updates?.updatedRange || '',
    updatedRows: result.updates?.updatedRows || 1,
  };
}

/**
 * Read all submissions currently recorded in the sheet.
 */
export async function fetchSheetSubmissions(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetTitle
  )}!A1:AD200`;

  const res = await fetch(readUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Failed to read Google Sheet rows (${res.status}).`
    );
  }

  const data = await res.json();
  const values: string[][] = data.values || [];
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headers, ...rows] = values;
  return { headers, rows };
}

/**
 * Clears data rows from the sheet while retaining the header row.
 * NOTE: Destructive operation - caller MUST confirm with user first.
 */
export async function clearSheetRows(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<void> {
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetTitle
  )}!A2:AD5000:clear`;

  const res = await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to clear sheet rows.');
  }
}
