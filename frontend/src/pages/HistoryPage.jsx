import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ResultsPanel from '../components/ResultsPanel';
import { useToast } from '../components/Toast';
import api from '../api/axios';

/**
 * HistoryPage — displays a table of past queries with expandable rows.
 * Includes pagination via "load more" pattern.
 */
export default function HistoryPage() {
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [displayCount, setDisplayCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch query history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const decodeHtml = (html) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/mizan/history');
      const historyData = response.data.data || response.data;
      const rawHistory = historyData.history || [];
      
      const decodedHistory = rawHistory.map(item => ({
        ...item,
        queryText: decodeHtml(item.queryText || item.query_text),
        response: decodeHtml(item.response)
      }));
      
      setHistory(decodedHistory);
    } catch (error) {
      toast.error('Geçmiş yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded row
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Format date to Turkish locale
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Truncate text for preview
  const truncate = (text, maxLen = 100) => {
    if (!text) return '—';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  const filteredHistory = history.filter((item) => {
    const query = (item.queryText || item.query_text || '').toLowerCase();
    const response = (item.response || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return query.includes(search) || response.includes(search);
  });

  const displayedHistory = filteredHistory.slice(0, displayCount);
  const hasMore = filteredHistory.length > displayCount;

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <Sidebar
        history={history.slice(0, 10).map((h) => ({
          id: h.id,
          query: h.queryText || h.query_text,
          date: h.createdAt || h.created_at,
        }))}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:pl-0">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12 pt-16 lg:pt-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-text-primary mb-2">
                Sorgu Geçmişi
              </h2>
              <p className="text-text-secondary text-sm">
                Daha önce yaptığınız tüm analizleri görüntüleyin ve arayın.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDisplayCount(10); // reset pagination on search
                }}
                placeholder="Geçmişte ara..."
                className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-3 animate-fade-in">
              {[...Array(5)].map((_, i) => (
                <LoadingSkeleton key={i} type="table-row" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && history.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-surface flex items-center justify-center border border-border">
                <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Henüz bir sorgu yapmadınız
              </h3>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                Ana sayfaya giderek ilk dava analizinizi yapabilirsiniz.
              </p>
            </div>
          )}

          {/* History table */}
          {!loading && history.length > 0 && (
            <div className="animate-fade-in-up">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                <div className="col-span-3">Tarih</div>
                <div className="col-span-6">Sorgu</div>
                <div className="col-span-3">Emsal Karar</div>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-border">
                {displayedHistory.map((item) => (
                  <div key={item.id}>
                    {/* Row */}
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="
                        w-full grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4
                        px-5 py-4 text-left
                        hover:bg-bg-surface-hover
                        transition-colors duration-200 cursor-pointer
                        group
                      "
                    >
                      {/* Date */}
                      <div className="md:col-span-3">
                        <span className="text-xs text-text-muted md:text-sm">
                          {formatDate(item.createdAt || item.created_at)}
                        </span>
                      </div>

                      {/* Query preview */}
                      <div className="md:col-span-6">
                        <p className="text-sm text-text-primary group-hover:text-primary transition-colors">
                          {truncate(item.queryText || item.query_text)}
                        </p>
                      </div>

                      {/* Cited case */}
                      <div className="md:col-span-3 flex items-center justify-between">
                        <span className="text-xs text-text-muted font-mono">
                          {item.citedCase?.caseNumber || item.cited_case_number || '—'}
                        </span>
                        <svg
                          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                            expandedId === item.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {expandedId === item.id && (
                      <div className="px-5 pb-5 animate-expand-accordion">
                        <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm mt-2">
                          {/* Full query */}
                          <div className="mb-6">
                            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              Sorgu Metni
                            </h4>
                            <div className="bg-bg-primary rounded-lg p-4 border border-border text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                              {item.queryText || item.query_text}
                            </div>
                          </div>

                          {/* Response as ResultsPanel */}
                          {item.response ? (
                            <ResultsPanel result={parseHistoryItem(item)} />
                          ) : (
                            <p className="text-sm text-text-muted italic">
                              Bu sorgu için yanıt bulunamadı.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setDisplayCount((prev) => prev + 10)}
                    className="
                      px-6 py-2.5 text-sm font-medium
                      text-text-secondary bg-bg-surface
                      border border-border rounded-lg
                      hover:text-primary hover:border-primary/50
                      transition-all duration-200 cursor-pointer
                    "
                  >
                    Daha Fazla Yükle ({history.length - displayCount} kalan)
                  </button>
                </div>
              )}

              {/* Total count */}
              <div className="mt-4 text-center">
                <p className="text-xs text-text-muted">
                  Toplam {history.length} sorgu
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Parse the raw history item into structured sections for ResultsPanel.
 */
function parseHistoryItem(item) {
  const analysisText = item.response || '';
  let citedCase = item.citedCase || item.cited_case;
  
  if (typeof citedCase === 'string') {
    try {
      citedCase = JSON.parse(citedCase);
    } catch (e) {
      citedCase = null;
    }
  }

  const confidence = item.confidenceScore || item.confidence_score;

  let comparison = '';
  let conclusion = '';

  const compMatch = analysisText.match(/\[KARŞILAŞTIRMA ANALİZİ\]\s*\n?([\s\S]*?)(?=\[SONUÇ\]|$)/i);
  if (compMatch) comparison = compMatch[1].trim();

  const concMatch = analysisText.match(/\[SONUÇ\]\s*\n?([\s\S]*?)$/i);
  if (concMatch) conclusion = concMatch[1].trim();

  if (!comparison && !conclusion) comparison = analysisText;

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
      ? [`${citedCase.court || ''} - ${citedCase.caseNumber || citedCase.case_number || ''}`.replace(/^ - | - $/g, '')]
      : [],
  };
}
