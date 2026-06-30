import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'student';
  name?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        
        // 1. Önce e-posta kontrolü yapıyoruz (veritabanı hatası vb durumlara düşmemesi için en kesin çözüm)
        const primaryAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'yonetici@sifreakademi.com';
        const isAdminEmail = 
          firebaseUser.email?.toLowerCase() === primaryAdminEmail.toLowerCase() || 
          firebaseUser.email?.toLowerCase() === 'yonetici@sifreakademi.com';

        if (isAdminEmail) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin', name: 'Sistem Yöneticisi' });
          setLoading(false);
          
          // Arka planda yine de firestore'a kaydını deneriz ama kullanıcıyı bekletmeyiz
          import('firebase/firestore').then(({ setDoc }) => {
            const docRef = doc(db, 'users', firebaseUser.uid);
            setDoc(docRef, { role: 'admin', email: firebaseUser.email, name: 'Sistem Yöneticisi', createdAt: new Date().toISOString() }).catch(() => {});
          });
          return;
        }

        // 2. Admin değilse Firestore'dan bakıyoruz (Öğrenci girişi)
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await Promise.race([
            getDoc(docRef),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
          ]);
          
          let role: 'admin' | 'student' = 'student';
          let name = '';
          if (docSnap.exists()) {
            role = docSnap.data().role as 'admin' | 'student';
            name = docSnap.data().name || '';
          }
          
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role, name });
        } catch (e) {
          console.error("Error fetching user role:", e);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'student' });
        }

      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    
    // 1. E-posta kontrolü ile anında admin onayı
    const primaryAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'yonetici@sifreakademi.com';
    const isAdminEmail = 
      email.toLowerCase() === primaryAdminEmail.toLowerCase() || 
      email.toLowerCase() === 'yonetici@sifreakademi.com';

    if (isAdminEmail) return 'admin'; // Veritabanına hiç bakmadan doğrudan Admin paneline yönlendirir

    // 2. Admin değilse Firestore kontrolü
    let role = 'student';
    try {
      const docRef = doc(db, 'users', res.user.uid);
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
      ]);
      if (docSnap.exists()) {
        role = docSnap.data().role;
      }
    } catch(err) {
      console.warn("Firestore rol okuma hatası", err);
    }
    return role;
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
