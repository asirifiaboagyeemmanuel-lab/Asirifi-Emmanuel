import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  extractSpreadsheetId,
  getSpreadsheetDetails,
  createLoanSpreadsheet,
  setupSheetHeaders,
  SpreadsheetMetadata,
} from '../services/googleSheets';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SheetManagerProps {
  user: any;
  token: string | null;
  onLogin: () => void;
  onLogout: () => void;
  selectedSheetId: string;
  selectedSheetTitle: string;
  onSheetConfigured: (metadata: SpreadsheetMetadata, sheetTitle: string) => void;
}

export function SheetManager({
  user,
  token,
  onLogin,
  onLogout,
  selectedSheetId,
  selectedSheetTitle,
  onSheetConfigured,
}: SheetManagerProps) {
  const [inputUrlOrId, setInputUrlOrId] = useState(selectedSheetId || '');
  const [sheetMetadata, setSheetMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [activeTab, setActiveTab] = useState(selectedSheetTitle || 'Submissions');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-connect if initial sheet ID is provided and token is available
  useEffect(() => {
    if (token && selectedSheetId && !sheetMetadata) {
      loadSheet(selectedSheetId);
    }
  }, [token, selectedSheetId]);

  const loadSheet = async (idOrUrl: string) => {
    if (!token) {
      setErrorMessage('Please sign in with Google first.');
      return;
    }
    const extractedId = extractSpreadsheetId(idOrUrl);
    if (!extractedId) {
      setErrorMessage(
        'Invalid Google Sheet link or ID. Please paste a valid URL like https://docs.google.com/spreadsheets/d/.../edit or the spreadsheet ID.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const meta = await getSpreadsheetDetails(extractedId, token);
      setSheetMetadata(meta);
      const chosenTab =
        meta.sheets.find((s) => s.title.toLowerCase().includes('submission'))?.title ||
        meta.sheets[0]?.title ||
        'Sheet1';
      setActiveTab(chosenTab);
      onSheetConfigured(meta, chosenTab);
      setSuccessMessage(`Successfully connected to "${meta.title}"!`);
    } catch (err: any) {
      console.error('Error loading sheet:', err);
      setErrorMessage(
        err.message ||
          'Could not load spreadsheet. Ensure you have read/write access and the ID is correct.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!token) {
      setErrorMessage('Please sign in with Google first.');
      return;
    }

    setIsCreatingNew(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const defaultTitle = `Loan Applications Registry (${new Date().getFullYear()})`;
      const created = await createLoanSpreadsheet(defaultTitle, token);
      setSheetMetadata(created);
      setInputUrlOrId(created.id);
      setActiveTab('Submissions');
      onSheetConfigured(created, 'Submissions');
      setSuccessMessage(`Created and formatted brand new sheet: "${created.title}"!`);
    } catch (err: any) {
      console.error('Error creating sheet:', err);
      setErrorMessage(err.message || 'Failed to create new spreadsheet.');
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleSetupHeaders = async () => {
    if (!token || !sheetMetadata) return;

    setIsFormatting(true);
    setErrorMessage(null);
    try {
      await setupSheetHeaders(sheetMetadata.id, activeTab, token);
      setSuccessMessage(`Headers and formatting successfully applied to tab "${activeTab}"!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to set up headers on sheet.');
    } finally {
      setIsFormatting(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (sheetMetadata) {
      onSheetConfigured(sheetMetadata, newTab);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              Google Sheets Link & Sync Engine
              {sheetMetadata && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Linked
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300">
              Direct connection for loan applications from web form to Google Sheets
            </p>
          </div>
        </div>

        {/* Auth status */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center uppercase">
                {user.email ? user.email[0] : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-white">{user.displayName || 'Authorized User'}</p>
                <p className="text-[10px] text-slate-300 truncate max-w-[150px]">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-slate-300 hover:text-white underline ml-1"
              >
                Sign out
              </button>
            </div>
          ) : (
            <GoogleSignInButton onClick={onLogin} size="sm" label="Sign in with Google" />
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        {!token ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">
                Google Sheets Permission Required
              </h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                To sync loan application submissions into your Google Sheet, sign in with your Google Account. This grants the app permission to append incoming submissions directly to your spreadsheets.
              </p>
              <div className="mt-3">
                <GoogleSignInButton onClick={onLogin} label="Authorize with Google Account" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Input & Action Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Target Google Sheet URL or Spreadsheet ID
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputUrlOrId}
                      onChange={(e) => setInputUrlOrId(e.target.value)}
                      placeholder="e.g. https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                      className="w-full pl-3 pr-10 py-2.5 text-sm bg-gray-50/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-mono"
                    />
                    {inputUrlOrId && (
                      <button
                        type="button"
                        onClick={() => setInputUrlOrId('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => loadSheet(inputUrlOrId)}
                    disabled={isLoading || !inputUrlOrId.trim()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Connect Sheet
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isCreatingNew}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCreatingNew ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    Create New Sheet
                  </button>
                </div>
                <div className="mt-2.5 p-3 bg-blue-50/60 border border-blue-200/70 rounded-lg text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Don't have a spreadsheet yet? Click <strong>Create New Sheet</strong> to automatically create and format "Loan Applications Registry (2026)" in your Google Drive.
                    </span>
                  </div>
                  {!sheetMetadata && (
                    <button
                      type="button"
                      onClick={handleCreateNewSheet}
                      disabled={isCreatingNew}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-2xs whitespace-nowrap self-start sm:self-auto"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Create One-Click Sheet</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status alerts */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Connection Notice</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="flex-1 font-medium">{successMessage}</p>
                </div>
              )}

              {/* Connected Sheet Details Card */}
              {sheetMetadata && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {sheetMetadata.title}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          ID: {sheetMetadata.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={sheetMetadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs"
                      >
                        <span>Open in Google Sheets</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={handleSetupHeaders}
                        disabled={isFormatting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        {isFormatting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>Format Headers & Columns</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab Selector & Column Structure */}
                  <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">Target Sheet Tab:</span>
                      <select
                        value={activeTab}
                        onChange={(e) => handleTabChange(e.target.value)}
                        className="text-xs font-medium bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-blue-500"
                      >
                        {sheetMetadata.sheets.map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ready to receive loan application records (30 mapped columns)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
