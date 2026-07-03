import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { mapIdToEmail, mapPasswordToFirebase } from './auth-mapping';

const SEED_USERS = [
  { id: 'admin', password: '1234', name: '담임 선생님', role: 'admin' },
  { id: 'student1', password: 'student1', name: '학생 1', role: 'student' },
  { id: 'student2', password: 'student2', name: '학생 2', role: 'student' },
  { id: 'student3', password: 'student3', name: '학생 3', role: 'student' },
];

export async function seedInitialUsers() {
  let createdCount = 0;
  let errorMessages: string[] = [];

  for (const user of SEED_USERS) {
    const email = mapIdToEmail(user.id);
    const firebasePassword = mapPasswordToFirebase(user.password);

    try {
      // 1. Firebase Auth에 사용자 생성 시도
      const userCredential = await createUserWithEmailAndPassword(auth, email, firebasePassword);
      const authUser = userCredential.user;

      // 2. Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid,
        email: email,
        name: user.name,
        role: user.role,
        createdAt: new Date().toISOString(),
      });
      createdCount++;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        try {
          // 이미 Auth 계정이 존재하지만 Firestore 문서가 누락되었을 가능성에 대비하여,
          // 로그인 후 Firestore 문서를 강제로 덮어씌워 생성합니다.
          const userCredential = await signInWithEmailAndPassword(auth, email, firebasePassword);
          const authUser = userCredential.user;
          
          await setDoc(doc(db, 'users', authUser.uid), {
            uid: authUser.uid,
            email: email,
            name: user.name,
            role: user.role,
            createdAt: new Date().toISOString(),
          });
          createdCount++;
        } catch (signInErr: any) {
          errorMessages.push(`${user.id} 복구 실패: ${signInErr.message}`);
        }
        continue;
      }
      errorMessages.push(`${user.id}: ${error.message}`);
    }
  }

  // 생성 작업 중 로그인이 진행되었을 수 있으므로 안전하게 최종 로그아웃 처리
  await signOut(auth);

  if (errorMessages.length > 0) {
    return { success: false, createdCount, errors: errorMessages };
  }
  return { success: true, createdCount };
}
