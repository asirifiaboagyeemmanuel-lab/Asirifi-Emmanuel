import { LoanApplication } from '../types/loan';
import { formatLoanRow } from './googleSheets';

const STORAGE_KEY = 'loan_applications_registry_v1';

// Seed submissions are kept empty so the submissions view begins completely clean
export const SEED_SUBMISSIONS: LoanApplication[] = [];

// Known dummy seed IDs to clean up from any previous testing
const PREVIOUS_MOCK_IDS = new Set([
  'LN-GH-2026-92841',
  'LN-GH-2026-64192',
  'LN-GH-2026-38102',
]);

export function getLocalSubmissions(): LoanApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out old preloaded mock submissions
    const cleanList = parsed.filter(
      (item) => item && item.reference_id && !PREVIOUS_MOCK_IDS.has(item.reference_id)
    );
    // If we filtered out old mock items, persist the clean list
    if (cleanList.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch (err) {
    console.warn('Error reading local submissions:', err);
    return [];
  }
}

export function saveLocalSubmission(loan: LoanApplication): LoanApplication[] {
  try {
    const current = getLocalSubmissions();
    // Prepend new submission
    const updated = [loan, ...current.filter((item) => item.reference_id !== loan.reference_id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error saving local submission:', err);
    return [loan];
  }
}

export function clearLocalSubmissions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Error clearing local submissions:', err);
  }
}

export function submissionToRowArray(loan: LoanApplication): string[] {
  return formatLoanRow(loan).map((val) => String(val));
}
