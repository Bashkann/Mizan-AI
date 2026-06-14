import { useState } from 'react';
import { useToast } from './Toast';

/**
 * ResultsPanel displays RAG analysis results with case metadata,
 * comparison analysis, conclusion, and confidence score.
 */
export default function ResultsPanel({ result, onSave }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  if (!result) return null;

  const {
    caseInfo = {},
    comparison = '', // Fallback for old history records
    similarities = '',
    differences = '',
    applicability = '',
    conclusion = '',
    confidenceScore = 0,
    sources = [],
  } = result;

  // Copy all results to clipboard as formatted text
  const handleCopy = async () => {
    try {
      const text = formatResultsAsText(result);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Sonuçlar panoya kopyalandı');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Kopyalama başarısız oldu');
    }
  };

  // Save/bookmark the result
  const handleSave = async () => {
    if (!onSave) return;
    try {
      setSaving(true);
      await onSave(result);
      toast.success('Sonuç kaydedildi');
    } catch (err) {
      toast.error('Kaydetme başarısız oldu');
    } finally {
      setSaving(false);
    }
  };

  // Determine confidence score color
  const getScoreGradient = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-success/80 to-success';
    if (score >= 60) return 'bg-gradient-to-r from-primary/80 to-primary';
    if (score >= 40) return 'bg-gradient-to-r from-yellow-500/80 to-yellow-500';
    return 'bg-gradient-to-r from-error/80 to-error';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Yüksek Güvenilirlik';
    if (score >= 60) return 'Orta Güvenilirlik';
    if (score >= 40) return 'Düşük Güvenilirlik';
    return 'Çok Düşük Güvenilirlik';
  };

  return (
    <div className="animate-slide-down space-y-5 print:space-y-4 print:text-black">
      {/* Print Header */}
      <div className="hidden print:block mb-6 text-center border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-bold font-heading text-primary">MİZAN AI</h1>
        <p className="text-gray-500 text-sm">Hukuki Analiz Raporu - {new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <h3 className="text-lg font-heading font-bold text-text-primary">
          Analiz Sonuçları
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="
              flex items-center gap-1.5 px-3 py-1.5
              text-xs font-medium text-text-secondary
              bg-bg-surface border border-border rounded-lg
              hover:text-primary hover:border-primary/50
              transition-all duration-200 cursor-pointer
            "
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Kopyalandı
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Kopyala
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="
              flex items-center gap-1.5 px-3 py-1.5
              text-xs font-medium text-text-secondary
              bg-bg-surface border border-border rounded-lg
              hover:text-primary hover:border-primary/50
              transition-all duration-200 cursor-pointer
            "
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.728 9.69a.75.75 0 00-.501 1.22l5.25 5.5a.75.75 0 001.046 0l5.25-5.5a.75.75 0 00-.501-1.22H6.728z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v10.5" />
            </svg>
            PDF / Yazdır
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="
                flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium text-text-secondary
                bg-bg-surface border border-border rounded-lg
                hover:text-primary hover:border-primary/50
                transition-all duration-200 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          )}
        </div>
      </div>

      {/* Case Information Section */}
      {caseInfo && Object.keys(caseInfo).length > 0 && (
        <div className="border-l-4 border-primary bg-bg-surface rounded-r-xl p-5 print:border-gray-800 print:bg-transparent">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 print:text-gray-800">
            <svg className="w-4 h-4 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Emsal Karar Bilgileri
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {caseInfo.court && (
              <InfoField label="Mahkeme" value={caseInfo.court} />
            )}
            {caseInfo.caseNumber && (
              <InfoField label="Esas No" value={caseInfo.caseNumber} />
            )}
            {caseInfo.decisionNumber && (
              <InfoField label="Karar No" value={caseInfo.decisionNumber} />
            )}
            {caseInfo.date && (
              <InfoField label="Tarih" value={caseInfo.date} />
            )}
            {caseInfo.subject && (
              <InfoField label="Konu" value={caseInfo.subject} full />
            )}
          </div>
        </div>
      )}

      {/* Fallback Comparison Analysis (For old history records) */}
      {comparison && !similarities && !differences && !applicability && (
        <div className="bg-bg-surface rounded-xl p-5 border border-border print:border-gray-300 print:bg-transparent">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 print:text-gray-800">
            <svg className="w-4 h-4 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Karşılaştırma Analizi
          </h4>
          <div className="text-sm text-text-secondary leading-relaxed print:text-black">
            {renderMarkdown(comparison)}
          </div>
        </div>
      )}

      {/* Structured Comparison Grid */}
      {(similarities || differences) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {similarities && (
            <div className="bg-bg-surface rounded-xl p-5 border-l-4 border-success shadow-sm print:border-gray-400 print:bg-transparent">
              <h4 className="text-sm font-semibold text-success uppercase tracking-wider mb-3 flex items-center gap-2 print:text-gray-800">
                <svg className="w-4 h-4 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Benzerlikler
              </h4>
              <div className="text-sm text-text-secondary leading-relaxed print:text-black">
                {renderMarkdown(similarities)}
              </div>
            </div>
          )}
          {differences && (
            <div className="bg-bg-surface rounded-xl p-5 border-l-4 border-error shadow-sm print:border-gray-400 print:bg-transparent">
              <h4 className="text-sm font-semibold text-error uppercase tracking-wider mb-3 flex items-center gap-2 print:text-gray-800">
                <svg className="w-4 h-4 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Farklılıklar
              </h4>
              <div className="text-sm text-text-secondary leading-relaxed print:text-black">
                {renderMarkdown(differences)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applicability Box */}
      {applicability && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-xl p-5 shadow-sm print:border-gray-400 print:bg-transparent">
          <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-3 flex items-center gap-2 print:text-gray-800">
            <svg className="w-4 h-4 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Uygulanabilirlik
          </h4>
          <div className="text-sm text-yellow-900 dark:text-yellow-100 leading-relaxed print:text-black">
            {renderMarkdown(applicability)}
          </div>
        </div>
      )}

      {/* Conclusion Section */}
      {conclusion && (
        <div className="bg-primary-muted border border-primary/30 rounded-xl p-5 print:border-gray-300 print:bg-transparent">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2 print:text-gray-800">
            <svg className="w-4 h-4 print:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            Sonuç
          </h4>
          <div className="text-sm text-text-primary leading-relaxed print:text-black">
            {renderMarkdown(conclusion)}
          </div>
        </div>
      )}

      {/* Confidence Score */}
      <div className="bg-bg-surface rounded-xl p-5 border border-border print:border-gray-300 print:bg-transparent">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text-secondary print:text-gray-800">
            Güvenilirlik Skoru
          </h4>
          <span className={`text-sm font-bold print:text-black ${
            confidenceScore >= 80 ? 'text-success' :
            confidenceScore >= 60 ? 'text-primary' :
            confidenceScore >= 40 ? 'text-yellow-500' : 'text-error'
          }`}>
            %{confidenceScore}
          </span>
        </div>
        <div className="w-full h-2.5 bg-border rounded-full overflow-hidden print:border print:border-gray-400 print:bg-transparent">
          <div
            className={`h-full rounded-full animate-fill-width print:bg-gray-800 ${getScoreGradient(confidenceScore)}`}
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2 print:text-gray-600">
          {getScoreLabel(confidenceScore)}
        </p>
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="bg-bg-surface rounded-xl p-5 border border-border print:border-gray-300 print:bg-transparent">
          <h4 className="text-sm font-semibold text-text-secondary mb-3 print:text-gray-800">
            Kaynaklar ({sources.length})
          </h4>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="text-xs text-text-muted flex items-start gap-2 print:text-black">
                <span className="text-primary font-mono shrink-0 print:text-gray-800">[{index + 1}]</span>
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* NEW: Emsal Kararı Gör Button at bottom */}
      {caseInfo && caseInfo.content && (
        <div className="mt-6 pt-4 flex justify-center print:hidden">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary border-2 border-primary rounded-xl hover:bg-primary/10 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            📄 Emsal Kararı Gör
          </button>
        </div>
      )}

      {/* Print Footer */}
      <div className="hidden print:block mt-8 text-center border-t border-gray-300 pt-4 break-inside-avoid">
        <p className="text-gray-500 text-sm font-semibold">MİZAN AI - Türk Hukuku Yapay Zeka Asistanı</p>
      </div>

      {/* Case Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-surface w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-card flex flex-col animate-slide-down border border-border">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-bg-primary/50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-heading font-bold text-text-primary mb-1">Emsal Karar Metni</h2>
                <div className="text-xs text-text-muted space-x-2">
                  <span>{caseInfo.court}</span>
                  <span>•</span>
                  <span>Esas: {caseInfo.caseNumber}</span>
                  <span>•</span>
                  <span>Karar: {caseInfo.decisionNumber}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-text-muted hover:text-error transition-colors rounded-full hover:bg-bg-surface cursor-pointer bg-bg-surface border border-border shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 text-sm text-text-secondary leading-relaxed bg-bg-surface">
              <div className="max-w-none prose prose-sm prose-p:mb-4 prose-strong:text-text-primary prose-strong:font-semibold">
                {caseInfo.content ? renderMarkdown(caseInfo.content) : 'Karar metni bulunamadı.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small helper component for metadata fields */
function InfoField({ label, value, full = false }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-xs text-text-muted mb-0.5 print:text-gray-500">{label}</dt>
      <dd className="text-sm text-text-primary font-medium print:text-black">{value}</dd>
    </div>
  );
}

/** Format results as plain text for clipboard */
function formatResultsAsText(result) {
  const lines = ['=== MİZAN AI Analiz Sonuçları ===\n'];

  if (result.caseInfo) {
    lines.push('--- EMSAL KARAR BİLGİLERİ ---');
    const ci = result.caseInfo;
    if (ci.court) lines.push(`Mahkeme: ${ci.court}`);
    if (ci.caseNumber) lines.push(`Esas No: ${ci.caseNumber}`);
    if (ci.decisionNumber) lines.push(`Karar No: ${ci.decisionNumber}`);
    if (ci.date) lines.push(`Tarih: ${ci.date}`);
    if (ci.subject) lines.push(`Konu: ${ci.subject}`);
    lines.push('');
  }

  if (result.comparison) {
    lines.push('--- KARŞILAŞTIRMA ANALİZİ ---');
    lines.push(result.comparison);
    lines.push('');
  }

  if (result.conclusion) {
    lines.push('--- SONUÇ ---');
    lines.push(result.conclusion);
    lines.push('');
  }

  lines.push(`Güvenilirlik Skoru: %${result.confidenceScore || 0}`);

  return lines.join('\n');
}

/**
 * Basic Markdown to JSX converter to handle bold texts and lists.
 */
function renderMarkdown(text) {
  if (!text) return null;
  
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/__(.*?)__/g, '<strong class="font-bold text-text-primary">$1</strong>')
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>');
    
  const lines = html.split('\n');
  let inList = false;
  let inOrderedList = false;
  let resultHtml = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)/);
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    
    if (bulletMatch) {
      if (!inList) { resultHtml += '<ul class="list-disc pl-5 mb-3 space-y-1">\n'; inList = true; }
      if (inOrderedList) { resultHtml += '</ol>\n'; inOrderedList = false; }
      resultHtml += `<li>${bulletMatch[3]}</li>\n`;
    } else if (numMatch) {
      if (!inOrderedList) { resultHtml += '<ol class="list-decimal pl-5 mb-3 space-y-1">\n'; inOrderedList = true; }
      if (inList) { resultHtml += '</ul>\n'; inList = false; }
      resultHtml += `<li>${numMatch[3]}</li>\n`;
    } else {
      if (inList) { resultHtml += '</ul>\n'; inList = false; }
      if (inOrderedList) { resultHtml += '</ol>\n'; inOrderedList = false; }
      if (line.trim() !== '') {
        resultHtml += `<p class="mb-3">${line}</p>\n`;
      }
    }
  }
  if (inList) resultHtml += '</ul>';
  if (inOrderedList) resultHtml += '</ol>';
  
  return <div dangerouslySetInnerHTML={{ __html: resultHtml }} />;
}
