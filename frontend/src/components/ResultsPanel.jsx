import { useState } from 'react';
import { useToast } from './Toast';

/**
 * ResultsPanel displays RAG analysis results with case metadata,
 * comparison analysis, conclusion, and confidence score.
 */
export default function ResultsPanel({ result, onSave }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!result) return null;

  const {
    caseInfo = {},
    comparison = '',
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
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-primary';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-error';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Yüksek Güvenilirlik';
    if (score >= 60) return 'Orta Güvenilirlik';
    if (score >= 40) return 'Düşük Güvenilirlik';
    return 'Çok Düşük Güvenilirlik';
  };

  return (
    <div className="animate-slide-down space-y-5">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-bold text-text-primary">
          Analiz Sonuçları
        </h3>
        <div className="flex items-center gap-2">
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
        <div className="border-l-4 border-primary bg-bg-surface rounded-r-xl p-5">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      {/* Comparison Analysis Section */}
      {comparison && (
        <div className="bg-bg-surface rounded-xl p-5 border border-border">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Karşılaştırma Analizi
          </h4>
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {comparison}
          </div>
        </div>
      )}

      {/* Conclusion Section */}
      {conclusion && (
        <div className="bg-primary-muted border border-primary/30 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            Sonuç
          </h4>
          <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {conclusion}
          </div>
        </div>
      )}

      {/* Confidence Score */}
      <div className="bg-bg-surface rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-text-secondary">
            Güvenilirlik Skoru
          </h4>
          <span className={`text-sm font-bold ${
            confidenceScore >= 80 ? 'text-success' :
            confidenceScore >= 60 ? 'text-primary' :
            confidenceScore >= 40 ? 'text-yellow-500' : 'text-error'
          }`}>
            %{confidenceScore}
          </span>
        </div>
        <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full animate-fill-width ${getScoreColor(confidenceScore)}`}
            style={{ width: `${confidenceScore}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          {getScoreLabel(confidenceScore)}
        </p>
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="bg-bg-surface rounded-xl p-5 border border-border">
          <h4 className="text-sm font-semibold text-text-secondary mb-3">
            Kaynaklar ({sources.length})
          </h4>
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="text-xs text-text-muted flex items-start gap-2">
                <span className="text-primary font-mono shrink-0">[{index + 1}]</span>
                <span>{source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Small helper component for metadata fields */
function InfoField({ label, value, full = false }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-xs text-text-muted mb-0.5">{label}</dt>
      <dd className="text-sm text-text-primary font-medium">{value}</dd>
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
