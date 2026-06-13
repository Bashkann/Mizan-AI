import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ScalesOfJustice from '../components/ScalesOfJustice';

/**
 * LandingPage — full-screen hero with animated scales, feature cards,
 * and Google OAuth login button.
 */
export default function LandingPage() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
            <circle cx="20" cy="6" r="3" fill="#C9A84C" />
            <line x1="20" y1="9" x2="20" y2="34" stroke="#C9A84C" strokeWidth="2" />
            <line x1="8" y1="14" x2="32" y2="14" stroke="#C9A84C" strokeWidth="2" />
            <path d="M5 14 L8 24 L11 14" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <path d="M4 24 Q8 30 12 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <path d="M29 14 L32 24 L35 14" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <path d="M28 24 Q32 30 36 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <rect x="14" y="33" width="12" height="3" rx="1.5" fill="#C9A84C" />
          </svg>
          <span className="font-heading text-xl font-bold text-primary">MİZAN AI</span>
        </div>
        <button
          onClick={login}
          className="hidden sm:flex items-center gap-2 px-5 py-2 text-sm font-medium text-bg-primary bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200 cursor-pointer"
        >
          Giriş Yap
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-20">
        <div className="flex flex-col items-center text-center">
          {/* Animated scales */}
          <div className="mb-8 opacity-0 animate-fade-in">
            <ScalesOfJustice size={180} />
          </div>

          {/* Heading */}
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 opacity-0 animate-fade-in-up leading-tight">
            <span className="text-gold-gradient">Türk Hukuku İçin</span>
            <br />
            <span className="text-text-primary">Yapay Zeka Asistanı</span>
          </h1>

          {/* Subtext */}
          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mb-10 opacity-0 animate-fade-in-up delay-200 leading-relaxed">
            Emsal kararları saniyeler içinde bulun, davalarınızı güçlendirin.
          </p>

          {/* Google Login Button */}
          <button
            onClick={login}
            id="login-google-button"
            className="
              group flex items-center gap-3 px-8 py-4
              bg-primary hover:bg-primary-hover
              text-bg-primary font-semibold text-lg
              rounded-xl shadow-lg shadow-primary/20
              hover:shadow-xl hover:shadow-primary/30
              transition-all duration-300 cursor-pointer
              opacity-0 animate-fade-in-up delay-300
              hover:scale-[1.02] active:scale-[0.98]
            "
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google ile Giriş Yap
          </button>
        </div>

        {/* Feature Cards */}
        <section className="mt-24 md:mt-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Semantik Arama */}
            <div className="
              group bg-bg-surface border border-border rounded-2xl p-7
              hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5
              transition-all duration-300 hover:-translate-y-1
              opacity-0 animate-fade-in-up delay-400
            ">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-3">
                Semantik Arama
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Yapay zeka destekli anlamsal arama teknolojisi ile davalarınıza en uygun emsal kararları bulun. Anahtar kelime eşleşmesinin ötesine geçin.
              </p>
            </div>

            {/* Card 2: Sıfır Hallüsinasyon */}
            <div className="
              group bg-bg-surface border border-border rounded-2xl p-7
              hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5
              transition-all duration-300 hover:-translate-y-1
              opacity-0 animate-fade-in-up delay-500
            ">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-3">
                Sıfır Hallüsinasyon
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Yalnızca doğrulanmış emsal kararlara dayanan yanıtlar. Uydurma bilgi riski olmadan güvenle hukuki araştırma yapın.
              </p>
            </div>

            {/* Card 3: Emsal Atıf */}
            <div className="
              group bg-bg-surface border border-border rounded-2xl p-7
              hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5
              transition-all duration-300 hover:-translate-y-1
              opacity-0 animate-fade-in-up delay-500
            ">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-semibold text-text-primary mb-3">
                Emsal Atıf
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Her yanıtta mahkeme, esas no, karar no ve tarih bilgileriyle birlikte tam atıf sunulur. Kaynaklarınız her zaman şeffaftır.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-0 animate-fade-in-up delay-500">
          <div className="text-center">
            <p className="text-3xl font-bold text-gold-gradient font-heading">RAG</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Teknoloji</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gold-gradient font-heading">768D</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Vektör Boyutu</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gold-gradient font-heading">Gemini</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Yapay Zeka</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gold-gradient font-heading">%100</p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Atıf Oranı</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 text-center">
        <p className="text-xs text-text-muted">
          MİZAN AI © 2026 — <span className="italic">Adaletin ölçüsü, bilginin gücüdür.</span>
        </p>
      </footer>
    </div>
  );
}
