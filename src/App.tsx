import { useState } from 'react';
import {
  FileText,
  Table,
} from 'lucide-react';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { LoanApplicationForm } from './components/LoanApplicationForm';
import { SubmissionsTable } from './components/SubmissionsTable';
import { SpreadsheetMetadata } from './services/googleSheets';
import { LoanApplication } from './types/loan';
import { useToast } from './context/ToastContext';

// Default spreadsheet configured by user
const DEFAULT_SPREADSHEET_ID = '1UlKJq-2NaQuoGHrTOm1nWJfXr2IcfzhIZ2FomE-vk1s';
const DEFAULT_SHEET_TITLE = 'Submissions';

export function App() {
  const { user, token, login, logout } = useGoogleAuth();
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState<'form' | 'submissions'>('form');

  // Currently linked spreadsheet information
  const [spreadsheetId, setSpreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [spreadsheetName, setSpreadsheetName] = useState<string>('Loan Applications Submissions');
  const [sheetTitle, setSheetTitle] = useState<string>(DEFAULT_SHEET_TITLE);
  const [sheetUrl, setSheetUrl] = useState<string>(
    `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`
  );

  // Trigger to reload submissions table after new submissions
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState<number>(0);

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
  };

  const handleSheetConfigured = (metadata: SpreadsheetMetadata, chosenTab: string) => {
    setSpreadsheetId(metadata.id);
    setSpreadsheetName(metadata.title);
    setSheetTitle(chosenTab);
    setSheetUrl(metadata.url);
    setSubmissionsRefreshKey((prev) => prev + 1);

    showToast({
      type: 'success',
      title: 'Google Sheet Connected!',
      message: `Successfully linked "${metadata.title}" (Tab: ${chosenTab}).`,
      iconType: 'sheet',
    });
  };

  const handleSubmissionSuccess = (_loan: LoanApplication) => {
    setSubmissionsRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
            {/* Official ILMG GHANA LTD. Logo at the top left corner */}
            <div className="flex items-center">
              <img
                src="/assets/aistudio/Screenshot_2026-11-03_072744-removebg-preview_6e68c173.png"
                alt="ILMG GHANA LTD. Government Employee Loan Experts"
                className="h-9 sm:h-12 md:h-13 w-auto max-w-[170px] sm:max-w-[260px] md:max-w-[320px] object-contain transition-all"
              />
            </div>

            {/* Top Navigation Tabs (Right Side) */}
            <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveView('form')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'form'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Application Form</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('submissions')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'submissions'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>View Submissions</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* View 1: Application Form */}
        {activeView === 'form' && (
          <div className="space-y-8">
            <LoanApplicationForm
              token={token}
              spreadsheetId={spreadsheetId}
              sheetTitle={sheetTitle}
              onSubmissionSuccess={handleSubmissionSuccess}
              onRequestSignIn={handleLogin}
              onViewSubmissions={() => setActiveView('submissions')}
            />
          </div>
        )}

        {/* View 2: View Submissions (Contains the Google Sheet Link Hub at the top) */}
        {activeView === 'submissions' && (
          <div className="space-y-8">
            <SubmissionsTable
              token={token}
              user={user}
              spreadsheetId={spreadsheetId}
              spreadsheetName={spreadsheetName}
              sheetTitle={sheetTitle}
              sheetUrl={sheetUrl}
              refreshTrigger={submissionsRefreshKey}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onSheetConfigured={handleSheetConfigured}
              onNavigateToForm={() => setActiveView('form')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>
            ILMG GHANA LTD. &bull; Government Employee Loan Experts &bull; PDF Dossier Engine
          </p>
          <p className="text-[11px] text-slate-400">
            Powered by Google Sheets API &bull; Verified Digital Loan Records
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
