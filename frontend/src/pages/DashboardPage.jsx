import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import ResultsPanel from '../components/ResultsPanel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ScalesOfJustice from '../components/ScalesOfJustice';
import ThemeToggle from '../components/ThemeToggle';
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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Character constraints removed

  // If navigated with state.query, pre-fill textarea
  useEffect(() => {
    if (location.state?.query) {
      setCaseDescription(location.state.query);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const decodeHtml = (html) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  // Loading steps progress
  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 2500); // changes step every 2.5s
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const loadingSteps = [
    "Belge okunuyor...",
    "Emsal aranıyor...",
    "Analiz yapılıyor..."
  ];

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
    if (!uploadedFile && !caseDescription.trim()) {
      return; // Do nothing if input is empty
    }

    try {
      setLoading(true);

      const userQuery = caseDescription.trim() || (uploadedFile ? `Belge Yüklendi: ${uploadedFile.name}` : '');
      setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);
      
      const currentCaseDesc = caseDescription.trim();
      setCaseDescription(''); // Clear immediately for better UX
      
      if (textareaRef.current) {
        textareaRef.current.style.height = '84px'; // Reset height
      }

      if (uploadedFile) {
        const formData = new FormData();
        formData.append('document', uploadedFile);
        
        const response = await api.post('/api/mizan/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const data = response.data.data;
        const parsed = parseAnalysis(data.analysis, data.citedCase, data.confidence, data.mode);
        setMessages((prev) => [...prev, { role: 'ai', result: parsed }]);
      } else {
        const response = await api.post('/api/mizan/query', {
          caseDescription: currentCaseDesc,
        });

        const data = response.data.data || response.data;
        const parsed = parseAnalysis(data.analysis, data.citedCase, data.confidence, data.mode);
        setMessages((prev) => [...prev, { role: 'ai', result: parsed }]);
      }

      // Refresh history
      fetchHistory();
      setUploadedFile(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          error: true,
          result: { mode: 'error', conclusion: errorMessage },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle new query — clear results and focus textarea
  const handleNewQuery = () => {
    setCaseDescription('');
    setMessages([]);
    setUploadedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = '84px';
    textareaRef.current?.focus();
  };

  // Handle File Upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece PDF ve DOCX dosyaları desteklenmektedir.');
      return;
    }

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10MB'dan küçük olmalıdır.");
      return;
    }

    setUploadedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle keyboard shortcut (Ctrl/Cmd + Enter to submit)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && (caseDescription.trim() || uploadedFile) && !loading) {
      handleSubmit();
    }
  };

  // handleKeyDown

  return (
    <div className="min-h-screen bg-bg-primary flex dashboard-root">
      {/* Fixed Theme Toggle */}
      <div className="fixed top-5 right-5 z-[1000]">
        <ThemeToggle />
      </div>

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

          {/* Messages List */}
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                {msg.role === 'user' ? (
                  <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm whitespace-pre-wrap text-sm leading-relaxed">
                    {decodeHtml(msg.content)}
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Mode Indicator Badge */}
                    {(msg.result?.mode === 'general' || msg.result?.mode === 'rag' || !msg.result?.mode) && (
                      <div className="flex justify-start mb-2 animate-fade-in">
                        <div className="px-3 py-1 bg-bg-surface border border-border rounded-full flex items-center gap-2 shadow-sm">
                          <span className="text-xs font-semibold text-text-secondary">
                            {msg.result?.mode === 'general' ? '💬 Genel Soru' : '⚖️ Emsal Analizi'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {msg.result?.mode === 'casual' ? (
                      <div className="bg-bg-surface border border-border p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-text-primary leading-relaxed max-w-[85%]">
                        {decodeHtml(msg.result.conclusion)}
                      </div>
                    ) : msg.result?.mode === 'error' ? (
                      <div className="bg-error/10 border border-error/20 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-error leading-relaxed max-w-[85%] flex items-center gap-2">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {msg.result.conclusion}
                      </div>
                    ) : msg.result?.mode === 'general' ? (
                      <div className="bg-bg-surface border border-border p-6 rounded-2xl rounded-tl-sm shadow-sm text-sm text-text-primary leading-relaxed max-w-[85%]">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {decodeHtml(msg.result.conclusion)}
                        </div>
                      </div>
                    ) : (
                      <ResultsPanel result={msg.result} onSave={() => {}} />
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="w-full max-w-md p-6 border border-border rounded-2xl bg-bg-surface shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 animate-sway">
                      <ScalesOfJustice size={32} />
                    </div>
                    <span className="text-sm font-medium text-text-primary">MİZAN AI Analiz Ediyor...</span>
                  </div>
                  <div className="space-y-3">
                    {loadingSteps.map((stepText, idx) => {
                      const isDone = loadingStep > idx;
                      const isActive = loadingStep === idx;
                      const isPending = loadingStep < idx;
                      return (
                        <div key={idx} className={`flex items-center gap-3 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                          {isDone ? (
                            <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : isActive ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-border" />
                          )}
                          <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty state — shown when no query submitted */}
            {messages.length === 0 && !loading && (
              <div className="dashboard-empty-state">
                {/* Pulsing ambient glow */}
                <div className="dashboard-empty-glow" />
                <div className="dashboard-empty-content animate-fade-in">
                  <ScalesOfJustice size={80} className="mx-auto mb-6" />
                  <h2 className="dashboard-empty-title">
                    Size nasıl yardımcı olabilirim?
                  </h2>
                  <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                    <button onClick={() => { setCaseDescription('Boşanma davası dilekçesi örneği yazar mısın?'); textareaRef.current?.focus(); }} className="dashboard-chip">⚖️ Dava analizi yap</button>
                    <button onClick={() => { setCaseDescription('Hırsızlık suçunun cezası nedir?'); textareaRef.current?.focus(); }} className="dashboard-chip">📋 Hukuki soru sor</button>
                    <button onClick={() => fileInputRef.current?.click()} className="dashboard-chip">📄 Belge yükle</button>
                    <button onClick={() => { setCaseDescription('İş akdinin haksız feshi emsal kararları'); textareaRef.current?.focus(); }} className="dashboard-chip">🔍 Emsal karar ara</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Spacer to avoid overlap with bottom bar */}
          <div className="pb-48" />
          
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input Bar */}
        <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-4 bg-bg-primary/90 backdrop-blur-md border-t border-border z-30">
          <div className="max-w-4xl mx-auto">
            {/* Attachment Chip */}
            {uploadedFile && (
              <div className="mb-3 flex items-center gap-2 bg-bg-surface border border-border rounded-lg p-2 w-max shadow-sm animate-fade-in-up">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-text-primary">{uploadedFile.name}</span>
                  <span className="text-[10px] text-text-muted">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="ml-3 p-1 hover:bg-bg-surface-hover rounded-full text-text-muted hover:text-error transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Input Container */}
            <div className="relative flex items-end bg-bg-input border border-border-input rounded-2xl shadow-card transition-all duration-300 focus-within:shadow-lg focus-within:border-primary/50">
              
              {/* Paperclip / File Upload */}
              <div className="p-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
              </div>

              {/* Auto-expanding textarea */}
              <textarea
                ref={textareaRef}
                value={caseDescription}
                onChange={(e) => {
                  setCaseDescription(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Davanızın detaylarını girin, belge yükleyin veya hukuki bir soru sorun..."
                rows={4}
                className="flex-1 max-h-[180px] min-h-[84px] py-3.5 px-2 bg-transparent text-text-primary text-sm placeholder:text-text-muted border-none outline-none resize-none leading-relaxed"
                style={{ height: '84px' }}
              />

              {/* Send Button */}
              <div className="p-2.5">
                <button
                  onClick={handleSubmit}
                  disabled={(!caseDescription.trim() && !uploadedFile) || loading}
                  className="p-2.5 bg-primary text-bg-primary rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:bg-bg-surface disabled:text-text-muted transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Hint */}
            <div className="flex justify-center mt-2 px-2">
              <span className="text-[10px] text-text-muted">
                MİZAN AI hata yapabilir. Lütfen önemli bilgileri doğrulayın.
              </span>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}

/**
 * Parse the raw AI analysis text into structured sections.
 * Handles both the formatted [SECTION] output and plain text fallback.
 */
function parseAnalysis(analysisText, citedCase, confidence, mode = 'rag') {
  if (!analysisText) {
    return {
      mode,
      caseInfo: {},
      similarities: '',
      differences: '',
      applicability: '',
      conclusion: analysisText || '',
      confidenceScore: Math.round((confidence || 0) * 100),
      sources: [],
    };
  }

  // If it's a general mode, skip parsing the structure
  if (mode === 'general') {
    return {
      mode,
      caseInfo: {},
      similarities: '',
      differences: '',
      applicability: '',
      conclusion: analysisText,
      confidenceScore: 0,
      sources: [],
    };
  }

  // Try to extract structured sections from the response
  let similarities = '';
  let differences = '';
  let applicability = '';
  let conclusion = '';

  const simMatch = analysisText.match(/\[BENZERLİKLER\]\s*\n?([\s\S]*?)(?=\[FARKLILIKLAR\]|\[UYGULANABİLİRLİK\]|\[SONUÇ\]|$)/i);
  if (simMatch) similarities = simMatch[1].trim();

  const diffMatch = analysisText.match(/\[FARKLILIKLAR\]\s*\n?([\s\S]*?)(?=\[UYGULANABİLİRLİK\]|\[SONUÇ\]|$)/i);
  if (diffMatch) differences = diffMatch[1].trim();

  const appMatch = analysisText.match(/\[UYGULANABİLİRLİK\]\s*\n?([\s\S]*?)(?=\[SONUÇ\]|$)/i);
  if (appMatch) applicability = appMatch[1].trim();

  const concMatch = analysisText.match(/\[SONUÇ\]\s*\n?([\s\S]*?)$/i);
  if (concMatch) conclusion = concMatch[1].trim();

  // If no structured sections found, use the whole text
  if (!similarities && !differences && !applicability && !conclusion) {
    conclusion = analysisText;
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
    mode,
    caseInfo,
    similarities,
    differences,
    applicability,
    conclusion,
    confidenceScore: Math.round((confidence || 0) * 100),
    sources: citedCase
      ? [`${citedCase.court} - ${citedCase.caseNumber || citedCase.case_number} - ${citedCase.source || 'Veritabanı'}`]
      : [],
  };
}
