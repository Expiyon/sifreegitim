import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, UserPlus, Zap, X, CalendarPlus } from 'lucide-react';
import { secondaryAuth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { safeFetchCollection, safeSetDoc, safeAddDoc, getFirestoreUserMessage } from '../lib/firestore';
import { setDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface Student { uid: string; name: string; email: string; student_id: string; batch: string; }
interface UpcomingExam { id: string; exam_name: string; date: string; location: string; time: string; }

export default function AdminDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [firestoreOk, setFirestoreOk] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Enrollment
  const [enrollName, setEnrollName] = useState('');
  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollPassword, setEnrollPassword] = useState('');
  const [enrollId, setEnrollId] = useState('');
  const [enrollBatch, setEnrollBatch] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [enrollError, setEnrollError] = useState('');

  // Score Modal
  const [scoreModal, setScoreModal] = useState(false);
  const [scoreStudent, setScoreStudent] = useState<Student | null>(null);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  // Ders ders not girişi
  const [turkceNet, setTurkceNet] = useState('');
  const [matNet, setMatNet] = useState('');
  const [fenNet, setFenNet] = useState('');
  const [sosyalNet, setSosyalNet] = useState('');
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState('');
  const [scoreError, setScoreError] = useState('');

  // Upcoming Exam Modal
  const [examModal, setExamModal] = useState(false);
  const [upExamName, setUpExamName] = useState('');
  const [upExamDate, setUpExamDate] = useState('');
  const [upExamLocation, setUpExamLocation] = useState('');
  const [upExamTime, setUpExamTime] = useState('');
  const [upExamLoading, setUpExamLoading] = useState(false);
  const [upExamSuccess, setUpExamSuccess] = useState('');
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);

  const loadFirestoreData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    setStudentsLoaded(false);
    setFirestoreError(null);

    try {
      const [usersSnap, examsSnap] = await Promise.all([
        safeFetchCollection('users', db),
        safeFetchCollection('upcoming_exams', db),
      ]);

      const list: Student[] = [];
      usersSnap.forEach((d) => {
        const data = d.data();
        if (data.role === 'student') {
          list.push({ uid: d.id, name: data.name, email: data.email, student_id: data.student_id || '', batch: data.batch || '' });
        }
      });
      setStudents(list);

      const upcoming: UpcomingExam[] = [];
      examsSnap.forEach((d) => { upcoming.push({ id: d.id, ...d.data() } as UpcomingExam); });
      upcoming.sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingExams(upcoming);

      setFirestoreOk(true);
      setFirestoreError(null);
    } catch (e) {
      console.warn('Firestore verisi yüklenemedi:', e);
      setFirestoreOk(false);
      setFirestoreError(getFirestoreUserMessage(e, user.email));
    } finally {
      setStudentsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadFirestoreData();
  }, [loadFirestoreData]);

  // Enrollment
  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError(''); setEnrollSuccess(''); setEnrollLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, enrollEmail, enrollPassword);
      const newUid = cred.user.uid;

      // Firestore'a kaydet - zaman aşımı olsa bile arka planda tekrar dene
      const userData = {
        name: enrollName, email: enrollEmail, student_id: enrollId, batch: enrollBatch, role: 'student', createdAt: new Date().toISOString()
      };

      try {
        await safeSetDoc(db, 'users', newUid, userData);
      } catch (fsErr) {
        console.warn('İlk Firestore yazma denemesi başarısız, arka planda tekrar deneniyor:', fsErr);
        // Arka planda tekrar dene (fire-and-forget, kullanıcıyı bekletme)
        setDoc(doc(db, 'users', newUid), userData).catch(() => {});
      }

      // Listeye anında ekle
      setStudents(prev => [...prev, { uid: newUid, name: enrollName, email: enrollEmail, student_id: enrollId, batch: enrollBatch }]);
      setEnrollSuccess('Öğrenci başarıyla kaydedildi!');
      setEnrollName(''); setEnrollEmail(''); setEnrollPassword(''); setEnrollId(''); setEnrollBatch('');
      setTimeout(() => setEnrollSuccess(''), 3000);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setEnrollError('Bu e-posta adresi zaten kayıtlı.');
      } else {
        setEnrollError('Kayıt başarısız: ' + error.message);
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  // Add Score - ders ders
  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreStudent) return;
    setScoreError(''); setScoreSuccess(''); setScoreLoading(true);

    try {
      const turkce = parseFloat(turkceNet) || 0;
      const mat = parseFloat(matNet) || 0;
      const fen = parseFloat(fenNet) || 0;
      const sosyal = parseFloat(sosyalNet) || 0;
      const toplamNet = turkce + mat + fen + sosyal;

      let status = 'GEÇTİ';
      if (toplamNet >= 90) status = 'MÜKEMMEL';
      else if (toplamNet >= 60) status = 'BAŞARILI';

      await safeAddDoc(db, 'exams', {
        student_id: scoreStudent.uid,
        student_name: scoreStudent.name,
        exam_name: examName,
        date: examDate,
        turkce_net: turkce,
        mat_net: mat,
        fen_net: fen,
        sosyal_net: sosyal,
        net_score: toplamNet,
        score: 0,
        status,
        createdAt: new Date().toISOString()
      });
      setScoreSuccess('Not başarıyla eklendi!');
      setExamName(''); setExamDate('');
      setTurkceNet(''); setMatNet(''); setFenNet(''); setSosyalNet('');
      setTimeout(() => { setScoreModal(false); setScoreSuccess(''); setScoreStudent(null); }, 1500);
    } catch (error: any) { setScoreError('Hata: ' + error.message); }
    finally { setScoreLoading(false); }
  };

  // Add Upcoming Exam
  const handleAddUpcomingExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpExamLoading(true); setUpExamSuccess('');
    try {
      await safeAddDoc(db, 'upcoming_exams', {
        exam_name: upExamName, date: upExamDate, location: upExamLocation, time: upExamTime,
        createdAt: new Date().toISOString()
      });
      setUpcomingExams(prev => [...prev, { id: Date.now().toString(), exam_name: upExamName, date: upExamDate, location: upExamLocation, time: upExamTime }].sort((a,b) => a.date.localeCompare(b.date)));
      setUpExamSuccess('Sınav takvime eklendi!');
      setUpExamName(''); setUpExamDate(''); setUpExamLocation(''); setUpExamTime('');
      setTimeout(() => { setExamModal(false); setUpExamSuccess(''); }, 1500);
    } catch (error: any) { console.error(error); }
    finally { setUpExamLoading(false); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const batchColor = (b: string) => {
    if (b === 'Sayısal') return 'bg-orange-100 text-orange-700';
    if (b === 'Eşit Ağırlık') return 'bg-teal-100 text-teal-700';
    if (b === 'Sözel') return 'bg-purple-100 text-purple-700';
    if (b === 'Dil') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <PageLayout role="admin">
      {/* Score Modal - Ders Ders */}
      {scoreModal && scoreStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl relative">
            <button onClick={() => { setScoreModal(false); setScoreStudent(null); setScoreError(''); setScoreSuccess(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-navy-900 mb-1">Sınav Sonucu Ekle</h3>
            <p className="text-sm text-slate-500 mb-6">{scoreStudent.name} için ders ders net girin</p>
            {scoreSuccess && <div className="bg-teal-50 text-teal-700 p-3 rounded-lg text-xs font-bold mb-4">{scoreSuccess}</div>}
            {scoreError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold mb-4">{scoreError}</div>}
            <form onSubmit={handleAddScore} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sınav Adı</label>
                  <input required value={examName} onChange={(e) => setExamName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="TYT Genel Deneme #5" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tarih</label>
                  <input required type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ders Bazlı Netler</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1.5">🇹🇷 Türkçe Net</label>
                    <input type="number" step="0.25" min="0" max="40" value={turkceNet} onChange={(e) => setTurkceNet(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1.5">📐 Matematik Net</label>
                    <input type="number" step="0.25" min="0" max="40" value={matNet} onChange={(e) => setMatNet(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1.5">🔬 Fen Bilimleri Net</label>
                    <input type="number" step="0.25" min="0" max="20" value={fenNet} onChange={(e) => setFenNet(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-900 mb-1.5">📚 Sosyal Bilimler Net</label>
                    <input type="number" step="0.25" min="0" max="20" value={sosyalNet} onChange={(e) => setSosyalNet(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="0" />
                  </div>
                </div>
              </div>

              {/* Toplam net preview */}
              <div className="bg-navy-900 text-white rounded-xl px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">Toplam Net</span>
                <span className="text-2xl font-bold">
                  {((parseFloat(turkceNet) || 0) + (parseFloat(matNet) || 0) + (parseFloat(fenNet) || 0) + (parseFloat(sosyalNet) || 0)).toFixed(2)}
                </span>
              </div>

              <Button disabled={scoreLoading} className="w-full py-5 text-sm font-bold rounded-xl shadow-sm">
                {scoreLoading ? 'Kaydediliyor...' : 'Sonucu Kaydet'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Exam Modal */}
      {examModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative">
            <button onClick={() => { setExamModal(false); setUpExamSuccess(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-navy-900 mb-1">Sınav Tarihi Ekle</h3>
            <p className="text-sm text-slate-500 mb-6">Tüm öğrencilerin takviminde görünecek</p>
            {upExamSuccess && <div className="bg-teal-50 text-teal-700 p-3 rounded-lg text-xs font-bold mb-4">{upExamSuccess}</div>}
            <form onSubmit={handleAddUpcomingExam} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sınav Adı</label>
                <input required value={upExamName} onChange={(e) => setUpExamName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="TYT Genel Deneme #12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tarih</label>
                  <input required type="date" value={upExamDate} onChange={(e) => setUpExamDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Saat</label>
                  <input required value={upExamTime} onChange={(e) => setUpExamTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="10:15" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mekan</label>
                <input required value={upExamLocation} onChange={(e) => setUpExamLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="Büyük Salon" />
              </div>
              <Button disabled={upExamLoading} className="w-full py-5 text-sm font-bold rounded-xl shadow-sm mt-2">
                {upExamLoading ? 'Ekleniyor...' : 'Takvime Ekle'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Firestore Warning */}
      {!firestoreOk && firestoreError && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-900 space-y-3">
          <p>
            <strong>Firestore bağlantısı kurulamadı.</strong> Test modu gerekmez; normal mod + güvenlik kuralları yeterlidir.
          </p>
          <p className="text-orange-800/90">{firestoreError}</p>
          <Button type="button" variant="outline" className="text-xs" onClick={() => loadFirestoreData()}>
            Tekrar dene
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 leading-tight mb-2">Öğrenci Kayıtları</h1>
          <p className="text-slate-500 font-medium">Akademik profilleri ve sınav performanslarını yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setExamModal(true)} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full flex items-center gap-2 text-sm font-bold hover:bg-teal-100 transition-colors">
            <CalendarPlus className="w-4 h-4" /> Sınav Tarihi Ekle
          </button>
          <div className="px-4 py-2 bg-slate-100 rounded-full flex items-center gap-2 text-sm font-bold text-navy-900">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            {students.length} Kayıtlı Öğrenci
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="col-span-8">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="İsim, numara veya alana göre ara..." className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-navy-900 w-full shadow-sm" />
            </div>
          </div>

          <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white">
            <div className="bg-slate-100/50 px-8 py-4 grid grid-cols-12 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <div className="col-span-5">Öğrenci Bilgisi</div>
              <div className="col-span-4">Alan</div>
              <div className="col-span-3 text-right">İşlemler</div>
            </div>

            <div className="divide-y divide-slate-100">
              {!studentsLoaded && <div className="px-8 py-12 text-center text-slate-400 text-sm">Yükleniyor...</div>}
              {studentsLoaded && filtered.length === 0 && (
                <div className="px-8 py-12 text-center text-slate-400 text-sm">
                  {students.length === 0 ? 'Henüz kayıtlı öğrenci yok. Sağ taraftaki formdan yeni öğrenci ekleyin.' : 'Aramayla eşleşen öğrenci bulunamadı.'}
                </div>
              )}
              {filtered.map((student) => (
                <div key={student.uid} className="grid grid-cols-12 gap-4 items-center px-8 py-5 hover:bg-slate-50/50 transition-colors group">
                  <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-navy-900 text-sm mb-0.5 group-hover:text-teal-600 transition-colors">{student.name}</div>
                      <div className="text-xs text-slate-500 font-medium">No: {student.student_id} • {student.email}</div>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full flex items-center gap-1.5 w-max ${batchColor(student.batch)}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      {student.batch || 'Belirtilmemiş'}
                    </span>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <Button onClick={() => { setScoreStudent(student); setScoreModal(true); setScoreError(''); setScoreSuccess(''); }} className="gap-2 bg-navy-900 hover:bg-navy-800 rounded-xl px-5 text-xs font-bold shadow-sm">
                      <span className="text-lg leading-none mb-0.5">+</span> Not Ekle
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="text-sm text-slate-500 font-medium pl-4">{filtered.length} öğrenci listeleniyor</div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <Card className="bg-navy-900 text-white border-none shadow-md overflow-hidden relative p-8">
            <div className="flex justify-between items-start relative z-10 mb-8">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Toplam Kayıt</h3>
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold tracking-tight">{students.length}</span>
                <span className="text-sm font-medium text-slate-400">Öğrenci</span>
              </div>
              <p className="text-xs text-slate-400 max-w-[180px] leading-relaxed">{upcomingExams.length} yaklaşan sınav takvimde.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-32 h-24 flex items-end gap-2 p-4 opacity-50">
              <div className="w-4 bg-white/10 h-10 rounded-t-sm"></div>
              <div className="w-4 bg-white/20 h-16 rounded-t-sm"></div>
              <div className="w-4 bg-accent/40 h-20 rounded-t-sm"></div>
              <div className="w-4 bg-accent h-24 rounded-t-sm shadow-[0_0_15px_rgba(0,229,255,0.5)]"></div>
            </div>
          </Card>

          <Card className="p-8 border border-slate-100 shadow-sm bg-[#f8fafc] overflow-y-auto max-h-[700px]">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-5 h-5 text-navy-900" />
              <h3 className="text-lg font-bold text-navy-900">Yeni Öğrenci Kaydı</h3>
            </div>
            {enrollSuccess && <div className="bg-teal-50 text-teal-700 p-3 rounded-lg text-xs font-bold mb-4">{enrollSuccess}</div>}
            {enrollError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold mb-4">{enrollError}</div>}
            <form onSubmit={handleEnrollment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ad Soyad</label>
                <input required value={enrollName} onChange={(e) => setEnrollName(e.target.value)} type="text" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-navy-900 outline-none text-sm shadow-sm" placeholder="Örn: Emir Yılmaz" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">E-Posta (Kullanıcı Adı)</label>
                <input required value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} type="email" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-navy-900 outline-none text-sm shadow-sm" placeholder="emir@sifreakademi.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Geçici Şifre</label>
                <input required value={enrollPassword} onChange={(e) => setEnrollPassword(e.target.value)} minLength={6} type="password" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-navy-900 outline-none text-sm shadow-sm" placeholder="Min. 6 karakter" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Öğrenci No</label>
                  <input required value={enrollId} onChange={(e) => setEnrollId(e.target.value)} type="text" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-navy-900 outline-none text-sm shadow-sm" placeholder="SA-000" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Hedef Alan</label>
                  <select required value={enrollBatch} onChange={(e) => setEnrollBatch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-navy-900 outline-none text-sm text-slate-500 shadow-sm appearance-none">
                    <option value="">Seçiniz...</option>
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Dil">Dil</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <Button disabled={enrollLoading} className="w-full py-6 text-sm font-bold shadow-md rounded-xl">
                  {enrollLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

    </PageLayout>
  );
}
