import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import ResultsPanel from '../components/ResultsPanel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import api from '../api/axios';

/**
 * DashboardPage — main query interface with sidebar, textarea input,
 * character counter, and results panel.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const textareaRef = useRef(null);

  const [caseDescription, setCaseDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const MIN_CHARS = 50;
  const MAX_CHARS = 2000;
  const charCount = caseDescription.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  // If navigated with state.query, pre-fill textarea
  useEffect(() => {
    if (location.state?.query) {
      setCaseDescription(location.state.query);
      // Clear the state to avoid re-filling on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch query history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get('/api/mizan/history');
      const historyData = response.data.data || response.data;
      setHistory(historyData.history || []);
    } catch (error) {
      // Silently fail — history is not critical
      console.error('Failed to fetch history:', error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Submit case description for RAG analysis
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error(
        charCount < MIN_CHARS
          ? `Lütfen en az ${MIN_CHARS} karakter girin (${charCount}/${MIN_CHARS})`
          : `Metin ${MAX_CHARS} karakteri aşamaz`
      );
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await api.post('/api/mizan/query', {
        caseDescription: caseDescription.trim(),
      });

      const data = response.data.data || response.data;

      // Parse the analysis into structured sections
      const parsed = parseAnalysis(data.analysis, data.citedCase, data.confidence);
      setResult(parsed);

      // Refresh history
      fetchHistory();

      toast.success('Analiz tamamlandı');
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Bir hata oluştu. Lütfen tekrar deneyin.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle new query — clear results and focus textarea
  const handleNewQuery = () => {
    setCaseDescription('');
    setResult(null);
    textareaRef.current?.focus();
  };

  // Handle keyboard shortcut (Ctrl/Cmd + Enter to submit)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isValid && !loading) {
      handleSubmit();
    }
  };

  // Character count color
  const getCharCountColor = () => {
    if (charCount === 0) return 'text-text-muted';
    if (charCount < MIN_CHARS) return 'text-error';
    if (charCount > MAX_CHARS) return 'text-error';
    if (charCount > MAX_CHARS * 0.9) return 'text-yellow-500';
    return 'text-text-secondary';
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <Sidebar
        history={history.map((h) => ({
          id: h.id,
          query: h.queryText || h.query_text,
          date: h.createdAt || h.created_at,
        }))}
        onNewQuery={handleNewQuery}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:pl-0">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-12 pt-16 lg:pt-8">
          {/* Welcome header */}
          <div className="mb-8 animate-fade-in">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Hoş geldiniz{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h2>
            <p className="text-text-secondary text-sm">
              Davanızın detaylarını girerek emsal karar analizi alın.
            </p>
          </div>

          {/* Query input section */}
          <div className="animate-fade-in-up delay-100">
            <div className="bg-bg-surface border border-border rounded-2xl p-6 mb-6">
              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="case-description-input"
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Davanızın detaylarını girin... Örnek: İşçi, 5 yıllık kıdem süresinin ardından haksız yere işten çıkarılmıştır. İşveren herhangi bir yazılı uyarı vermemiş ve kıdem tazminatı ödememiştir. İşçi, iş mahkemesine başvurarak işe iade ve kıdem tazminatı talep etmektedir."
                  rows={6}
                  maxLength={MAX_CHARS + 100}
                  className="
                    w-full bg-transparent text-text-primary text-sm
                    placeholder:text-text-muted leading-relaxed
                    border-none outline-none resize-y
                    min-h-[150px] max-h-[400px]
                  "
                />
              </div>

              {/* Bottom bar: char counter + submit */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                {/* Character counter */}
                <div className={`text-xs font-mono ${getCharCountColor()}`}>
                  <span>{charCount}</span>
                  <span className="text-text-muted"> / {MAX_CHARS}</span>
                  {charCount > 0 && charCount < MIN_CHARS && (
                    <span className="ml-2 text-error">
                      (en az {MIN_CHARS} karakter gerekli)
                    </span>
                  )}
                </div>

                {/* Keyboard shortcut hint */}
                <span className="hidden md:inline text-xs text-text-muted">
                  ⌘ + Enter
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="analyze-button"
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="
                w-full flex items-center justify-center gap-3 px-6 py-4
                bg-primary hover:bg-primary-hover
                text-bg-primary font-bold text-base
                rounded-xl shadow-lg shadow-primary/20
                transition-all duration-300 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                hover:shadow-xl hover:shadow-primary/30
                active:scale-[0.99]
              "
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                  Analiz ediliyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  ANALİZ ET
                </>
              )}
            </button>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-8 space-y-4 animate-fade-in">
              <LoadingSkeleton type="card" />
              <LoadingSkeleton type="card" />
              <LoadingSkeleton type="text" />
            </div>
          )}

          {/* Results panel */}
          {result && !loading && (
            <div className="mt-8">
              <ResultsPanel result={result} />
            </div>
          )}

          {/* Empty state — shown when no query submitted */}
          {!result && !loading && (
            <div className="mt-16 text-center animate-fade-in opacity-0 delay-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p className="text-text-muted text-sm">
                Dava detaylarınızı girin ve yapay zeka analizini başlatın
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Parse the raw AI analysis text into structured sections.
 * Handles both the formatted [SECTION] output and plain text fallback.
 */
function parseAnalysis(analysisText, citedCase, confidence) {
  if (!analysisText) {
    return {
      caseInfo: {},
      comparison: '',
      conclusion: analysisText || '',
      confidenceScore: Math.round((confidence || 0) * 100),
      sources: [],
    };
  }

  // Try to extract structured sections from the response
  let comparison = '';
  let conclusion = '';

  // Extract [KARŞILAŞTIRMA ANALİZİ] section
  const compMatch = analysisText.match(
    /\[KARŞILAŞTIRMA ANALİZİ\]\s*\n?([\s\S]*?)(?=\[SONUÇ\]|$)/i
  );
  if (compMatch) {
    comparison = compMatch[1].trim();
  }

  // Extract [SONUÇ] section
  const concMatch = analysisText.match(
    /\[SONUÇ\]\s*\n?([\s\S]*?)$/i
  );
  if (concMatch) {
    conclusion = concMatch[1].trim();
  }

  // If no structured sections found, use the whole text as the comparison
  if (!comparison && !conclusion) {
    comparison = analysisText;
  }

  // Build case info from citedCase object (handle both camelCase and snake_case)
  const caseInfo = citedCase
    ? {
        court: citedCase.court || '',
        caseNumber: citedCase.caseNumber || citedCase.case_number || '',
        decisionNumber: citedCase.decisionNumber || citedCase.decision_number || '',
        date: (citedCase.decisionDate || citedCase.decision_date)
          ? new Date(citedCase.decisionDate || citedCase.decision_date).toLocaleDateString('tr-TR')
          : '',
        subject: citedCase.subject || '',
      }
    : {};

  return {
    caseInfo,
    comparison,
    conclusion,
    confidenceScore: Math.round((confidence || 0) * 100),
    sources: citedCase
      ? [`${citedCase.court} - ${citedCase.caseNumber || citedCase.case_number} - ${citedCase.source || 'Veritabanı'}`]
      : [],
  };
}
