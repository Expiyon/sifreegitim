import { getDocs, getDoc, setDoc, addDoc, collection, doc, query, where } from 'firebase/firestore';
import type { DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';

const READ_TIMEOUT = 15000;
const WRITE_TIMEOUT = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('Firestore zaman aşımı'), { code: 'timeout' })), ms)
    ),
  ]);
}

/** Kullanıcıya gösterilecek Türkçe Firestore hata metni */
export function getFirestoreUserMessage(err: unknown, loginEmail?: string | null): string {
  const code = (err as { code?: string })?.code;
  const projectId = 'sifreegitim-ccafc';

  if (code === 'permission-denied') {
    const emailHint = loginEmail
      ? `Şu an giriş yaptığınız adres: ${loginEmail}. Bu e-posta firestore.rules içindeki admin listesinde olmalı veya users koleksiyonunda role: "admin" kaydı bulunmalı.`
      : 'Giriş yaptığınız e-postanın firestore.rules admin listesinde olduğundan emin olun.';
    return `Firestore erişimi reddedildi. ${emailHint} Kuralları "${projectId}" projesine yükleyin: firebase deploy --only firestore:rules`;
  }
  if (code === 'timeout' || (err instanceof Error && err.message === 'Firestore zaman aşımı')) {
    return 'Firestore yanıt vermedi. İnternet bağlantınızı kontrol edin; Firebase Console → Firestore Database bölümünde veritabanının oluşturulduğundan emin olun.';
  }
  if (code === 'unavailable') {
    return 'Firestore geçici olarak kullanılamıyor. Birkaç saniye sonra sayfayı yenileyin.';
  }
  if (err instanceof Error && err.message) {
    return `Firestore hatası: ${err.message}`;
  }
  return 'Firestore bağlantısı kurulamadı. Firebase projesi ve güvenlik kurallarını kontrol edin.';
}

export async function safeFetchCollection(collectionName: string, db: any): Promise<QuerySnapshot<DocumentData>> {
  return withTimeout(getDocs(collection(db, collectionName)), READ_TIMEOUT);
}

export async function safeFetchQuery(q: any): Promise<QuerySnapshot<DocumentData>> {
  return withTimeout(getDocs(q), READ_TIMEOUT);
}

export async function safeFetchDoc(db: any, collectionName: string, docId: string): Promise<DocumentSnapshot<DocumentData>> {
  return withTimeout(getDoc(doc(db, collectionName, docId)), READ_TIMEOUT);
}

export async function safeSetDoc(db: any, collectionName: string, docId: string, data: any): Promise<void> {
  return withTimeout(setDoc(doc(db, collectionName, docId), data), WRITE_TIMEOUT);
}

export async function safeAddDoc(db: any, collectionName: string, data: any) {
  return withTimeout(addDoc(collection(db, collectionName), data), WRITE_TIMEOUT);
}

export { query, where, collection, doc };
