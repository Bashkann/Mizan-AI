import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

/* ─── Intersection Observer Hook ─── */
// Removed useInView, using scrolled state instead for foolproof animations.

export default function LandingPage() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [tableInView, setTableInView] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (window.scrollY > 200) {
        setTableInView(true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const comparisonRows = [
    { feature: 'Emsal Karar Araması', mizan: 'Gerçek Yargıtay kararları', mizanIcon: '✅', other: 'Mevcut değil', otherIcon: '❌' },
    { feature: 'Hallüsinasyon Riski', mizan: 'Sıfır — sadece gerçek veri', mizanIcon: '✅', other: 'Yüksek risk', otherIcon: '⚠️' },
    { feature: 'Türk Mevzuatı', mizan: 'Güncel ve kapsamlı', mizanIcon: '✅', other: 'Sınırlı bilgi', otherIcon: '⚠️' },
    { feature: 'Kaynak Şeffaflığı', mizan: 'Her cevap kaynakla', mizanIcon: '✅', other: 'Kaynak gösterilmez', otherIcon: '❌' },
    { feature: 'Hukuki İş Akışı', mizan: 'Avukatlar için tasarlandı', mizanIcon: '✅', other: 'Genel amaçlı', otherIcon: '❌' },
    { feature: 'Veri Gizliliği', mizan: 'Eğitimde kullanılmaz', mizanIcon: '✅', other: 'Belirsiz', otherIcon: '❓' },
  ];

  const getIconClass = (icon) => {
    if (icon === '✅') return 'icon-success';
    if (icon === '❌') return 'icon-error';
    if (icon === '⚠️' || icon === '❓') return 'icon-warning';
    return '';
  };

  return (
    <div className="landing-root min-h-screen bg-bg-primary text-text-primary font-body overflow-x-hidden selection:bg-primary-muted selection:text-primary relative z-10">
      
      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-bg-surface/90 backdrop-blur-md shadow-sm border-b border-border' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <span className="font-heading font-bold text-xl tracking-wide">MİZAN AI</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="bg-bg-surface border border-border rounded-full p-1 shadow-sm">
              <ThemeToggle />
            </div>
            <button onClick={login} className="hidden sm:block px-5 py-2 text-sm font-semibold rounded-lg border-2 border-primary text-primary hover:bg-primary-muted transition-colors">
              Giriş Yap
            </button>
            <button onClick={login} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#C9A84C] text-[#1A1A1A] hover:bg-[#B49642] transition-colors shadow-md">
              Başlayın
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-40 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content (60%) */}
          <div className="lg:w-3/5 space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-muted border border-primary/20 text-primary text-xs font-semibold tracking-wide">
              <span>🔒</span> KVKK Uyumlu
            </div>
            
            <h1 className="font-display font-bold leading-[1.1] text-[48px] lg:text-[72px] tracking-[-0.02em]">
              Türk Hukuku İçin <br />
              <span className="text-gradient">Yapay Zeka Asistanı</span>
            </h1>
            
            <p className="text-lg text-text-secondary max-w-xl leading-relaxed">
              Emsal kararları saniyeler içinde bulun. Sıfır hallüsinasyon, kaynaklı analiz.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button onClick={login} className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-[#1A1A1A] border border-[#E5E7EB] font-semibold hover:-translate-y-1 hover:shadow-md transition-all shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google ile Başlayın
              </button>
              <button className="px-8 py-4 rounded-xl border-2 border-border font-semibold hover:border-text-primary hover:bg-bg-surface-hover transition-all">
                Demo İzle
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-text-muted font-medium pt-4">
              <span>500+ Emsal Karar</span>
              <span>·</span>
              <span>Yargıtay Veritabanı</span>
              <span>·</span>
              <span>KVKK Uyumlu</span>
            </div>
          </div>

          {/* Right Content - Mockup (40%) */}
          <div className="lg:w-2/5 w-full max-w-md animate-float" style={{ animationDelay: '0.2s' }}>
            <div className="bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden relative z-10">
              {/* Fake header */}
              <div className="bg-bg-primary border-b border-border p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#1A1A1A] text-xs font-bold">M</div>
                <div>
                  <div className="text-sm font-semibold">MİZAN AI</div>
                  <div className="text-[10px] text-text-muted">Hukuk Asistanı</div>
                </div>
              </div>
              {/* Fake chat */}
              <div className="p-6 space-y-6">
                <div className="flex justify-end">
                  <div className="bg-text-primary text-bg-primary px-4 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[85%]">
                    Müvekkilim haksız feshe uğradı, benzer emsal kararlar bulabilir misin?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-bg-primary border border-border p-4 rounded-2xl rounded-tl-sm w-full shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold rounded">⚖️ EMSAL KARAR BULUNDU</span>
                    </div>
                    <div className="font-semibold text-sm mb-1 text-primary">Yargıtay 9. HD · 2019/12345</div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-4">
                      "...iş sözleşmesinin işverence haksız olarak feshedildiği anlaşıldığından kıdem ve ihbar tazminatının kabulüne karar verilmesi..."
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-medium text-text-muted">
                      <span>%87 Güvenilirlik</span>
                      <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-success w-[87%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-24 bg-bg-surface border-y border-border relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className={`text-center mb-12 transition-all duration-700 ${tableInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'}`}>
            <h2 className="font-heading text-4xl font-bold mb-4">Sıradan Yapay Zekadan Farkımız</h2>
            <p className="text-text-secondary text-lg">Genel amaçlı modellerin aksine, doğrudan Türk hukuk verisiyle çalışır.</p>
          </div>
          
          <div className="overflow-x-auto bg-bg-primary border border-border rounded-2xl shadow-sm">
            <table className="comparison-table w-full">
              <thead>
                <tr>
                  <th>Özellik</th>
                  <th className="col-mizan">MİZAN AI</th>
                  <th>Genel Yapay Zekalar</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => {
                  // Staggered animation style
                  const animStyle = tableInView 
                    ? { opacity: 1, transform: 'translateY(0)', transition: `all 500ms cubic-bezier(0.4, 0, 0.2, 1) ${idx * 150}ms` } 
                    : { opacity: 0, transform: 'translateY(30px)' };
                  
                  return (
                    <tr key={idx} style={animStyle}>
                      <td className="font-semibold">{row.feature}</td>
                      <td className="col-mizan">
                        <div className="flex items-center gap-2">
                          <span className={getIconClass(row.mizanIcon)}>{row.mizanIcon}</span>
                          <span className="text-text-primary font-medium">{row.mizan}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={getIconClass(row.otherIcon)}>{row.otherIcon}</span>
                          <span className="text-text-secondary">{row.other}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold mb-4">Neden MİZAN AI?</h2>
          <p className="text-text-secondary text-lg">Hukuki süreçlerinizi hızlandırmak için tasarlandı.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 shadow-sm">
            <div className="text-4xl mb-6">⚖️</div>
            <h3 className="font-heading text-2xl font-bold mb-3">Emsal Karar Analizi</h3>
            <p className="text-text-secondary leading-relaxed">
              Yargıtay ve yüksek mahkeme kararlarıyla davanızı saniyeler içinde karşılaştırın
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 shadow-sm">
            <div className="text-4xl mb-6">🛡️</div>
            <h3 className="font-heading text-2xl font-bold mb-3">Sıfır Hallüsinasyon</h3>
            <p className="text-text-secondary leading-relaxed">
              Yapay zeka yalnızca gerçek mahkeme kararlarına dayalı analiz yapar, asla uydurmaz
            </p>
          </div>
          <div className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 shadow-sm">
            <div className="text-4xl mb-6">📄</div>
            <h3 className="font-heading text-2xl font-bold mb-3">Belge Analizi</h3>
            <p className="text-text-secondary leading-relaxed">
              PDF ve Word belgelerinizi yükleyin, dava detaylarını otomatik çıkarın
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS (Inverted) ── */}
      <section className="bg-[#111118] text-white py-20 border-y border-[#1F2937] relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="font-heading text-5xl font-bold text-[#C9A84C] mb-2">500+</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Emsal Karar</div>
            </div>
            <div>
              <div className="font-heading text-5xl font-bold text-[#C9A84C] mb-2">%87</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Ort. Güvenilirlik Skoru</div>
            </div>
            <div>
              <div className="font-heading text-5xl font-bold text-[#C9A84C] mb-2">3sn</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Ortalama Analiz Süresi</div>
            </div>
            <div>
              <div className="font-heading text-5xl font-bold text-[#C9A84C] mb-2">100%</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Türk Hukuku Odaklı</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden z-10">
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold">Davanızı Güçlendirin</h2>
          <p className="text-xl text-text-secondary">
            Türkiye'nin en gelişmiş hukuk yapay zeka asistanını ücretsiz deneyin
          </p>
          <button onClick={login} className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-[#1A1A1A] border border-[#E5E7EB] text-lg font-semibold hover:-translate-y-1 hover:shadow-xl transition-all shadow-md">
             <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google ile Ücretsiz Başlayın
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-bg-surface py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚖️</span>
            <div>
              <div className="font-heading font-bold text-lg">MİZAN AI</div>
              <div className="text-xs text-text-muted">Türk Hukukunun Yapay Zeka Asistanı</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-text-secondary font-medium">
            <a href="#" className="hover:text-primary transition-colors">Hakkımızda</a>
            <a href="#" className="hover:text-primary transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-primary transition-colors">Kullanım Koşulları</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-border text-center text-sm text-text-muted">
          © 2026 MİZAN AI. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
}
