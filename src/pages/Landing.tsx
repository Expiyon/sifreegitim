import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Mail, Phone, Users, CheckCircle2, BookOpen, GraduationCap, Menu, X, CheckCircle, Target, Heart, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

const InstagramIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FORMSPREE_URL = 'https://formspree.io/f/xdajgapy';

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', interest: 'Sayısal (Tıp / Mühendislik)', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!mobileMenu) return;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenu(false); };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [mobileMenu]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ad: formData.firstName,
          soyad: formData.lastName,
          email: formData.email,
          ilgi_alani: formData.interest,
          mesaj: formData.message,
        }),
      });
      if (res.ok) {
        setFormStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', interest: 'Sayısal (Tıp / Mühendislik)', message: '' });
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <div className="sticky top-0 z-[100] bg-navy-900 shadow-lg border-b border-navy-800/50">
        <nav className="flex items-center justify-between px-6 md:px-8 py-4 max-w-7xl mx-auto relative">
          <Link to="/" className="shrink-0">
            <img src="/logo.png" alt="Şifre Akademi" className="h-14 md:h-20 object-contain brightness-0 invert" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button type="button" onClick={() => scrollTo('felsefe')} className="hover:text-white transition-colors">Yaklaşımımız</button>
            <button type="button" onClick={() => scrollTo('siniflar')} className="hover:text-white transition-colors">Sınıflarımız</button>
            <button type="button" onClick={() => scrollTo('neden')} className="hover:text-white transition-colors">Neden Şifre?</button>
            <button type="button" onClick={() => scrollTo('kayit')} className="hover:text-white transition-colors">Kayıt & İletişim</button>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Öğrenci Girişi</Link>
            <Button type="button" className="bg-accent text-navy-900 px-6 rounded-full font-bold hover:bg-accent-hover shadow-[0_0_20px_-5px_rgba(0,229,255,0.5)]" onClick={() => scrollTo('kayit')}>
              Ücretsiz Ön Kayıt
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-white" aria-label="Menü">
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <>
          <button
            type="button"
            aria-hidden
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setMobileMenu(false)}
          />
          <div className="md:hidden fixed inset-x-0 bottom-0 top-0 z-[70] flex flex-col pt-[4.5rem] px-6 pb-10 bg-navy-900 shadow-2xl overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-1 text-base font-medium text-white">
            <button type="button" onClick={() => scrollTo('felsefe')} className="text-left py-4 border-b border-navy-800 hover:text-accent transition-colors">Yaklaşımımız</button>
            <button type="button" onClick={() => scrollTo('siniflar')} className="text-left py-4 border-b border-navy-800 hover:text-accent transition-colors">Sınıflarımız</button>
            <button type="button" onClick={() => scrollTo('neden')} className="text-left py-4 border-b border-navy-800 hover:text-accent transition-colors">Neden Şifre?</button>
            <button type="button" onClick={() => scrollTo('kayit')} className="text-left py-4 border-b border-navy-800 hover:text-accent transition-colors">Kayıt & İletişim</button>
            <Link to="/login" onClick={() => setMobileMenu(false)} className="text-left py-4 border-b border-navy-800 hover:text-accent transition-colors">Öğrenci Girişi</Link>
            <Button type="button" className="bg-accent text-navy-900 mt-4 py-6 text-base rounded-full font-bold shadow-[0_0_24px_-6px_rgba(0,229,255,0.55)]" onClick={() => scrollTo('kayit')}>
              Ücretsiz Ön Kayıt
            </Button>
            <button type="button" onClick={() => setMobileMenu(false)} className="mt-6 py-3 text-sm text-slate-400 hover:text-white transition-colors">
              Kapat (Esc)
            </button>
          </div>
        </div>
        </>
      )}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-8 md:pt-12 pb-20 md:pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-accent/15 text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-6 border border-accent/20">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden /> Butik sınıflar · Sınırlı kontenjan
            </div>
            <h1 className="text-4xl md:text-[3.25rem] lg:text-6xl font-bold text-navy-900 leading-[1.08] mb-6 tracking-tight">
              YKS’ye Hazırlıkta<br className="hidden sm:block" /><span className="text-navy-900"> Yanınızda Olan</span><br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-900 to-teal-700">Bir Ekip.</span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
              Kızılay’daki kurumumuzda sınav sürecini disiplinle yönetiyoruz: sınırlı kontenjanlı gruplar, seviyenize göre haftalık program ve etütle pekiştirme bir arada. Tanışmak için forma bir dakikanızı ayırmanız yeterli — gerisini birlikte planlarız.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button type="button" size="lg" className="bg-navy-900 text-white gap-2 px-8 rounded-full w-full sm:w-auto justify-center shadow-lg shadow-navy-900/25" onClick={() => scrollTo('kayit')}>
                Ücretsiz Ön Kayıt Formu <ArrowRight className="w-4 h-4 shrink-0" />
              </Button>
              <Button type="button" size="lg" variant="outline" className="px-8 rounded-full w-full sm:w-auto justify-center border-navy-900/15 text-navy-900 hover:bg-slate-50" onClick={() => scrollTo('siniflar')}>
                Sınıflarımızı Görün
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-6 max-w-lg">
              <span className="font-semibold text-navy-800">Kontenjan uyarısı:</span> Gruplarımız küçük olduğu için yerler sınırlıdır. Erken iletişim, size en uygun zamanı birlikte seçmemizi sağlar.
            </p>
          </div>
          <div className="relative h-[400px] md:h-[520px]">
            <div className="absolute top-0 left-0 w-[75%] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white -rotate-2 z-10">
              <img src="/dershane-2.jpeg" alt="Şifre Akademi Sınıfı" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-4 right-0 w-[55%] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white rotate-3 z-20">
              <img src="/dershane-1.jpeg" alt="Projektörlü Derslik" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-8 left-4 w-[55%] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border-4 border-white -rotate-3 z-20">
              <img src="/dershane-3.jpeg" alt="Etüt odası" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 left-4 right-6 sm:right-auto sm:left-[-0.75rem] sm:max-w-[280px] bg-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-navy-900/10 flex items-center gap-4 border border-slate-100/80 z-30 ring-1 ring-slate-100">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                <Users className="w-6 h-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-bold text-navy-900 truncate">Kalabalığı Değil, Sonucu Konuşuruz.</div>
                <div className="text-xs text-slate-500 font-medium leading-snug">Butik yapı ile her öğrenciye yakın takip · Ankara Çankaya</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Philosophy Section */}
      <section id="felsefe" className="bg-slate-50 py-20 md:py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-16">
            <div className="max-w-xl">
              <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">Yaklaşımımız</div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4 tracking-tight">Eğitim Felsefemiz</h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                Kalabalık sınıflar yerine, <strong className="text-navy-900 font-semibold">her öğrenciyi yakından takip ettiğimiz</strong> küçük gruplarla öğretiyoruz. Eksikler netleştikçe programa müdahale eder, veliyi süreçten haberdar tutarız.
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <div className="inline-flex flex-col items-start md:items-end rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                <span className="text-4xl md:text-5xl font-bold text-teal-600 tracking-tight">Haftalık</span>
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mt-1 text-left md:text-right">Gelişim ve takip</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Kişiye Özel Yol Haritası</h3>
                <p className="text-slate-600 text-sm max-w-md mb-12 leading-relaxed">
                  Seviyen, hedefin ve sınav takvimine göre netleşmiş bir programa odaklanıyoruz — “milim milim gitmek yerine doğru sırayla ilerlemen” için yanınıdayız.
                </p>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-teal-600 font-medium text-sm">
                  <Target className="w-4 h-4" /> HEDEFE ODAKLI
                </div>
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-slate-200 rounded-sm transform rotate-45"></div>
                </div>
              </div>
            </div>

            <div className="bg-navy-900 p-8 md:p-10 rounded-3xl text-white flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Veli Köprüsü</h3>
              <p className="text-blue-100/90 text-sm leading-relaxed">
                Deneme netleri ve eksik branşlar için düzenli bilgilendirme; veliyi süreçten uzak tutmuyor, birlikte planlı ilerliyoruz.
              </p>
            </div>

            <div className="relative rounded-3xl overflow-hidden min-h-[300px]">
              <img src="/dershane-3.jpeg" alt="Etüt Odası" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-navy-900/10" />
              <div className="relative h-full p-8 md:p-10 flex flex-col justify-between min-h-[300px]">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Etüt odaları</h3>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    Sessiz etüt odalarımızda soru çözümü ve tekrar için odaklanmış bir ortam.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row overflow-hidden">
              <div className="p-8 md:p-10 flex-1 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-navy-900 mb-3">Uzman Kadro ile Tam Destek</h3>
                <p className="text-slate-600 text-sm mb-6 max-w-sm leading-relaxed">
                  YKS dinamiklerine hakim eğitmenlerle ders ve etüt uyumunu sağlıyoruz; sınav gününe kadar yanınızdasınız.
                </p>
                <button type="button" onClick={() => scrollTo('kayit')} className="flex items-center gap-2 text-navy-900 font-bold text-sm hover:gap-3 transition-all cursor-pointer w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
                  Sorularınız için bize yazın <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
                </button>
              </div>
              <div className="w-full md:w-2/5 h-48 md:h-auto">
                <img src="/dershane-1.jpeg" alt="Derslik" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Gallery Section */}
      <section id="siniflar" className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">Derslikler ve etüt</div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 tracking-tight">Sınıflarımız</h2>
            <p className="text-slate-600 text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
              Projektör ve iklimlendirilmiş modern derslikler, sessiz etüt odaları ve Kızılay’ın içinden kolay ulaşım — motivasyonu yüksek, düzenli bir çalışma ortamı.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-3xl overflow-hidden aspect-[16/10] bg-slate-100">
              <img src="/dershane-2.jpeg" alt="Şifre Akademi Sınıfı" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="rounded-3xl overflow-hidden aspect-[16/10] md:aspect-auto bg-slate-100">
              <img src="/dershane-1.jpeg" alt="Projektörlü Derslik" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="md:col-span-3 rounded-3xl overflow-hidden aspect-[21/9] bg-slate-100">
              <img src="/dershane-3.jpeg" alt="Etüt odası" className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="font-bold text-navy-900 mb-2">Modern Sınıflar</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Projeksiyon ve klima ile düzenlenmiş dersliklerde dikkatin dağılmadan yoğunlaşın.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="font-bold text-navy-900 mb-2">Etüt odaları</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Etüt odalarımızda soru çözümü ve tekrar; “evde çalışamıyorum” demeden konforlu çalışma.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="font-bold text-navy-900 mb-2">Butik Gruplar</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Küçük sınıflar sayesinde “köşede kalan öğrenci” olmaz; öğretmen gözü üzerindedir.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="neden" className="py-20 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-3">Neden Şifre Akademi?</div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 tracking-tight mb-4">Rakip değiliz; hedefinize birlikte yürüyoruz.</h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed">
              Sadece ders anlatmıyoruz; hedefinizi netleştirip sınava kadar disiplin ve motivasyonu sürdürülebilir kılıyoruz. Veli–öğrenci–kadro üçgeninde şeffaf iletişim esastır.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Butik Gruplar', desc: 'Kalabalıkta kaybolmayacağınız, herkesin sınava hazırlığına odaklandığı kontrollü küçük gruplar.' },
              { icon: Target, title: 'Kişiye Göre Program', desc: 'Seviye tespiti sonrası günlük ve haftalık görevler net; “ne çalışacağım?” sorusu kalkar.' },
              { icon: BookOpen, title: 'Etüt ile Pekiştirme', desc: 'Ders içi + etüt birlikte işler; yapamadığınız soruda yalnız kalmazsınız.' },
              { icon: Heart, title: 'Veli Güveni', desc: 'Düzenli bilgilendirme ve açık iletişim; veli de sürecin bir parçası olur.' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Application Footer */}
      <section id="kayit" className="bg-navy-900 text-white py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <div className="text-xs font-bold tracking-widest text-accent uppercase mb-3">İletişim & başvuru</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Bir kahve sohbeti kadar yakın:<br className="hidden sm:block" /> önce tanışalım, sonra netleştirelim.</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-12 max-w-md">
                Adresimiz merkezde; ulaşım kolay. Telefon veya form — size en uygun kanaldan dönüş yapıyoruz.
              </p>
              
              <div className="space-y-7">
                <a href="https://maps.google.com/?q=Kocatepe+Mah.+Meşrutiyet+Cd.+No:27+Kızılay+Ankara" target="_blank" rel="noopener noreferrer" className="flex gap-4 group">
                  <MapPin className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">Şifre Akademi Merkezi</h4>
                    <p className="text-sm text-slate-400">Kocatepe Mah. Meşrutiyet Cd. No:27/13<br/>Kızılay, Ankara</p>
                  </div>
                </a>
                <a href="tel:+905528825286" className="flex gap-4 group">
                  <Phone className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">Telefon</h4>
                    <p className="text-sm text-slate-400">0552 882 52 86</p>
                  </div>
                </a>
                <a href="mailto:bilgi@sifreakademi.com.tr" className="flex gap-4 group">
                  <Mail className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">E-Posta</h4>
                    <p className="text-sm text-slate-400">bilgi@sifreakademi.com.tr</p>
                  </div>
                </a>
                <a href="https://instagram.com/sifreakademi" target="_blank" rel="noopener noreferrer" className="flex gap-4 group">
                  <InstagramIcon className="w-6 h-6 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">Instagram</h4>
                    <p className="text-sm text-slate-400">@sifreakademi</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white text-navy-900 p-8 md:p-10 rounded-3xl">
              {formStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">Başvurunuz Alındı!</h3>
                  <p className="text-slate-500 text-sm max-w-xs">Kısa süre içinde sizi arayarak ücretsiz bilgilendirme ve uygun gün/saat için teyit alacağız. Teşekkür ederiz.</p>
                  <button type="button" onClick={() => setFormStatus('idle')} className="mt-6 text-sm font-medium text-teal-600 hover:text-teal-700">
                    Yeni başvuru gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div className="mb-2">
                    <h3 className="text-xl font-bold text-navy-900 mb-1">Başvuru Formu</h3>
                    <p className="text-slate-600 text-sm">Kısa formu gönderin; ekibimiz ücretsiz bilgilendirme için sizi arayıp sınav sürecinize uygun seçenekleri anlatır.</p>
                  </div>

                  {formStatus === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">Bir hata oluştu. Lütfen tekrar deneyin.</div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Adınız</label>
                      <input type="text" required value={formData.firstName} onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))} className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-navy-900 outline-none text-sm" placeholder="Ali" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Soyadınız</label>
                      <input type="text" required value={formData.lastName} onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))} className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-navy-900 outline-none text-sm" placeholder="Yılmaz" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-Posta Adresi</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-navy-900 outline-none text-sm" placeholder="ali.yilmaz@ornek.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">İlgi Alanı / Hedef</label>
                    <select value={formData.interest} onChange={(e) => setFormData(p => ({ ...p, interest: e.target.value }))} className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-navy-900 outline-none appearance-none text-sm">
                      <option>Sayısal (Tıp / Mühendislik)</option>
                      <option>Eşit Ağırlık (Hukuk / İşletme)</option>
                      <option>Sözel (Öğretmenlik / İletişim)</option>
                      <option>Dil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mesajınız <span className="normal-case text-slate-400 font-normal">(opsiyonel)</span></label>
                    <textarea rows={3} value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-navy-900 outline-none resize-none text-sm" placeholder="Hedeflerinizden veya sormak istediklerinizden bahsedin..."></textarea>
                  </div>
                  <Button type="submit" disabled={formStatus === 'sending'} className="w-full py-6 text-base rounded-xl">
                    {formStatus === 'sending' ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="border-t border-navy-800 mt-20 md:mt-24 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
            <img src="/logo.png" alt="Şifre Akademi" className="h-14 object-contain brightness-0 invert opacity-80" />
            <p className="text-xs text-slate-500 text-center md:text-right">
              © {new Date().getFullYear()} Şifre Akademi Eğitim Kurumları. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
