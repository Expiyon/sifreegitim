import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const role = await login(email, password);
      if (role === 'admin') navigate('/admin');
      else navigate('/student');
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      } else if (code === 'auth/too-many-requests') {
        setError('Çok fazla başarısız deneme. Lütfen birkaç dakika bekleyin.');
      } else if (code === 'auth/network-request-failed') {
        setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
      } else {
        setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 bg-navy-900/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Şifre Akademi" className="h-24 object-contain mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-navy-900 mb-1">Tekrar Hoş Geldiniz</h1>
            <p className="text-slate-500 text-sm">Hesabınıza giriş yaparak devam edin</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none text-sm transition-all"
                  placeholder="ornek@sifreakademi.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Şifre</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-navy-900 focus:border-transparent outline-none text-sm transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button disabled={loading} className="w-full py-6 text-sm font-bold rounded-xl mt-2 shadow-sm">
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed">
            Yalnızca kurum tarafından oluşturulan hesaplarla giriş yapılabilir.<br/>
            Sorun yaşıyorsanız <a href="tel:+905528825286" className="text-navy-900 font-medium hover:underline">bize ulaşın</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
