import { useEffect, useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { safeFetchCollection, safeFetchQuery, query, where, collection } from '../lib/firestore';

interface Exam {
  id: string; exam_name: string; date: string; score: number; net_score: number; status: string;
  turkce_net?: number; mat_net?: number; fen_net?: number; sosyal_net?: number;
}
interface UpcomingExam { id: string; exam_name: string; date: string; location: string; time: string; }

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let done = false;
    const fetchData = async () => {
      try {
        const examSnap = await safeFetchQuery(query(collection(db, 'exams'), where('student_id', '==', user.uid)));
        const examList: Exam[] = [];
        examSnap.forEach((d) => { examList.push({ id: d.id, ...d.data() } as Exam); });
        examList.sort((a, b) => b.date.localeCompare(a.date));
        if (!done) setExams(examList);
      } catch (e) { console.warn('Sınav sonuçları yüklenemedi:', e); }

      try {
        const upSnap = await safeFetchCollection('upcoming_exams', db);
        const upList: UpcomingExam[] = [];
        upSnap.forEach((d) => { upList.push({ id: d.id, ...d.data() } as UpcomingExam); });
        upList.sort((a, b) => a.date.localeCompare(b.date));
        if (!done) setUpcomingExams(upList);
      } catch (e) { console.warn('Sınav takvimi yüklenemedi:', e); }

      if (!done) setLoading(false);
    };
    fetchData();
    return () => { done = true; };
  }, [user]);

  const avgNet = exams.length > 0 ? (exams.reduce((s, e) => s + (e.net_score || 0), 0) / exams.length).toFixed(1) : '—';
  const totalExams = exams.length;
  let trendText = '';
  let trendPositive = true;
  if (exams.length >= 2) {
    const diff = (exams[0].net_score || 0) - (exams[1].net_score || 0);
    trendPositive = diff >= 0;
    trendText = `${trendPositive ? '+' : ''}${diff.toFixed(1)} net`;
  }

  const chartData = [...exams].reverse().map(e => {
    const d = new Date(e.date);
    const mn = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return { name: `${d.getDate()} ${mn[d.getMonth()]}`, score: e.net_score || 0 };
  });

  const formatDate = (s: string) => {
    const d = new Date(s);
    const m = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
  };

  const fmtShort = (s: string) => {
    const d = new Date(s);
    const mn = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    return { day: d.getDate().toString(), month: mn[d.getMonth()] };
  };

  return (
    <PageLayout role="student">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 leading-tight">Şifre Akademi</h1>
          <p className="text-sm text-slate-500 font-medium">Tekrar hoş geldin, {user?.name || user?.email?.split('@')[0] || 'Öğrenci'}</p>
        </div>
        <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {(user?.name || user?.email || 'Ö').charAt(0).toUpperCase()}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold">Veriler yükleniyor...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2 grid grid-cols-2 gap-6">
              {/* Net Average */}
              <Card className="p-8 border border-slate-100 shadow-sm relative overflow-hidden bg-white group">
                <div className="absolute top-4 right-4 flex gap-1 text-orange-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </div>
                <div className="inline-block px-3 py-1 bg-accent/20 text-teal-700 text-[10px] font-bold tracking-wider rounded-full mb-6">NET ORTALAMASI</div>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-bold text-navy-900 tracking-tight">{avgNet}</span>
                  <span className="text-slate-500 font-medium pb-1">Net</span>
                </div>
                {trendText && (
                  <div className={`text-xs font-bold ${trendPositive ? 'text-teal-600' : 'text-red-500'} flex items-center gap-1.5 mb-4`}>
                    {trendPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} Son sınava göre {trendText}
                  </div>
                )}
                <p className="text-sm text-slate-600">Toplam <strong className="text-navy-900 font-bold">{totalExams}</strong> sınav sonucu mevcut.</p>
              </Card>

              {/* Exam Count */}
              <Card className="p-8 border border-slate-100 shadow-sm bg-slate-50">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Sınav Sayısı</h3>
                <div className="text-5xl font-bold text-navy-900 mb-2 tracking-tight">{totalExams}</div>
                <div className="text-xs font-bold text-teal-600 mb-12 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Toplam Girilen Deneme
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
                  <div className="bg-teal-500 h-full rounded-full shadow-sm" style={{width: `${Math.min(totalExams * 5, 100)}%`}}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Hedef: 20 Deneme</span>
                  <span className="text-navy-900">%{Math.min(totalExams * 5, 100)}</span>
                </div>
              </Card>
            </div>

            {/* Upcoming Exams */}
            <div className="col-span-1 row-span-2 flex flex-col">
              <h3 className="text-lg font-bold text-navy-900 mb-6">Yaklaşan Sınavlar</h3>
              <div className="space-y-4 flex-1">
                {upcomingExams.length === 0 && <div className="text-sm text-slate-400 text-center py-8">Takvimde yaklaşan sınav yok.</div>}
                {upcomingExams.slice(0, 4).map((exam, i) => {
                  const { day, month } = fmtShort(exam.date);
                  return (
                    <Card key={exam.id} className={`p-5 border ${i === 0 ? 'border-navy-900/20 shadow-md' : 'border-slate-100 shadow-sm'} flex gap-5 items-center bg-white`}>
                      <div className="flex flex-col items-center justify-center border-r border-slate-100 pr-5 min-w-[70px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{month}</span>
                        <span className="text-xl font-bold text-navy-900">{day}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-navy-900 text-sm mb-1">{exam.exam_name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{exam.location} • {exam.time}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 ? (
              <Card className="col-span-2 p-8 border border-slate-100 shadow-sm bg-white">
                <h3 className="text-lg font-bold text-navy-900 mb-10">Net Artış Grafiği</h3>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} dy={15} />
                      <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold', fontSize: '12px', color: '#0a1930'}} />
                      <Line type="monotone" dataKey="score" stroke="#cbd5e1" strokeWidth={2} dot={{r: 4, fill: '#0a1930', strokeWidth: 0}} activeDot={{r: 6, fill: '#00e5ff', strokeWidth: 3, stroke: '#0a1930'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : (
              <Card className="col-span-2 p-8 border border-slate-100 shadow-sm bg-white flex items-center justify-center">
                <p className="text-slate-400 text-sm font-medium py-16">Grafik için en az 2 sınav sonucu gereklidir.</p>
              </Card>
            )}
          </div>

          {/* Exam Results Table */}
          <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-navy-900">Geçmiş Sınav Sonuçları</h3>
            </div>
            <div className="bg-[#f8fafc] px-6 py-4 grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <div className="col-span-3">Sınav Adı</div>
              <div className="col-span-2">Tarih</div>
              <div className="col-span-1 text-center">🇹🇷 Trk</div>
              <div className="col-span-1 text-center">📐 Mat</div>
              <div className="col-span-1 text-center">🔬 Fen</div>
              <div className="col-span-1 text-center">📚 Sos</div>
              <div className="col-span-1 text-center">Toplam</div>
              <div className="col-span-2 text-right">Durum</div>
            </div>
            <div className="divide-y divide-slate-100">
              {exams.length === 0 && <div className="px-8 py-12 text-center text-slate-400 text-sm">Henüz sınav sonucu bulunmuyor.</div>}
              {exams.map((exam) => (
                <div key={exam.id} className="grid grid-cols-12 gap-2 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-3 font-bold text-navy-900 text-sm">{exam.exam_name}</div>
                  <div className="col-span-2 text-xs font-semibold text-navy-900">{formatDate(exam.date)}</div>
                  <div className="col-span-1 text-center text-sm font-bold text-slate-600">{exam.turkce_net ?? '—'}</div>
                  <div className="col-span-1 text-center text-sm font-bold text-slate-600">{exam.mat_net ?? '—'}</div>
                  <div className="col-span-1 text-center text-sm font-bold text-slate-600">{exam.fen_net ?? '—'}</div>
                  <div className="col-span-1 text-center text-sm font-bold text-slate-600">{exam.sosyal_net ?? '—'}</div>
                  <div className="col-span-1 text-center text-lg font-bold text-navy-900">{exam.net_score}</div>
                  <div className="col-span-2 text-right flex justify-end">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                      exam.status === 'MÜKEMMEL' ? 'bg-orange-100 text-orange-700'
                      : exam.status === 'BAŞARILI' ? 'bg-teal-100 text-teal-700'
                      : 'bg-slate-100 text-slate-600'
                    }`}>{exam.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </PageLayout>
  );
}
