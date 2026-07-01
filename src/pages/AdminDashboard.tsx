import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, UserPlus, Zap, X, CalendarPlus, Eye, Trash2, ClipboardList } from 'lucide-react';
import { secondaryAuth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { safeFetchCollection, safeSetDoc, safeAddDoc, safeDeleteDoc, safeFetchQuery, getFirestoreUserMessage, query, where, collection } from '../lib/firestore';
import { setDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface Student { uid: string; name: string; email: string; student_id: string; batch: string; }
interface Exam { id: string; exam_name: string; date: string; net_score: number; turkce_net?: number; mat_net?: number; fen_net?: number; sosyal_net?: number; status: string; }
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
  const [turkceNet, setTurkceNet] = useState('');
  const [matNet, setMatNet] = useState('');
  const [fenNet, setFenNet] = useState('');
  const [sosyalNet, setSosyalNet] = useState('');
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreSuccess, setScoreSuccess] = useState('');
  const [scoreError, setScoreError] = useState('');

  // Exam History Modal
  const [historyModal, setHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [historyExams, setHistoryExams] = useState<Exam[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete Student Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Upcoming Exam Modal
  const [examModal, setExamModal] = useState(false);
  const [upExamName, setUpExamName] = useState('');
  const [upExamDate, setUpExamDate] = useState('');
  const [upExamLocation, setUpExamLocation] = useState('');
  const [upExamTime, setUpExamTime] = useState('');
  const [upExamLoading, setUpExamLoading] = useState(false);
  const [upExamSuccess, setUpExamSuccess] = useState('');
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);

  // Bulk Score Modal
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkExamName, setBulkExamName] = useState('');
  const [bulkExamDate, setBulkExamDate] = useState('');
  const [bulkScores, setBulkScores] = useState<Record<string, { turkce: string; mat: string; fen: string; sosyal: string }>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState('');

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

  useEffect(() => { loadFirestoreData(); }, [loadFirestoreData]);

  // Enrollment
  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError(''); setEnrollSuccess(''); setEnrollLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, enrollEmail, enrollPassword);
      const newUid = cred.user.uid;
      const userData = { name: enrollName, email: enrollEmail, student_id: enrollId, batch: enrollBatch, role: 'student', createdAt: new Date().toISOString() };
      try { await safeSetDoc(db, 'users', newUid, userData); }
      catch (fsErr) { setDoc(doc(db, 'users', newUid), userData).catch(() => {}); }
      setStudents(prev => [...prev, { uid: newUid, name: enrollName, email: enrollEmail, student_id: enrollId, batch: enrollBatch }]);
      setEnrollSuccess('Öğrenci başarıyla kaydedildi!');
      setEnrollName(''); setEnrollEmail(''); setEnrollPassword(''); setEnrollId(''); setEnrollBatch('');
      setTimeout(() => setEnrollSuccess(''), 3000);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') setEnrollError('Bu e-posta adresi zaten kayıtlı.');
      else setEnrollError('Kayıt başarısız: ' + error.message);
    } finally { setEnrollLoading(false); }
  };

  // Add Score
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
        student_id: scoreStudent.uid, student_name: scoreStudent.name,
        exam_name: examName, date: examDate, turkce_net: turkce, mat_net: mat, fen_net: fen, sosyal_net: sosyal,
        net_score: toplamNet, score: 0, status, createdAt: new Date().toISOString()
      });
      setScoreSuccess('Not başarıyla eklendi!');
      setExamName(''); setExamDate(''); setTurkceNet(''); setMatNet(''); setFenNet(''); setSosyalNet('');
      setTimeout(() => { setScoreModal(false); setScoreSuccess(''); setScoreStudent(null); }, 1500);
    } catch (error: any) { setScoreError('Hata: ' + error.message); }
    finally { setScoreLoading(false); }
  };

  // View Exam History
  const openHistory = async (student: Student) => {
    setHistoryStudent(student);
    setHistoryModal(true);
    setHistoryLoading(true);
    try {
      const snap = await safeFetchQuery(query(collection(db, 'exams'), where('student_id', '==', student.uid)));
      const list: Exam[] = [];
      snap.forEach((d) => { list.push({ id: d.id, ...d.data() } as Exam); });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setHistoryExams(list);
    } catch (e) { console.warn('Sınav geçmişi yüklenemedi:', e); setHistoryExams([]); }
    finally { setHistoryLoading(false); }
  };

  // Delete Exam
  const handleDeleteExam = async (examId: string) => {
    try {
      await safeDeleteDoc(db, 'exams', examId);
      setHistoryExams(prev => prev.filter(e => e.id !== examId));
    } catch (e) { console.error('Sınav silinemedi:', e); }
  };

  // Delete Upcoming Exam
  const handleDeleteUpcoming = async (examId: string) => {
    try {
      await safeDeleteDoc(db, 'upcoming_exams', examId);
      setUpcomingExams(prev => prev.filter(e => e.id !== examId));
    } catch (e) { console.error('Sınav takvimden silinemedi:', e); }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await safeDeleteDoc(db, 'users', deleteConfirm.uid);
      setStudents(prev => prev.filter(s => s.uid !== deleteConfirm.uid));
      setDeleteConfirm(null);
    } catch (e) { console.error('Öğrenci silinemedi:', e); }
    finally { setDeleteLoading(false); }
  };

  // Add Upcoming Exam
  const handleAddUpcomingExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpExamLoading(true); setUpExamSuccess('');
    try {
      await safeAddDoc(db, 'upcoming_exams', { exam_name: upExamName, date: upExamDate, location: upExamLocation, time: upExamTime, createdAt: new Date().toISOString() });
      setUpcomingExams(prev => [...prev, { id: Date.now().toString(), exam_name: upExamName, date: upExamDate, location: upExamLocation, time: upExamTime }].sort((a, b) => a.date.localeCompare(b.date)));
      setUpExamSuccess('Sınav takvime eklendi!');
      setUpExamName(''); setUpExamDate(''); setUpExamLocation(''); setUpExamTime('');
      setTimeout(() => { setExamModal(false); setUpExamSuccess(''); }, 1500);
    } catch (error: any) { console.error(error); }
    finally { setUpExamLoading(false); }
  };

  // Bulk Score
  const openBulkModal = () => {
    setBulkModal(true);
    setBulkExamName(''); setBulkExamDate(''); setBulkSuccess('');
    const initial: Record<string, { turkce: string; mat: string; fen: string; sosyal: string }> = {};
    students.forEach(s => { initial[s.uid] = { turkce: '', mat: '', fen: '', sosyal: '' }; });
    setBulkScores(initial);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkLoading(true); setBulkSuccess('');
    try {
      const promises: Promise<any>[] = [];
      for (const student of students) {
        const s = bulkScores[student.uid];
        if (!s) continue;
        const turkce = parseFloat(s.turkce) || 0;
        const mat = parseFloat(s.mat) || 0;
        const fen = parseFloat(s.fen) || 0;
        const sosyal = parseFloat(s.sosyal) || 0;
        const toplamNet = turkce + mat + fen + sosyal;
        if (toplamNet === 0) continue; // Boş bırakılmış, atla
        let status = 'GEÇTİ';
        if (toplamNet >= 90) status = 'MÜKEMMEL';
        else if (toplamNet >= 60) status = 'BAŞARILI';
        promises.push(safeAddDoc(db, 'exams', {
          student_id: student.uid, student_name: student.name,
          exam_name: bulkExamName, date: bulkExamDate, turkce_net: turkce, mat_net: mat, fen_net: fen, sosyal_net: sosyal,
          net_score: toplamNet, score: 0, status, createdAt: new Date().toISOString()
        }));
      }
      await Promise.all(promises);
      setBulkSuccess(`${promises.length} öğrencinin notu başarıyla kaydedildi!`);
      setTimeout(() => { setBulkModal(false); setBulkSuccess(''); }, 2000);
    } catch (error: any) { console.error(error); }
    finally { setBulkLoading(false); }
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

  const formatDate = (s: string) => {
    const d = new Date(s);
    const m = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <PageLayout role="admin">
      {/* Score Modal */}
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
              <div className="bg-navy-900 text-white rounded-xl px-5 py-3 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">Toplam Net</span>
                <span className="text-2xl font-bold">{((parseFloat(turkceNet) || 0) + (parseFloat(matNet) || 0) + (parseFloat(fenNet) || 0) + (parseFloat(sosyalNet) || 0)).toFixed(2)}</span>
              </div>
              <Button disabled={scoreLoading} className="w-full py-5 text-sm font-bold rounded-xl shadow-sm">{scoreLoading ? 'Kaydediliyor...' : 'Sonucu Kaydet'}</Button>
            </form>
          </div>
        </div>
      )}

      {/* Exam History Modal */}
      {historyModal && historyStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => { setHistoryModal(false); setHistoryStudent(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-navy-900 mb-1">Sınav Geçmişi</h3>
            <p className="text-sm text-slate-500 mb-6">{historyStudent.name} — {historyExams.length} sınav kaydı</p>
            {historyLoading ? (
              <div className="text-center text-slate-400 py-8">Yükleniyor...</div>
            ) : historyExams.length === 0 ? (
              <div className="text-center text-slate-400 py-8">Bu öğrenciye ait sınav kaydı bulunamadı.</div>
            ) : (
              <div className="space-y-3">
                {historyExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-5 py-4 group">
                    <div className="flex-1">
                      <div className="font-bold text-navy-900 text-sm mb-1">{exam.exam_name}</div>
                      <div className="text-xs text-slate-500 font-medium">{formatDate(exam.date)}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Trk</div>
                        <div className="text-sm font-bold text-navy-900">{exam.turkce_net ?? '—'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Mat</div>
                        <div className="text-sm font-bold text-navy-900">{exam.mat_net ?? '—'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Fen</div>
                        <div className="text-sm font-bold text-navy-900">{exam.fen_net ?? '—'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Sos</div>
                        <div className="text-sm font-bold text-navy-900">{exam.sosyal_net ?? '—'}</div>
                      </div>
                      <div className="text-center border-l border-slate-200 pl-4">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">Toplam</div>
                        <div className="text-lg font-bold text-navy-900">{exam.net_score}</div>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md ${
                        exam.status === 'MÜKEMMEL' ? 'bg-orange-100 text-orange-700'
                        : exam.status === 'BAŞARILI' ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>{exam.status}</span>
                      <button onClick={() => handleDeleteExam(exam.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Student Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-2">Öğrenciyi Sil</h3>
            <p className="text-sm text-slate-500 mb-6"><strong>{deleteConfirm.name}</strong> adlı öğrencinin tüm verileri silinecek. Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteConfirm(null)} variant="secondary" className="flex-1 py-4 rounded-xl">İptal</Button>
              <Button onClick={handleDeleteStudent} disabled={deleteLoading} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white">
                {deleteLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </Button>
            </div>
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
              <Button disabled={upExamLoading} className="w-full py-5 text-sm font-bold rounded-xl shadow-sm mt-2">{upExamLoading ? 'Ekleniyor...' : 'Takvime Ekle'}</Button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Score Modal */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setBulkModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-navy-900 mb-1">Toplu Not Girişi</h3>
            <p className="text-sm text-slate-500 mb-6">Tek seferde tüm öğrencilerin netlerini girin. Boş bırakılan öğrenciler atlanır.</p>
            {bulkSuccess && <div className="bg-teal-50 text-teal-700 p-3 rounded-lg text-xs font-bold mb-4">{bulkSuccess}</div>}
            <form onSubmit={handleBulkSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Sınav Adı</label>
                  <input required value={bulkExamName} onChange={(e) => setBulkExamName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" placeholder="TYT Genel Deneme #5" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tarih</label>
                  <input required type="date" value={bulkExamDate} onChange={(e) => setBulkExamDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
              </div>
              <div className="bg-slate-100/50 px-4 py-3 rounded-t-xl grid grid-cols-12 gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <div className="col-span-4">Öğrenci</div>
                <div className="col-span-2 text-center">Türkçe</div>
                <div className="col-span-2 text-center">Matematik</div>
                <div className="col-span-2 text-center">Fen</div>
                <div className="col-span-2 text-center">Sosyal</div>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-b-xl mb-6">
                {students.map((student) => (
                  <div key={student.uid} className="grid grid-cols-12 gap-2 items-center px-4 py-3">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center text-white font-bold text-xs">{student.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-bold text-navy-900 text-xs">{student.name}</div>
                        <div className="text-[10px] text-slate-400">{student.student_id}</div>
                      </div>
                    </div>
                    <div className="col-span-2"><input type="number" step="0.25" min="0" max="40" value={bulkScores[student.uid]?.turkce || ''} onChange={(e) => setBulkScores(prev => ({ ...prev, [student.uid]: { ...prev[student.uid], turkce: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-navy-900" placeholder="—" /></div>
                    <div className="col-span-2"><input type="number" step="0.25" min="0" max="40" value={bulkScores[student.uid]?.mat || ''} onChange={(e) => setBulkScores(prev => ({ ...prev, [student.uid]: { ...prev[student.uid], mat: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-navy-900" placeholder="—" /></div>
                    <div className="col-span-2"><input type="number" step="0.25" min="0" max="20" value={bulkScores[student.uid]?.fen || ''} onChange={(e) => setBulkScores(prev => ({ ...prev, [student.uid]: { ...prev[student.uid], fen: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-navy-900" placeholder="—" /></div>
                    <div className="col-span-2"><input type="number" step="0.25" min="0" max="20" value={bulkScores[student.uid]?.sosyal || ''} onChange={(e) => setBulkScores(prev => ({ ...prev, [student.uid]: { ...prev[student.uid], sosyal: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center outline-none focus:ring-2 focus:ring-navy-900" placeholder="—" /></div>
                  </div>
                ))}
              </div>
              <Button disabled={bulkLoading} className="w-full py-5 text-sm font-bold rounded-xl shadow-sm">{bulkLoading ? 'Kaydediliyor...' : 'Tüm Notları Kaydet'}</Button>
            </form>
          </div>
        </div>
      )}

      {/* Firestore Warning */}
      {!firestoreOk && firestoreError && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-900 space-y-3">
          <p><strong>Firestore bağlantısı kurulamadı.</strong></p>
          <p className="text-orange-800/90">{firestoreError}</p>
          <Button type="button" variant="outline" className="text-xs" onClick={() => loadFirestoreData()}>Tekrar dene</Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 leading-tight mb-1 sm:mb-2">Öğrenci Kayıtları</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Akademik profilleri ve sınav performanslarını yönetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={openBulkModal} className="px-3 sm:px-4 py-2 bg-navy-900 text-white rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold hover:bg-navy-800 transition-colors">
            <ClipboardList className="w-4 h-4" /> <span className="hidden sm:inline">Toplu Not Girişi</span><span className="sm:hidden">Toplu Not</span>
          </button>
          <button onClick={() => setExamModal(true)} className="px-3 sm:px-4 py-2 bg-teal-50 text-teal-700 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold hover:bg-teal-100 transition-colors">
            <CalendarPlus className="w-4 h-4" /> <span className="hidden sm:inline">Sınav Tarihi Ekle</span><span className="sm:hidden">Sınav Ekle</span>
          </button>
          <div className="px-3 sm:px-4 py-2 bg-slate-100 rounded-full flex items-center gap-2 text-xs sm:text-sm font-bold text-navy-900">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            {students.length} Öğrenci
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="İsim, numara veya alan ara..." className="pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-navy-900 w-full shadow-sm" />
            </div>
          </div>

          {/* Desktop Table */}
          <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white hidden md:block">
            <div className="bg-slate-100/50 px-6 lg:px-8 py-4 grid grid-cols-12 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <div className="col-span-4">Öğrenci Bilgisi</div>
              <div className="col-span-3">Alan</div>
              <div className="col-span-5 text-right">İşlemler</div>
            </div>

            <div className="divide-y divide-slate-100">
              {!studentsLoaded && <div className="px-8 py-12 text-center text-slate-400 text-sm">Yükleniyor...</div>}
              {studentsLoaded && filtered.length === 0 && (
                <div className="px-8 py-12 text-center text-slate-400 text-sm">
                  {students.length === 0 ? 'Henüz kayıtlı öğrenci yok.' : 'Aramayla eşleşen öğrenci bulunamadı.'}
                </div>
              )}
              {filtered.map((student) => (
                <div key={student.uid} className="grid grid-cols-12 gap-4 items-center px-6 lg:px-8 py-5 hover:bg-slate-50/50 transition-colors group">
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-navy-900 text-sm mb-0.5 group-hover:text-teal-600 transition-colors">{student.name}</div>
                      <div className="text-xs text-slate-500 font-medium">No: {student.student_id} • {student.email}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full flex items-center gap-1.5 w-max ${batchColor(student.batch)}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      {student.batch || 'Belirtilmemiş'}
                    </span>
                  </div>
                  <div className="col-span-5 flex justify-end gap-2">
                    <button onClick={() => openHistory(student)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors" title="Geçmiş">
                      <Eye className="w-3.5 h-3.5" /> Geçmiş
                    </button>
                    <Button onClick={() => { setScoreStudent(student); setScoreModal(true); setScoreError(''); setScoreSuccess(''); }} className="gap-1.5 bg-navy-900 hover:bg-navy-800 rounded-xl px-4 text-xs font-bold shadow-sm">
                      <span className="text-lg leading-none">+</span> Not Ekle
                    </Button>
                    <button onClick={() => setDeleteConfirm(student)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sil">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {!studentsLoaded && <div className="text-center text-slate-400 text-sm py-8">Yükleniyor...</div>}
            {studentsLoaded && filtered.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">
                {students.length === 0 ? 'Henüz kayıtlı öğrenci yok.' : 'Aramayla eşleşen öğrenci bulunamadı.'}
              </div>
            )}
            {filtered.map((student) => (
              <Card key={student.uid} className="p-4 border border-slate-100 shadow-sm bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-navy-900 text-sm truncate">{student.name}</div>
                    <div className="text-xs text-slate-500 font-medium truncate">No: {student.student_id} • {student.email}</div>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full shrink-0 ${batchColor(student.batch)}`}>
                    {student.batch || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => openHistory(student)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Geçmiş
                  </button>
                  <button onClick={() => { setScoreStudent(student); setScoreModal(true); setScoreError(''); setScoreSuccess(''); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-navy-900 text-white hover:bg-navy-800 transition-colors">
                    <span className="text-base leading-none">+</span> Not Ekle
                  </button>
                  <button onClick={() => setDeleteConfirm(student)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
            {filtered.length > 0 && (
              <div className="text-xs text-slate-400 text-center py-2">{filtered.length} öğrenci listeleniyor</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6 order-1 lg:order-2">
          <Card className="bg-navy-900 text-white border-none shadow-md overflow-hidden relative p-5 sm:p-8">
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

          {/* Upcoming Exams List */}
          {upcomingExams.length > 0 && (
            <Card className="p-6 border border-slate-100 shadow-sm bg-white">
              <h3 className="text-sm font-bold text-navy-900 mb-4">Yaklaşan Sınavlar</h3>
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 group">
                    <div>
                      <div className="font-bold text-navy-900 text-xs">{exam.exam_name}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(exam.date)} • {exam.time} • {exam.location}</div>
                    </div>
                    <button onClick={() => handleDeleteUpcoming(exam.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-8 border border-slate-100 shadow-sm bg-[#f8fafc] overflow-y-auto max-h-[700px]">
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
                <Button disabled={enrollLoading} className="w-full py-6 text-sm font-bold shadow-md rounded-xl">{enrollLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
