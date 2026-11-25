import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Crown,
  Download,
  Info,
  LogOut,
  MessageCircle,
  ShieldCheck,
  TriangleAlert,
  User as UserIcon,
  X,
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AdminMember,
  BillingCycle,
  Certificate,
  Lesson,
  PaymentMethod,
  PaymentReceipt,
  PayoutRequest,
  PlatformState,
  PortalTab,
  ReceiptStatus,
  RosterStudent,
  SectionType,
  TeacherMember,
  TeachingMethod,
  ToastMessage,
  UserProfile,
  UserRole,
} from './types';
import {
  DEFAULT_PLATFORM_STATE,
  WHATSAPP_NUMBER_DISPLAY,
  buildWhatsAppLink,
  createSampleReceiptSvg,
  formatDzd,
} from './data/initialData';
import {
  BOOTSTRAP_DIRECTOR_EMAIL,
  OperationType,
  auth,
  db,
  generateSafeDocId,
  handleFirestoreError,
  signInWithGoogle,
  signOutUser,
  testConnection,
} from './firebase';
import { AuthGate } from './components/AuthGate';
import { PortalNav } from './components/PortalNav';
import { StudentPortal } from './components/StudentPortal';
import { ParentPortal } from './components/ParentPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { AdminPortal } from './components/AdminPortal';
import { SectionsPortal } from './components/SectionsPortal';
import {
  CertificateModal,
  ReceiptModal,
  RosterModal,
  SecurityScanModal,
} from './components/Modals';
import { downloadApplicationSourceZip } from './utils/exportSourceCode';

function tsMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    try {
      return (value as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

export default function App() {
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [preferredRole, setPreferredRole] = useState<'student' | 'parent'>('student');

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasAdminDoc, setHasAdminDoc] = useState<boolean>(false);
  const [hasTeacherDoc, setHasTeacherDoc] = useState<boolean>(false);
  const [platformDocExists, setPlatformDocExists] = useState<boolean>(false);
  const [financeDocExists, setFinanceDocExists] = useState<boolean>(false);

  const [state, setState] = useState<PlatformState>(DEFAULT_PLATFORM_STATE);
  const [activeTab, setActiveTab] = useState<PortalTab>('student');
  const [rosterOpen, setRosterOpen] = useState<boolean>(false);
  const [securityOpen, setSecurityOpen] = useState<boolean>(false);
  const [previewReceipt, setPreviewReceipt] = useState<PaymentReceipt | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [isExportingSource, setIsExportingSource] = useState<boolean>(false);
  const [readySourceDownload, setReadySourceDownload] = useState<{
    fileName: string;
    fileCount: number;
    downloadUrl: string;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef<number>(1);

  if (fatalError) {
    throw fatalError;
  }

  const notify = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const reportFatalFirestoreError = useCallback(
    (error: unknown, operationType: OperationType, path: string | null) => {
      try {
        handleFirestoreError(error, operationType, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
    []
  );

  const isVerifiedUser = Boolean(firebaseUser && firebaseUser.emailVerified);
  const isBootstrapAdmin = Boolean(
    isVerifiedUser &&
      firebaseUser?.email?.toLowerCase() === BOOTSTRAP_DIRECTOR_EMAIL.toLowerCase()
  );
  const isAdmin = isBootstrapAdmin || hasAdminDoc;
  const isTeacher = isAdmin || hasTeacherDoc;

  const effectiveRole: UserRole | null = !isVerifiedUser
    ? null
    : isAdmin
    ? 'admin'
    : isTeacher
    ? 'teacher'
    : userProfile?.role ?? preferredRole;

  // 1. Connection & Firebase Auth State Listener
  useEffect(() => {
    void testConnection().then(setDbConnected);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setUserProfile(null);
        setHasAdminDoc(false);
        setHasTeacherDoc(false);
        setState((prev) => ({
          ...DEFAULT_PLATFORM_STATE,
          ccp: prev.ccp,
          baridi: prev.baridi,
          prices: prev.prices,
          annualPrices: prev.annualPrices,
          sectionsMeta: prev.sectionsMeta,
          activeSection: prev.activeSection,
          billingCycle: prev.billingCycle,
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Public Platform Settings Listener (readable even before sign-in)
  useEffect(() => {
    const ref = doc(db, 'settings', 'platform');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setDbConnected(true);
        if (!snap.exists()) {
          setPlatformDocExists(false);
          return;
        }
        setPlatformDocExists(true);
        const d = snap.data();
        setState((prev) => ({
          ...prev,
          ccp: typeof d.ccp === 'string' ? d.ccp : prev.ccp,
          baridi: typeof d.baridi === 'string' ? d.baridi : prev.baridi,
          prices: {
            'قسم خاص فردي':
              typeof d.pricePrivate === 'number' ? d.pricePrivate : prev.prices['قسم خاص فردي'],
            'قسم مجموعة مصغرة (8-10 تلاميذ)':
              typeof d.priceSmall === 'number'
                ? d.priceSmall
                : prev.prices['قسم مجموعة مصغرة (8-10 تلاميذ)'],
            'قسم جماعي (عدد غير محدود)':
              typeof d.priceGroup === 'number'
                ? d.priceGroup
                : prev.prices['قسم جماعي (عدد غير محدود)'],
          },
          annualPrices: {
            'قسم خاص فردي':
              typeof d.annualPricePrivate === 'number'
                ? d.annualPricePrivate
                : prev.annualPrices['قسم خاص فردي'],
            'قسم مجموعة مصغرة (8-10 تلاميذ)':
              typeof d.annualPriceSmall === 'number'
                ? d.annualPriceSmall
                : prev.annualPrices['قسم مجموعة مصغرة (8-10 تلاميذ)'],
            'قسم جماعي (عدد غير محدود)':
              typeof d.annualPriceGroup === 'number'
                ? d.annualPriceGroup
                : prev.annualPrices['قسم جماعي (عدد غير محدود)'],
          },
          sectionsMeta: {
            'قسم خاص فردي': {
              ...prev.sectionsMeta['قسم خاص فردي'],
              reg: typeof d.privateReg === 'number' ? d.privateReg : 0,
              pres: typeof d.privatePres === 'number' ? d.privatePres : 0,
            },
            'قسم مجموعة مصغرة (8-10 تلاميذ)': {
              ...prev.sectionsMeta['قسم مجموعة مصغرة (8-10 تلاميذ)'],
              reg: typeof d.smallReg === 'number' ? d.smallReg : 0,
              pres: typeof d.smallPres === 'number' ? d.smallPres : 0,
            },
            'قسم جماعي (عدد غير محدود)': {
              ...prev.sectionsMeta['قسم جماعي (عدد غير محدود)'],
              reg: typeof d.groupReg === 'number' ? d.groupReg : 0,
              pres: typeof d.groupPres === 'number' ? d.groupPres : 0,
            },
          },
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.GET, 'settings/platform')
    );
    return () => unsub();
  }, [reportFatalFirestoreError]);

  // 3. Provision User Profile & Bootstrap Director Workspace
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified || !firebaseUser.email) {
      return;
    }

    let cancelled = false;
    const uid = firebaseUser.uid;
    const email = firebaseUser.email;
    const displayName = (
      firebaseUser.displayName ||
      (isBootstrapAdmin ? 'الأستاذة ليلى (المديرة العامة)' : email.split('@')[0])
    ).slice(0, 100);

    const bootstrapWorkspace = async () => {
      // Ensure user profile doc exists
      const userRef = doc(db, 'users', uid);
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const initialRole: UserRole = isBootstrapAdmin ? 'admin' : preferredRole;
          await setDoc(userRef, {
            uid,
            displayName,
            email,
            role: initialRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (!cancelled) {
            setUserProfile({ uid, displayName, email, role: initialRole });
            if (initialRole === 'parent') setActiveTab('parent');
          }
        } else {
          const data = userSnap.data();
          const role = (data.role as UserRole) || 'student';
          if (!cancelled) {
            setUserProfile({
              uid,
              displayName: String(data.displayName || displayName),
              email: String(data.email || email),
              role,
              firstName: typeof data.firstName === 'string' ? data.firstName : undefined,
              lastName: typeof data.lastName === 'string' ? data.lastName : undefined,
              birthDate: typeof data.birthDate === 'string' ? data.birthDate : undefined,
              ccp: typeof data.ccp === 'string' ? data.ccp : undefined,
              baridi: typeof data.baridi === 'string' ? data.baridi : undefined,
              phone: typeof data.phone === 'string' ? data.phone : undefined,
              level: typeof data.level === 'string' ? data.level : undefined,
              stream: typeof data.stream === 'string' ? data.stream : undefined,
              subject: typeof data.subject === 'string' ? data.subject : undefined,
            });
          }
        }
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        return;
      }

      // Bootstrap primary director documents if missing
      if (isBootstrapAdmin) {
        try {
          const adminDocRef = doc(db, 'admins', uid);
          const adminSnap = await getDoc(adminDocRef);
          if (!adminSnap.exists()) {
            await setDoc(adminDocRef, {
              uid,
              name: displayName,
              email: email.toLowerCase(),
              isPrimary: true,
              addedBy: uid,
              createdAt: serverTimestamp(),
            });
          }
        } catch (err) {
          reportFatalFirestoreError(err, OperationType.CREATE, `admins/${uid}`);
        }

        try {
          const platformRef = doc(db, 'settings', 'platform');
          const platformSnap = await getDoc(platformRef);
          if (!platformSnap.exists()) {
            const batch = writeBatch(db);
            batch.set(platformRef, {
              ccp: DEFAULT_PLATFORM_STATE.ccp,
              baridi: DEFAULT_PLATFORM_STATE.baridi,
              pricePrivate: DEFAULT_PLATFORM_STATE.prices['قسم خاص فردي'],
              priceSmall: DEFAULT_PLATFORM_STATE.prices['قسم مجموعة مصغرة (8-10 تلاميذ)'],
              priceGroup: DEFAULT_PLATFORM_STATE.prices['قسم جماعي (عدد غير محدود)'],
              annualPricePrivate: DEFAULT_PLATFORM_STATE.annualPrices['قسم خاص فردي'],
              annualPriceSmall:
                DEFAULT_PLATFORM_STATE.annualPrices['قسم مجموعة مصغرة (8-10 تلاميذ)'],
              annualPriceGroup:
                DEFAULT_PLATFORM_STATE.annualPrices['قسم جماعي (عدد غير محدود)'],
              privateReg: 0,
              privatePres: 0,
              smallReg: 4,
              smallPres: 4,
              groupReg: 28,
              groupPres: 25,
              updatedBy: uid,
              updatedAt: serverTimestamp(),
            });

            // Seed starter educational lessons & honor certificate once
            const starterLessons: {
              title: string;
              level: string;
              stream: string;
              subject: string;
              method: TeachingMethod;
              link: string;
              fileName: string;
              allowDownload: boolean;
              time: string;
            }[] = [
              {
                title: 'المراجعة النهائية في الدوال الأسية واللوغاريتمية (بكالوريا)',
                level: 'السنة الثالثة ثانوي',
                stream: 'علوم تجريبية (بكالوريا)',
                subject: 'الرياضيات',
                method: 'Zoom',
                link: 'https://zoom.us',
                fileName: 'ملخص_الدوال_بكالوريا_النبراس.pdf',
                allowDownload: true,
                time: 'مباشر — اليوم 19:00',
              },
              {
                title: 'تمارين شاملة في المناعة والاتصال العصبي — تحضير BEM',
                level: 'السنة الرابعة متوسط',
                stream: 'التعليم المتوسط العام (شهادة BEM)',
                subject: 'العلوم الطبيعية والحياة',
                method: 'Google Meet',
                link: 'https://meet.google.com',
                fileName: 'سلسلة_تمارين_BEM_علوم.pdf',
                allowDownload: true,
                time: 'مباشر — غداً 18:00',
              },
              {
                title: 'أساسيات القراءة والكتابة والحساب الذهني للأقسام التحضيرية',
                level: 'التحضيري',
                stream: 'القسم التحضيري العام',
                subject: 'مواد التحضيري والابتدائي',
                method: 'دروس مسجلة',
                link: 'https://youtube.com',
                fileName: 'كراس_أنشطة_التحضيري.pdf',
                allowDownload: true,
                time: 'حصة مسجلة متاحة دائماً',
              },
            ];

            for (const lesson of starterLessons) {
              const lessonId = generateSafeDocId('les');
              batch.set(doc(db, 'lessons', lessonId), {
                ...lesson,
                teacherName: displayName,
                authorId: uid,
                visibility: 'public',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            const certId = generateSafeDocId('cert');
            batch.set(doc(db, 'certificates', certId), {
              recipient: 'ياسمين بن عبد الله',
              recipientRole: 'تلميذ',
              reason: 'التفوق الباهر والمواظبة المثالية في مراجعة الرياضيات للبكالوريا',
              issuer: displayName,
              issuerId: uid,
              date: new Date().toISOString().slice(0, 10),
              visibility: 'public',
              createdAt: serverTimestamp(),
            });

            const starterRoster = [
              { name: 'ياسمين بن عبد الله', status: 'حاضر' as const, time: '18:02' },
              { name: 'محمد أمين بن علي', status: 'حاضر' as const, time: '18:05' },
              { name: 'آدم بوعلام', status: 'غائب' as const, time: '--:--' },
            ];
            for (const r of starterRoster) {
              batch.set(doc(db, 'roster', generateSafeDocId('ros')), {
                ...r,
                teacherId: uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }

            await batch.commit();
          }
        } catch (err) {
          reportFatalFirestoreError(err, OperationType.WRITE, 'settings/platform');
        }

        try {
          const financeRef = doc(db, 'settings', 'finance');
          const financeSnap = await getDoc(financeRef);
          if (!financeSnap.exists()) {
            await setDoc(financeRef, {
              teacherCcp: DEFAULT_PLATFORM_STATE.teacherCcp,
              approvedGrossTotal: 0,
              approvedReceiptsCount: 0,
              platformSharePct: DEFAULT_PLATFORM_STATE.platformSharePct,
              teacherSharePct: DEFAULT_PLATFORM_STATE.teacherSharePct,
              updatedBy: uid,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          reportFatalFirestoreError(err, OperationType.CREATE, 'settings/finance');
        }
      }
    };

    void bootstrapWorkspace();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, isBootstrapAdmin, preferredRole, reportFatalFirestoreError]);

  // 4. Live Role Check Listeners (own /admins/{uid} & /teachers/{uid} & /users/{uid})
  useEffect(() => {
    if (!isVerifiedUser || !firebaseUser) return;
    const uid = firebaseUser.uid;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUserProfile({
            uid,
            displayName: String(d.displayName || ''),
            email: String(d.email || ''),
            role: (d.role as UserRole) || 'student',
            firstName: typeof d.firstName === 'string' ? d.firstName : undefined,
            lastName: typeof d.lastName === 'string' ? d.lastName : undefined,
            birthDate: typeof d.birthDate === 'string' ? d.birthDate : undefined,
            ccp: typeof d.ccp === 'string' ? d.ccp : undefined,
            baridi: typeof d.baridi === 'string' ? d.baridi : undefined,
            phone: typeof d.phone === 'string' ? d.phone : undefined,
            level: typeof d.level === 'string' ? d.level : undefined,
            stream: typeof d.stream === 'string' ? d.stream : undefined,
            subject: typeof d.subject === 'string' ? d.subject : undefined,
          });
        }
      },
      (err) => reportFatalFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    let hasUidAdmin = false;
    let hasEmailAdmin = false;
    const syncAdminDocState = () => setHasAdminDoc(hasUidAdmin || hasEmailAdmin);

    const unsubAdminByUid = onSnapshot(
      doc(db, 'admins', uid),
      (snap) => {
        hasUidAdmin = snap.exists();
        syncAdminDocState();
      },
      (err) => reportFatalFirestoreError(err, OperationType.GET, `admins/${uid}`)
    );

    const normalizedEmail = (firebaseUser.email || '').toLowerCase();
    const unsubAdminByEmail = normalizedEmail
      ? onSnapshot(
          query(collection(db, 'admins'), where('email', '==', normalizedEmail)),
          (snap) => {
            hasEmailAdmin = !snap.empty;
            syncAdminDocState();
          },
          (err) => reportFatalFirestoreError(err, OperationType.LIST, 'admins')
        )
      : () => {};

    const unsubTeacher = onSnapshot(
      doc(db, 'teachers', uid),
      (snap) => setHasTeacherDoc(snap.exists()),
      (err) => reportFatalFirestoreError(err, OperationType.GET, `teachers/${uid}`)
    );

    return () => {
      unsubUser();
      unsubAdminByUid();
      unsubAdminByEmail();
      unsubTeacher();
    };
  }, [firebaseUser, isVerifiedUser, reportFatalFirestoreError]);

  // 5. Verified User Data Listeners (Lessons, Certificates, Receipts)
  useEffect(() => {
    if (!isVerifiedUser || !firebaseUser) return;
    const uid = firebaseUser.uid;

    // Public catalog of lessons (strictly filtered by visibility == 'public' per firestore.rules)
    const lessonsQ = query(collection(db, 'lessons'), where('visibility', '==', 'public'));
    const unsubLessons = onSnapshot(
      lessonsQ,
      (snap) => {
        const list: (Lesson & { _ts: number })[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            title: String(v.title || ''),
            level: String(v.level || ''),
            stream: String(v.stream || ''),
            subject: String(v.subject || ''),
            method: (v.method as TeachingMethod) || 'Zoom',
            link: String(v.link || ''),
            fileName: String(v.fileName || ''),
            allowDownload: Boolean(v.allowDownload),
            time: String(v.time || ''),
            teacherName: String(v.teacherName || ''),
            authorId: String(v.authorId || ''),
            _ts: tsMillis(v.createdAt),
          };
        });
        list.sort((a, b) => b._ts - a._ts);
        setState((prev) => ({
          ...prev,
          lessons: list.map(({ _ts: _unused, ...rest }) => rest),
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'lessons')
    );

    // Public certificates
    const certsQ = query(collection(db, 'certificates'), where('visibility', '==', 'public'));
    const unsubCerts = onSnapshot(
      certsQ,
      (snap) => {
        const list: (Certificate & { _ts: number })[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            recipient: String(v.recipient || ''),
            recipientRole: v.recipientRole === 'أستاذ' ? 'أستاذ' : 'تلميذ',
            reason: String(v.reason || ''),
            issuer: String(v.issuer || ''),
            issuerId: String(v.issuerId || ''),
            date: String(v.date || ''),
            _ts: tsMillis(v.createdAt),
          };
        });
        list.sort((a, b) => b._ts - a._ts);
        setState((prev) => ({
          ...prev,
          certificates: list.map(({ _ts: _unused, ...rest }) => rest),
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'certificates')
    );

    // Receipts: Bootstrap Director gets full collection; everyone else gets strictly own receipts
    const receiptsQ = isBootstrapAdmin
      ? collection(db, 'receipts')
      : query(collection(db, 'receipts'), where('ownerId', '==', uid));

    const unsubReceipts = onSnapshot(
      receiptsQ,
      (snap) => {
        const list: (PaymentReceipt & { _ts: number })[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            ownerId: String(v.ownerId || ''),
            studentName: String(v.studentName || ''),
            submittedBy: v.submittedBy === 'ولي أمر' ? 'ولي أمر' : 'تلميذ',
            level: String(v.level || ''),
            stream: String(v.stream || ''),
            subject: String(v.subject || ''),
            sectionType: (v.sectionType as SectionType) || 'قسم خاص فردي',
            amount: Number(v.amount) || 0,
            method: v.method === 'CCP' ? 'CCP' : 'BaridiMob',
            ref: String(v.ref || ''),
            fileName: String(v.fileName || ''),
            previewUrl: String(v.previewUrl || ''),
            isPdf: Boolean(v.isPdf),
            status: (v.status as ReceiptStatus) || 'pending',
            date: String(v.date || ''),
            _ts: tsMillis(v.createdAt),
          };
        });
        list.sort((a, b) => b._ts - a._ts);
        setState((prev) => ({
          ...prev,
          receipts: list.map(({ _ts: _unused, ...rest }) => rest),
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'receipts')
    );

    return () => {
      unsubLessons();
      unsubCerts();
      unsubReceipts();
    };
  }, [firebaseUser, isVerifiedUser, isBootstrapAdmin, reportFatalFirestoreError]);

  // 6. Teacher / Admin Restricted Listeners (Finance Summary, Roster, Payouts)
  useEffect(() => {
    if (!isVerifiedUser || !firebaseUser || !isTeacher) {
      setFinanceDocExists(false);
      setState((prev) => ({
        ...prev,
        roster: [],
        payouts: [],
      }));
      return;
    }
    const uid = firebaseUser.uid;

    const unsubFinance = onSnapshot(
      doc(db, 'settings', 'finance'),
      (snap) => {
        if (!snap.exists()) {
          setFinanceDocExists(false);
          return;
        }
        setFinanceDocExists(true);
        const d = snap.data();
        const rawPlatformPct =
          typeof d.platformSharePct === 'number' &&
          d.platformSharePct >= 0 &&
          d.platformSharePct <= 100
            ? Math.round(d.platformSharePct)
            : 70;
        const rawTeacherPct =
          typeof d.teacherSharePct === 'number' &&
          d.teacherSharePct >= 0 &&
          d.teacherSharePct <= 100 &&
          rawPlatformPct + Math.round(d.teacherSharePct) === 100
            ? Math.round(d.teacherSharePct)
            : 100 - rawPlatformPct;
        setState((prev) => ({
          ...prev,
          teacherCcp: typeof d.teacherCcp === 'string' ? d.teacherCcp : prev.teacherCcp,
          approvedGrossTotal:
            typeof d.approvedGrossTotal === 'number' ? d.approvedGrossTotal : 0,
          approvedReceiptsCount:
            typeof d.approvedReceiptsCount === 'number' ? d.approvedReceiptsCount : 0,
          platformSharePct: rawPlatformPct,
          teacherSharePct: rawTeacherPct,
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.GET, 'settings/finance')
    );

    const rosterQ = isBootstrapAdmin
      ? collection(db, 'roster')
      : query(collection(db, 'roster'), where('teacherId', '==', uid));
    const unsubRoster = onSnapshot(
      rosterQ,
      (snap) => {
        const list: (RosterStudent & { _ts: number })[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            name: String(v.name || ''),
            status: v.status === 'غائب' ? 'غائب' : 'حاضر',
            time: String(v.time || '--:--'),
            teacherId: String(v.teacherId || ''),
            _ts: tsMillis(v.createdAt),
          };
        });
        list.sort((a, b) => b._ts - a._ts);
        setState((prev) => ({
          ...prev,
          roster: list.map(({ _ts: _unused, ...rest }) => rest),
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'roster')
    );

    const payoutsQ = isBootstrapAdmin
      ? collection(db, 'payouts')
      : query(collection(db, 'payouts'), where('teacherId', '==', uid));
    const unsubPayouts = onSnapshot(
      payoutsQ,
      (snap) => {
        const list: (PayoutRequest & { _ts: number })[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            teacherId: String(v.teacherId || ''),
            teacherName: String(v.teacherName || ''),
            amount: Number(v.amount) || 0,
            ccp: String(v.ccp || ''),
            date: String(v.date || ''),
            status: v.status === 'تم التحويل' ? 'تم التحويل' : 'قيد التحويل',
            _ts: tsMillis(v.createdAt),
          };
        });
        list.sort((a, b) => b._ts - a._ts);
        setState((prev) => ({
          ...prev,
          payouts: list.map(({ _ts: _unused, ...rest }) => rest),
        }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'payouts')
    );

    return () => {
      unsubFinance();
      unsubRoster();
      unsubPayouts();
    };
  }, [firebaseUser, isVerifiedUser, isTeacher, isBootstrapAdmin, reportFatalFirestoreError]);

  // 7. Admin Registry Listeners (Full collections for Bootstrap Director; 3-slot view for Additional Admins)
  useEffect(() => {
    if (!isAdmin) {
      setState((prev) => ({
        ...prev,
        admins: [],
        teachers: [],
        registeredUsers: [],
      }));
      return;
    }

    if (!isBootstrapAdmin) {
      const slotMap: Record<'admin_2' | 'admin_3', AdminMember | null> = {
        admin_2: null,
        admin_3: null,
      };
      const primaryPlaceholder: AdminMember = {
        id: 'primary_director',
        uid: 'primary_director',
        name: 'الأستاذة ليلى (المديرة العامة)',
        email: BOOTSTRAP_DIRECTOR_EMAIL,
        isPrimary: true,
      };
      const emitSlotAdmins = () => {
        const list: AdminMember[] = [primaryPlaceholder];
        if (slotMap.admin_2) list.push(slotMap.admin_2);
        if (slotMap.admin_3) list.push(slotMap.admin_3);
        setState((prev) => ({ ...prev, admins: list, teachers: [], registeredUsers: [] }));
      };

      const unsubSlot2 = onSnapshot(
        doc(db, 'admins', 'admin_2'),
        (snap) => {
          if (snap.exists()) {
            const v = snap.data();
            slotMap.admin_2 = {
              id: snap.id,
              uid: String(v.uid || snap.id),
              name: String(v.name || ''),
              email: String(v.email || ''),
              isPrimary: Boolean(v.isPrimary),
            };
          } else {
            slotMap.admin_2 = null;
          }
          emitSlotAdmins();
        },
        (err) => reportFatalFirestoreError(err, OperationType.GET, 'admins/admin_2')
      );

      const unsubSlot3 = onSnapshot(
        doc(db, 'admins', 'admin_3'),
        (snap) => {
          if (snap.exists()) {
            const v = snap.data();
            slotMap.admin_3 = {
              id: snap.id,
              uid: String(v.uid || snap.id),
              name: String(v.name || ''),
              email: String(v.email || ''),
              isPrimary: Boolean(v.isPrimary),
            };
          } else {
            slotMap.admin_3 = null;
          }
          emitSlotAdmins();
        },
        (err) => reportFatalFirestoreError(err, OperationType.GET, 'admins/admin_3')
      );

      return () => {
        unsubSlot2();
        unsubSlot3();
      };
    }

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        const list: AdminMember[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            uid: String(v.uid || d.id),
            name: String(v.name || ''),
            email: String(v.email || ''),
            isPrimary: Boolean(v.isPrimary),
          };
        });
        list.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
        setState((prev) => ({ ...prev, admins: list }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'admins')
    );

    const unsubTeachers = onSnapshot(
      collection(db, 'teachers'),
      (snap) => {
        const list: TeacherMember[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            uid: String(v.uid || d.id),
            name: String(v.name || ''),
            subject: String(v.subject || ''),
          };
        });
        setState((prev) => ({ ...prev, teachers: list }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'teachers')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: UserProfile[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            uid: String(v.uid || d.id),
            displayName: String(v.displayName || ''),
            email: String(v.email || ''),
            role: (v.role as UserRole) || 'student',
            firstName: typeof v.firstName === 'string' ? v.firstName : undefined,
            lastName: typeof v.lastName === 'string' ? v.lastName : undefined,
            birthDate: typeof v.birthDate === 'string' ? v.birthDate : undefined,
            ccp: typeof v.ccp === 'string' ? v.ccp : undefined,
            baridi: typeof v.baridi === 'string' ? v.baridi : undefined,
            phone: typeof v.phone === 'string' ? v.phone : undefined,
            level: typeof v.level === 'string' ? v.level : undefined,
            stream: typeof v.stream === 'string' ? v.stream : undefined,
            subject: typeof v.subject === 'string' ? v.subject : undefined,
          };
        });
        setState((prev) => ({ ...prev, registeredUsers: list }));
      },
      (err) => reportFatalFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubAdmins();
      unsubTeachers();
      unsubUsers();
    };
  }, [isAdmin, isBootstrapAdmin, reportFatalFirestoreError]);

  // Financial Metrics (Authoritative from /settings/finance for Teachers/Admins)
  const financialStats = useMemo(() => {
    const approvedGross = isBootstrapAdmin
      ? state.receipts
          .filter((r) => r.status === 'approved')
          .reduce((sum, r) => sum + r.amount, 0)
      : state.approvedGrossTotal;
    const approvedCount = isBootstrapAdmin
      ? state.receipts.filter((r) => r.status === 'approved').length
      : state.approvedReceiptsCount;
    const pendingCount = state.receipts.filter((r) => r.status === 'pending').length;
    const platformShareAmount = Math.round((approvedGross * state.platformSharePct) / 100);
    const teacherShareAmount = approvedGross - platformShareAmount;
    return {
      approvedGross,
      approvedCount,
      pendingCount,
      platformShareAmount,
      teacherShareAmount,
    };
  }, [
    isBootstrapAdmin,
    state.receipts,
    state.approvedGrossTotal,
    state.approvedReceiptsCount,
    state.platformSharePct,
  ]);

  // ================= AUTH HANDLERS =================
  const handleSignIn = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      notify('تم تسجيل الدخول بحساب Google الموثّق بنجاح.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        notify('تم إلغاء نافذة تسجيل الدخول.', 'warning');
      } else {
        notify('تعذّر إتمام تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'error');
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [notify]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      setActiveTab('student');
      notify('تم تسجيل الخروج بأمان.', 'info');
    } catch {
      notify('تعذّر تسجيل الخروج حالياً.', 'error');
    }
  }, [notify]);

  const handleCopyText = useCallback(
    (label: string, value: string) => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(value)
          .then(() => notify(`تم نسخ ${label}: ${value}`, 'success'))
          .catch(() => notify(`${label}: ${value}`, 'info'));
      } else {
        notify(`${label}: ${value}`, 'info');
      }
    },
    [notify]
  );

  // ================= FIRESTORE MUTATION HANDLERS =================

  const handleSelectSection = useCallback(
    (section: SectionType, cycle?: BillingCycle) => {
      const nextCycle = cycle ?? state.billingCycle;
      const nextPrice =
        nextCycle === 'annual' ? state.annualPrices[section] : state.prices[section];
      setState((prev) => ({ ...prev, activeSection: section, billingCycle: nextCycle }));
      notify(
        `تم اختيار: ${section} — ${
          nextCycle === 'annual' ? 'اشتراك سنوي' : 'اشتراك شهري'
        } (${formatDzd(nextPrice)})`,
        'info'
      );
    },
    [notify, state.billingCycle, state.prices, state.annualPrices]
  );

  const handleSelectBillingCycle = useCallback(
    (cycle: BillingCycle) => {
      const nextPrice =
        cycle === 'annual'
          ? state.annualPrices[state.activeSection]
          : state.prices[state.activeSection];
      setState((prev) => ({ ...prev, billingCycle: cycle }));
      notify(
        `تم التحويل إلى ${cycle === 'annual' ? 'الاشتراك السنوي' : 'الاشتراك الشهري'} (${formatDzd(
          nextPrice
        )})`,
        'info'
      );
    },
    [notify, state.activeSection, state.prices, state.annualPrices]
  );

  const handleEnroll = useCallback(async () => {
    if (!firebaseUser || !isVerifiedUser) return;
    if (!platformDocExists) {
      notify('بانتظار تهيئة إعدادات المنصة من المديرة العامة أولاً.', 'warning');
      return;
    }

    const sec = state.activeSection;
    const meta = state.sectionsMeta[sec];
    if (meta.max !== null && meta.reg >= meta.max) {
      notify(
        `اكتمل العدد الأقصى في "${sec}" (${meta.max}/${meta.max}). يرجى اختيار نوع قسم آخر.`,
        'warning'
      );
      return;
    }

    const payload: Record<string, unknown> = {
      updatedBy: firebaseUser.uid,
      updatedAt: serverTimestamp(),
    };
    if (sec === 'قسم خاص فردي') {
      payload.privateReg = meta.reg + 1;
      payload.privatePres = meta.pres + 1;
    } else if (sec === 'قسم مجموعة مصغرة (8-10 تلاميذ)') {
      payload.smallReg = meta.reg + 1;
      payload.smallPres = meta.pres + 1;
    } else {
      payload.groupReg = meta.reg + 1;
      payload.groupPres = meta.pres + 1;
    }

    try {
      await updateDoc(doc(db, 'settings', 'platform'), payload);
      notify(
        `تم تأكيد تسجيلك في ${sec} وحفظ المقعد سحابياً (${meta.reg + 1}/${
          meta.max === null ? '∞' : meta.max
        }).`,
        'success'
      );
    } catch (err) {
      reportFatalFirestoreError(err, OperationType.UPDATE, 'settings/platform');
    }
  }, [firebaseUser, isVerifiedUser, platformDocExists, state, notify, reportFatalFirestoreError]);

  const handleMarkPresent = useCallback(async () => {
    if (!firebaseUser || !isTeacher) return;
    if (!platformDocExists) {
      notify('إعدادات المنصة غير مهيأة بعد.', 'warning');
      return;
    }

    const sec = state.activeSection;
    const meta = state.sectionsMeta[sec];
    if (meta.pres >= meta.reg) {
      notify('جميع التلاميذ المسجلين في هذا القسم مسجلون كحاضرين بالفعل.', 'info');
      return;
    }

    const payload: Record<string, unknown> = {
      updatedBy: firebaseUser.uid,
      updatedAt: serverTimestamp(),
    };
    if (sec === 'قسم خاص فردي') {
      payload.privatePres = meta.pres + 1;
    } else if (sec === 'قسم مجموعة مصغرة (8-10 تلاميذ)') {
      payload.smallPres = meta.pres + 1;
    } else {
      payload.groupPres = meta.pres + 1;
    }

    try {
      await updateDoc(doc(db, 'settings', 'platform'), payload);
      notify(`تم تسجيل حضور تلميذ جديد في ${sec}.`, 'success');
    } catch (err) {
      reportFatalFirestoreError(err, OperationType.UPDATE, 'settings/platform');
    }
  }, [firebaseUser, isTeacher, platformDocExists, state, notify, reportFatalFirestoreError]);

  const handleSubmitReceipt = useCallback(
    async (payload: {
      studentName: string;
      submittedBy: 'تلميذ' | 'ولي أمر';
      level: string;
      stream: string;
      subject: string;
      sectionType: SectionType;
      amount: number;
      method: PaymentMethod;
      ref: string;
      fileName: string;
      previewUrl: string;
      isPdf: boolean;
    }) => {
      if (!firebaseUser || !isVerifiedUser) return;
      const dateStr = new Date().toISOString().slice(0, 10);
      const safeAmount = Math.max(1, Math.min(5000000, Math.round(payload.amount)));
      const safePreview =
        payload.previewUrl && payload.previewUrl.length >= 1
          ? payload.previewUrl.slice(0, 199000)
          : createSampleReceiptSvg({
              method: payload.method,
              ref: payload.ref,
              amount: safeAmount,
              studentName: payload.studentName,
              date: dateStr,
            });

      const receiptId = generateSafeDocId('rec');
      try {
        await setDoc(doc(db, 'receipts', receiptId), {
          ownerId: firebaseUser.uid,
          studentName: payload.studentName.slice(0, 100),
          submittedBy: payload.submittedBy,
          level: payload.level.slice(0, 60),
          stream: payload.stream.slice(0, 80),
          subject: payload.subject.slice(0, 80),
          sectionType: payload.sectionType,
          amount: safeAmount,
          method: payload.method,
          ref: payload.ref.slice(0, 60),
          fileName: payload.fileName.slice(0, 160),
          previewUrl: safePreview,
          isPdf: Boolean(payload.isPdf),
          status: 'pending',
          date: dateStr,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notify(
          `تم إرسال وصل الدفع (${payload.ref}) بنجاح إلى السحابة وهو الآن قيد المراجعة الإدارية.`,
          'success'
        );
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.CREATE, `receipts/${receiptId}`);
      }
    },
    [firebaseUser, isVerifiedUser, notify, reportFatalFirestoreError]
  );

  const handleUpdateReceiptStatus = useCallback(
    async (receiptId: string, nextStatus: ReceiptStatus) => {
      if (!firebaseUser || !isAdmin) return;
      const target = state.receipts.find((r) => r.id === receiptId);
      if (!target || target.status === nextStatus) return;

      let grossDelta = 0;
      let countDelta = 0;
      if (target.status !== 'approved' && nextStatus === 'approved') {
        grossDelta = target.amount;
        countDelta = 1;
      } else if (target.status === 'approved' && nextStatus !== 'approved') {
        grossDelta = -target.amount;
        countDelta = -1;
      }

      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'receipts', receiptId), {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });

        if (financeDocExists && (grossDelta !== 0 || countDelta !== 0)) {
          const nextGross = Math.max(
            0,
            Math.min(100000000, Math.round(state.approvedGrossTotal + grossDelta))
          );
          const nextCount = Math.max(
            0,
            Math.min(1000000, Math.round(state.approvedReceiptsCount + countDelta))
          );
          batch.update(doc(db, 'settings', 'finance'), {
            approvedGrossTotal: nextGross,
            approvedReceiptsCount: nextCount,
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        }

        await batch.commit();
        if (nextStatus === 'approved') {
          const teacherCut = Math.round((target.amount * state.teacherSharePct) / 100);
          notify(
            `تم اعتماد وصل ${target.studentName} وتفعيل الاشتراك سحابياً (+${formatDzd(
              teacherCut
            )} بنسبة ${state.teacherSharePct}% لأرباح الأستاذ).`,
            'success'
          );
        } else {
          notify(`تم تحديث حالة وصل ${target.studentName} إلى مرفوض.`, 'warning');
        }
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, `receipts/${receiptId}`);
      }
    },
    [
      firebaseUser,
      isAdmin,
      financeDocExists,
      state.receipts,
      state.approvedGrossTotal,
      state.approvedReceiptsCount,
      state.teacherSharePct,
      notify,
      reportFatalFirestoreError,
    ]
  );

  const handleSaveRevenueSplit = useCallback(
    async (platformPct: number, teacherPct: number) => {
      if (!firebaseUser || !isAdmin) return;
      const p = Math.round(platformPct);
      const t = Math.round(teacherPct);
      if (p < 0 || p > 100 || t < 0 || t > 100 || p + t !== 100) {
        notify('يجب أن يكون مجموع نسبة المنصة ونسبة الأستاذ مساوياً لـ 100%.', 'warning');
        return;
      }
      try {
        const financeRef = doc(db, 'settings', 'finance');
        if (financeDocExists) {
          await updateDoc(financeRef, {
            platformSharePct: p,
            teacherSharePct: t,
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(financeRef, {
            teacherCcp: state.teacherCcp,
            approvedGrossTotal: state.approvedGrossTotal,
            approvedReceiptsCount: state.approvedReceiptsCount,
            platformSharePct: p,
            teacherSharePct: t,
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        }
        notify(
          `تم تحديث نسب التوزيع سحابياً: ${p}% للمنصة و ${t}% للأستاذ.`,
          'success'
        );
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, 'settings/finance');
      }
    },
    [
      firebaseUser,
      isAdmin,
      financeDocExists,
      state.teacherCcp,
      state.approvedGrossTotal,
      state.approvedReceiptsCount,
      notify,
      reportFatalFirestoreError,
    ]
  );

  const handleSaveBanking = useCallback(
    async (ccp: string, baridi: string) => {
      if (!firebaseUser || !isAdmin) return;
      const cleanCcp = ccp.trim().slice(0, 60);
      const cleanBaridi = baridi.trim().slice(0, 60);
      try {
        const batch = writeBatch(db);
        if (platformDocExists) {
          batch.update(doc(db, 'settings', 'platform'), {
            ccp: cleanCcp,
            baridi: cleanBaridi,
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        }
        batch.update(doc(db, 'users', firebaseUser.uid), {
          ccp: cleanCcp,
          baridi: cleanBaridi,
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        notify('تم تحديث أرقام CCP وبريدي موب الإدارة في قاعدة البيانات السحابية.', 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, 'settings/platform');
      }
    },
    [firebaseUser, isAdmin, platformDocExists, notify, reportFatalFirestoreError]
  );

  const handleSavePrices = useCallback(
    async (
      prices: Record<SectionType, number>,
      annualPrices: Record<SectionType, number>
    ) => {
      if (!firebaseUser || !isAdmin) return;
      try {
        await updateDoc(doc(db, 'settings', 'platform'), {
          pricePrivate: Math.round(prices['قسم خاص فردي']),
          priceSmall: Math.round(prices['قسم مجموعة مصغرة (8-10 تلاميذ)']),
          priceGroup: Math.round(prices['قسم جماعي (عدد غير محدود)']),
          annualPricePrivate: Math.round(annualPrices['قسم خاص فردي']),
          annualPriceSmall: Math.round(annualPrices['قسم مجموعة مصغرة (8-10 تلاميذ)']),
          annualPriceGroup: Math.round(annualPrices['قسم جماعي (عدد غير محدود)']),
          updatedBy: firebaseUser.uid,
          updatedAt: serverTimestamp(),
        });
        notify(
          'تم تحديث الأسعار الشهرية والسنوية للأقسام الثلاثة سحابياً وانعكست لجميع المستخدمين.',
          'success'
        );
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, 'settings/platform');
      }
    },
    [firebaseUser, isAdmin, notify, reportFatalFirestoreError]
  );

  const handleSaveUserCard = useCallback(
    async (payload: {
      firstName: string;
      lastName: string;
      birthDate: string;
      ccp?: string;
      baridi?: string;
      phone?: string;
      level?: string;
      stream?: string;
      subject?: string;
      kind: 'teacher' | 'student' | 'admin';
    }) => {
      if (!firebaseUser || !isVerifiedUser) return;
      const cleanFirst = payload.firstName.trim().slice(0, 60);
      const cleanLast = payload.lastName.trim().slice(0, 60);
      if (!cleanFirst || !cleanLast) {
        notify('يرجى إدخال الاسم واللقب الكاملين قبل الحفظ.', 'warning');
        return;
      }

      const fullName = `${cleanFirst} ${cleanLast}`.trim().slice(0, 100);
      const updatePayload: Record<string, unknown> = {
        displayName: fullName,
        firstName: cleanFirst,
        lastName: cleanLast,
        updatedAt: serverTimestamp(),
      };

      const cleanBirth = payload.birthDate.trim().slice(0, 20);
      if (cleanBirth.length >= 4) {
        updatePayload.birthDate = cleanBirth;
      }
      if (typeof payload.ccp === 'string') {
        updatePayload.ccp = payload.ccp.trim().slice(0, 60);
      }
      if (typeof payload.baridi === 'string') {
        updatePayload.baridi = payload.baridi.trim().slice(0, 60);
      }
      if (typeof payload.phone === 'string') {
        updatePayload.phone = payload.phone.trim().slice(0, 30);
      }
      if (typeof payload.level === 'string') {
        updatePayload.level = payload.level.trim().slice(0, 60);
      }
      if (typeof payload.stream === 'string') {
        updatePayload.stream = payload.stream.trim().slice(0, 80);
      }
      if (typeof payload.subject === 'string') {
        updatePayload.subject = payload.subject.trim().slice(0, 80);
      }

      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), updatePayload);

        // If teacher saved a valid CCP in their personal info card, sync wallet CCP too
        if (
          payload.kind === 'teacher' &&
          isTeacher &&
          financeDocExists &&
          typeof payload.ccp === 'string' &&
          payload.ccp.trim().length >= 3
        ) {
          await updateDoc(doc(db, 'settings', 'finance'), {
            teacherCcp: payload.ccp.trim().slice(0, 60),
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        }

        // If admin saved valid CCP & BaridiMob in Admin Info Card, sync platform payment details too
        if (
          payload.kind === 'admin' &&
          isAdmin &&
          platformDocExists &&
          typeof payload.ccp === 'string' &&
          payload.ccp.trim().length >= 3 &&
          typeof payload.baridi === 'string' &&
          payload.baridi.trim().length >= 3
        ) {
          await updateDoc(doc(db, 'settings', 'platform'), {
            ccp: payload.ccp.trim().slice(0, 60),
            baridi: payload.baridi.trim().slice(0, 60),
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        }

        notify(
          payload.kind === 'admin'
            ? `تم حفظ بطاقة معلومات الأدمن (${fullName}) بنجاح في السحابة.`
            : payload.kind === 'teacher'
            ? `تم حفظ بطاقة معلومات الأستاذ (${fullName}) بنجاح في السحابة.`
            : `تم حفظ بطاقة معلومات التلميذ (${fullName}) بنجاح في السحابة.`,
          'success'
        );
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
    },
    [
      firebaseUser,
      isVerifiedUser,
      isTeacher,
      isAdmin,
      financeDocExists,
      platformDocExists,
      notify,
      reportFatalFirestoreError,
    ]
  );

  const handleSaveTeacherCcp = useCallback(
    async (ccp: string) => {
      if (!firebaseUser || !isTeacher) return;
      const clean = ccp.trim().slice(0, 60);
      if (clean.length < 3) {
        notify('يرجى إدخال رقم CCP الأستاذ بشكل صحيح.', 'warning');
        return;
      }
      if (!financeDocExists) {
        notify('سجل المالية غير مهيأ بعد من المديرة العامة.', 'warning');
        return;
      }
      try {
        await updateDoc(doc(db, 'settings', 'finance'), {
          teacherCcp: clean,
          updatedBy: firebaseUser.uid,
          updatedAt: serverTimestamp(),
        });
        notify('تم حفظ رقم CCP الأستاذ بأمان في سجل المالية المحمي.', 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, 'settings/finance');
      }
    },
    [firebaseUser, isTeacher, financeDocExists, notify, reportFatalFirestoreError]
  );

  const handleRequestPayout = useCallback(async () => {
    if (!firebaseUser || !isTeacher) return;
    if (financialStats.teacherShareAmount <= 0) {
      notify(
        'لا يوجد رصيد أرباح مؤكدة للسحب حالياً (يُحسب الرصيد من الوصلات المعتمدة فقط).',
        'warning'
      );
      return;
    }
    const cleanCcp = state.teacherCcp.trim();
    if (cleanCcp.length < 3) {
      notify('يرجى إدخال وحفظ رقم CCP الأستاذ قبل طلب السحب.', 'warning');
      return;
    }

    const payoutId = generateSafeDocId('pay');
    const teacherName = (
      userProfile?.displayName ||
      firebaseUser.displayName ||
      'أستاذ النبراس'
    ).slice(0, 100);

    try {
      await setDoc(doc(db, 'payouts', payoutId), {
        teacherId: firebaseUser.uid,
        teacherName,
        amount: Math.min(10000000, Math.round(financialStats.teacherShareAmount)),
        ccp: cleanCcp.slice(0, 60),
        status: 'قيد التحويل',
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      notify(
        `تم تسجيل طلب سحب مبلغ ${formatDzd(financialStats.teacherShareAmount)} إلى CCP الأستاذ.`,
        'success'
      );
    } catch (err) {
      reportFatalFirestoreError(err, OperationType.CREATE, `payouts/${payoutId}`);
    }
  }, [
    firebaseUser,
    isTeacher,
    financialStats.teacherShareAmount,
    state.teacherCcp,
    userProfile,
    notify,
    reportFatalFirestoreError,
  ]);

  const handleCompletePayout = useCallback(
    async (payoutId: string) => {
      if (!firebaseUser || !isAdmin) return;
      try {
        await updateDoc(doc(db, 'payouts', payoutId), {
          status: 'تم التحويل',
          updatedAt: serverTimestamp(),
        });
        notify('تم تأكيد تحويل أرباح الأستاذ بنجاح.', 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, `payouts/${payoutId}`);
      }
    },
    [firebaseUser, isAdmin, notify, reportFatalFirestoreError]
  );

  const handlePublishLesson = useCallback(
    async (payload: {
      level: string;
      stream: string;
      subject: string;
      method: TeachingMethod;
      title: string;
      link: string;
      fileName: string;
      allowDownload: boolean;
    }) => {
      if (!firebaseUser || !isTeacher) return;
      const lessonId = generateSafeDocId('les');
      const teacherName = (
        userProfile?.displayName ||
        firebaseUser.displayName ||
        'الأستاذة ليلى'
      ).slice(0, 100);
      const timeLabel = `منشور الآن · ${new Date().toLocaleTimeString('ar-DZ', {
        hour: '2-digit',
        minute: '2-digit',
      })}`.slice(0, 60);

      try {
        await setDoc(doc(db, 'lessons', lessonId), {
          title: payload.title.slice(0, 160),
          level: payload.level.slice(0, 60),
          stream: payload.stream.slice(0, 80),
          subject: payload.subject.slice(0, 80),
          method: payload.method,
          link: payload.link.slice(0, 300),
          fileName: payload.fileName.slice(0, 160),
          allowDownload: Boolean(payload.allowDownload),
          time: timeLabel,
          teacherName,
          authorId: firebaseUser.uid,
          visibility: 'public',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notify(`تم نشر الدرس "${payload.title}" بنجاح وظهر فوراً للتلاميذ والأولياء.`, 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.CREATE, `lessons/${lessonId}`);
      }
    },
    [firebaseUser, isTeacher, userProfile, notify, reportFatalFirestoreError]
  );

  const handleToggleLessonDownload = useCallback(
    async (lessonId: string, nextValue: boolean) => {
      if (!firebaseUser || !isTeacher) return;
      try {
        await updateDoc(doc(db, 'lessons', lessonId), {
          allowDownload: nextValue,
          updatedAt: serverTimestamp(),
        });
        notify(
          nextValue ? 'تم فتح تحميل الوثيقة للتلاميذ والأولياء.' : 'تم قفل تحميل الوثيقة.',
          'info'
        );
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, `lessons/${lessonId}`);
      }
    },
    [firebaseUser, isTeacher, notify, reportFatalFirestoreError]
  );

  const handleDeleteLesson = useCallback(
    async (lessonId: string) => {
      if (!firebaseUser || !isTeacher) return;
      try {
        await deleteDoc(doc(db, 'lessons', lessonId));
        notify('تم حذف الدرس من قاعدة البيانات.', 'info');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.DELETE, `lessons/${lessonId}`);
      }
    },
    [firebaseUser, isTeacher, notify, reportFatalFirestoreError]
  );

  const handleGrantStudentCert = useCallback(
    async (student: string, reason: string) => {
      if (!firebaseUser || !isTeacher) return;
      const certId = generateSafeDocId('cert');
      const issuer = (
        userProfile?.displayName ||
        firebaseUser.displayName ||
        'الأستاذة ليلى'
      ).slice(0, 100);
      const dateStr = new Date().toISOString().slice(0, 10);

      try {
        await setDoc(doc(db, 'certificates', certId), {
          recipient: student.slice(0, 100),
          recipientRole: 'تلميذ',
          reason: reason.slice(0, 240),
          issuer,
          issuerId: firebaseUser.uid,
          date: dateStr,
          visibility: 'public',
          createdAt: serverTimestamp(),
        });
        setPreviewCertificate({
          id: certId,
          recipient: student,
          recipientRole: 'تلميذ',
          reason,
          issuer,
          issuerId: firebaseUser.uid,
          date: dateStr,
        });
        notify(`تم إصدار شهادة تفوق سحابية للتلميذ ${student}.`, 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.CREATE, `certificates/${certId}`);
      }
    },
    [firebaseUser, isTeacher, userProfile, notify, reportFatalFirestoreError]
  );

  const handleGrantTeacherHonor = useCallback(
    async (teacherName: string) => {
      if (!firebaseUser || !isAdmin) return;
      const certId = generateSafeDocId('cert');
      const issuer = (
        userProfile?.displayName ||
        firebaseUser.displayName ||
        'المديرة العامة لمنصة النبراس'
      ).slice(0, 100);
      const dateStr = new Date().toISOString().slice(0, 10);
      const reason = 'تقديراً للجهود البيداغوجية المتميزة والعطاء المستمر في مرافقة التلاميذ.';

      try {
        await setDoc(doc(db, 'certificates', certId), {
          recipient: teacherName.slice(0, 100),
          recipientRole: 'أستاذ',
          reason,
          issuer,
          issuerId: firebaseUser.uid,
          date: dateStr,
          visibility: 'public',
          createdAt: serverTimestamp(),
        });
        setPreviewCertificate({
          id: certId,
          recipient: teacherName,
          recipientRole: 'أستاذ',
          reason,
          issuer,
          issuerId: firebaseUser.uid,
          date: dateStr,
        });
        notify(`تم إصدار شهادة شرف وتقدير للأستاذ ${teacherName}.`, 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.CREATE, `certificates/${certId}`);
      }
    },
    [firebaseUser, isAdmin, userProfile, notify, reportFatalFirestoreError]
  );

  const handleAddRosterStudent = useCallback(
    async (name: string) => {
      if (!firebaseUser || !isTeacher) return;
      const rosterId = generateSafeDocId('ros');
      const nowTime = new Date()
        .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        .slice(0, 20);
      try {
        await setDoc(doc(db, 'roster', rosterId), {
          name: name.slice(0, 100),
          status: 'حاضر',
          time: nowTime,
          teacherId: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notify(`تمت إضافة ${name} إلى قائمة الحضور السحابية.`, 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.CREATE, `roster/${rosterId}`);
      }
    },
    [firebaseUser, isTeacher, notify, reportFatalFirestoreError]
  );

  const handleToggleRosterStudent = useCallback(
    async (id: string, currentStatus: 'حاضر' | 'غائب') => {
      if (!firebaseUser || !isTeacher) return;
      const nextStatus = currentStatus === 'حاضر' ? 'غائب' : 'حاضر';
      const nextTime =
        nextStatus === 'حاضر'
          ? new Date()
              .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              .slice(0, 20)
          : '--:--';
      try {
        await updateDoc(doc(db, 'roster', id), {
          status: nextStatus,
          time: nextTime,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.UPDATE, `roster/${id}`);
      }
    },
    [firebaseUser, isTeacher, reportFatalFirestoreError]
  );

  const handleAddAdmin = useCallback(
    async (name: string, email: string) => {
      if (!firebaseUser || !isAdmin) return;
      const cleanName = name.trim().slice(0, 100);
      const cleanEmail = email.trim().toLowerCase().slice(0, 120);

      if (!cleanName) {
        notify('يرجى إدخال اسم الأدمن الجديد.', 'warning');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
        notify('يرجى إدخال بريد إلكتروني صحيح (حساب Google للأدمن).', 'warning');
        return;
      }
      if (state.admins.length >= 3) {
        notify('الحد الأقصى هو 3 أدمن فقط في المنصة (المديرة العامة + 2 أدمن إضافيين).', 'warning');
        return;
      }
      if (
        cleanEmail === BOOTSTRAP_DIRECTOR_EMAIL.toLowerCase() ||
        state.admins.some((a) => a.email.toLowerCase() === cleanEmail)
      ) {
        notify('هذا البريد الإلكتروني مسجل كأدمن مسبقاً.', 'info');
        return;
      }

      // Explicitly prevent promoting an existing teacher to admin
      const isTeacherAccount = state.registeredUsers.some(
        (u) =>
          u.email.toLowerCase() === cleanEmail &&
          (u.role === 'teacher' || state.teachers.some((t) => t.uid === u.uid))
      );
      if (isTeacherAccount) {
        notify(
          'لا يمكن ترقية أستاذ إلى أدمن؛ يرجى إضافة بريد إلكتروني مستقل مخصص للأدمن الجديد.',
          'warning'
        );
        return;
      }

      const candidateSlots: ('admin_2' | 'admin_3')[] = ['admin_2', 'admin_3'];
      const freeSlot = candidateSlots.find(
        (slotId) => !state.admins.some((a) => a.id === slotId)
      );
      if (!freeSlot) {
        notify('تم استنفاد جميع مقاعد الأدمن المتاحة (3/3 كأقصى حد).', 'warning');
        return;
      }

      try {
        await setDoc(doc(db, 'admins', freeSlot), {
          uid: freeSlot,
          name: cleanName,
          email: cleanEmail,
          isPrimary: false,
          addedBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
        notify(
          `تمت إضافة الأدمن "${cleanName}" (${cleanEmail}) بنجاح — العدد الحالي: ${
            state.admins.length + 1
          } / 3.`,
          'success'
        );
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.CREATE, `admins/${freeSlot}`);
      }
    },
    [
      firebaseUser,
      isAdmin,
      state.admins,
      state.registeredUsers,
      state.teachers,
      notify,
      reportFatalFirestoreError,
    ]
  );

  const handlePromoteUserToTeacher = useCallback(
    async (targetUser: UserProfile, subject: string) => {
      if (!firebaseUser || !isAdmin) return;
      if (state.teachers.some((t) => t.uid === targetUser.uid)) {
        notify('هذا الحساب مسجل كأستاذ معتمد مسبقاً.', 'info');
        return;
      }
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'teachers', targetUser.uid), {
          uid: targetUser.uid,
          name: targetUser.displayName.slice(0, 100),
          subject: subject.slice(0, 80),
          addedBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
        batch.update(doc(db, 'users', targetUser.uid), {
          role: 'teacher',
          subject: subject.slice(0, 80),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        notify(`تم تعيين ${targetUser.displayName} كأستاذ معتمد لمادة ${subject}.`, 'success');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.WRITE, `teachers/${targetUser.uid}`);
      }
    },
    [firebaseUser, isAdmin, state.teachers, notify, reportFatalFirestoreError]
  );

  const handleRemoveAdmin = useCallback(
    async (adminId: string) => {
      if (!firebaseUser || !isAdmin) return;
      const target = state.admins.find((a) => a.id === adminId);
      if (!target || target.isPrimary) {
        notify('لا يمكن إزالة المديرة العامة الأساسية.', 'warning');
        return;
      }
      try {
        const matchedUser = state.registeredUsers.find(
          (u) =>
            u.uid === adminId ||
            u.email.toLowerCase() === target.email.toLowerCase()
        );
        const batch = writeBatch(db);
        batch.delete(doc(db, 'admins', adminId));
        if (matchedUser && matchedUser.role === 'admin') {
          batch.update(doc(db, 'users', matchedUser.uid), {
            role: 'student',
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
        notify(`تمت إزالة الأدمن ${target.name} بنجاح.`, 'info');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.DELETE, `admins/${adminId}`);
      }
    },
    [firebaseUser, isAdmin, state.admins, state.registeredUsers, notify, reportFatalFirestoreError]
  );

  const handleRemoveTeacher = useCallback(
    async (teacherId: string) => {
      if (!firebaseUser || !isAdmin) return;
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'teachers', teacherId));
        batch.update(doc(db, 'users', teacherId), {
          role: 'student',
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        notify('تم سحب صلاحية الأستاذ بنجاح.', 'info');
      } catch (err) {
        reportFatalFirestoreError(err, OperationType.DELETE, `teachers/${teacherId}`);
      }
    },
    [firebaseUser, isAdmin, notify, reportFatalFirestoreError]
  );

  const handleDownloadSourceCode = useCallback(async () => {
    if (isExportingSource) return;
    setIsExportingSource(true);
    try {
      const { fileCount, fileName, downloadUrl } = await downloadApplicationSourceZip();
      setReadySourceDownload({ fileCount, fileName, downloadUrl });
      notify(
        `تم تجهيز وتحميل كود التطبيق جاهزاً للتشغيل (${fileCount} ملفاً في ${fileName}).`,
        'success'
      );
    } catch {
      notify('تعذّر تجهيز ملف الكود المصدري حالياً. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsExportingSource(false);
    }
  }, [isExportingSource, notify]);

  const roleBadgeLabel =
    effectiveRole === 'admin'
      ? 'مدير المنصة'
      : effectiveRole === 'teacher'
      ? 'أستاذ معتمد'
      : effectiveRole === 'parent'
      ? 'ولي أمر'
      : 'تلميذ';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 surface-panel border-b border-gold/45 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl royal-gold-gradient text-darknavy flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-base sm:text-xl font-black text-gold-royal tracking-tight">
                  منصة النبراس التعليمية
                </h1>
                <span className="inline-flex items-center gap-1 bg-gold/15 border border-gold/55 text-gold-light px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-black">
                  تحت إشراف الأستاذة ليلى
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-turquoise-300 font-semibold">
                نظام التعليم عن بعد المؤمّن — التحضيري · الابتدائي · المتوسط · الثانوي والبكالوريا
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {isVerifiedUser && firebaseUser && (
              <div className="hidden md:flex items-center gap-2 bg-darknavy/90 border border-gold/30 rounded-xl px-3 py-1.5 text-xs">
                <UserIcon className="w-3.5 h-3.5 text-gold-royal shrink-0" />
                <div className="text-right leading-tight max-w-[160px]">
                  <div className="font-bold text-white truncate">
                    {userProfile?.displayName || firebaseUser.displayName || 'مستخدم'}
                  </div>
                  <div className="text-[10px] text-turquoise-300 font-semibold">
                    {roleBadgeLabel}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isExportingSource}
              onClick={() => void handleDownloadSourceCode()}
              title="تحميل الكود المصدري الكامل للتطبيق (ZIP)"
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black border transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-60 ${
                isExportingSource
                  ? 'royal-gold-gradient text-darknavy border-gold-royal shadow-[0_0_16px_rgba(255,215,0,0.45)]'
                  : 'bg-darknavy hover:bg-gold/15 border-gold/55 hover:border-gold-royal text-gold-royal'
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0" />
              <span>{isExportingSource ? 'جاري التحميل...' : 'تحميل كود التطبيق'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSecurityOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/45 text-emerald-300 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>الأمان والصلاحيات</span>
            </button>

            <a
              href={buildWhatsAppLink(
                'السلام عليكم إدارة منصة النبراس التعليمية — تحت إشراف الأستاذة ليلى، أرغب في الاستفسار أو إرسال وصل الدفع'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/50 text-emerald-300 px-3 py-2 rounded-xl text-xs font-bold transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline font-mono" dir="ltr">
                {WHATSAPP_NUMBER_DISPLAY}
              </span>
              <span className="md:hidden">واتساب</span>
            </a>

            {firebaseUser && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                title="تسجيل الخروج"
                className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/45 text-slate-200 hover:text-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {readySourceDownload && (
          <div className="surface-panel rounded-2xl border border-gold/60 bg-darknavy/95 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-100 font-bold">
                ملف الكود جاهز ({readySourceDownload.fileCount} ملفاً):{' '}
                <strong className="text-gold-royal font-mono" dir="ltr">
                  {readySourceDownload.fileName}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={readySourceDownload.downloadUrl}
                download={readySourceDownload.fileName}
                rel="noopener"
                className="inline-flex items-center gap-1.5 royal-gold-gradient hover:brightness-105 text-darknavy font-black rounded-xl px-3.5 py-2 text-xs shadow transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>حفظ ملف ZIP الآن</span>
              </a>
              <button
                type="button"
                onClick={() => setReadySourceDownload(null)}
                aria-label="إغلاق شريط التحميل"
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!authReady ? (
          <div className="surface-panel rounded-3xl p-10 text-center space-y-3 max-w-md mx-auto">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-gold border-t-transparent animate-spin" />
            <p className="text-sm font-bold text-gold-royal">
              جاري التحقق من جلسة الأمان والاتصال بقاعدة البيانات...
            </p>
          </div>
        ) : !isVerifiedUser ? (
          <AuthGate
            state={state}
            preferredRole={preferredRole}
            onChangePreferredRole={setPreferredRole}
            onSignIn={() => void handleSignIn()}
            isSigningIn={isSigningIn}
          />
        ) : (
          <>
            <PortalNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              ccp={state.ccp}
              baridi={state.baridi}
              activeSection={state.activeSection}
              billingCycle={state.billingCycle}
              activeSectionPrice={
                state.billingCycle === 'annual'
                  ? state.annualPrices[state.activeSection]
                  : state.prices[state.activeSection]
              }
              pendingReceiptsCount={isAdmin ? financialStats.pendingCount : 0}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              onCopyText={handleCopyText}
            />

            {activeTab === 'student' && (
              <StudentPortal
                state={state}
                userProfile={userProfile}
                defaultStudentName={userProfile?.displayName || firebaseUser?.displayName || ''}
                onSelectSection={handleSelectSection}
                onSelectBillingCycle={handleSelectBillingCycle}
                onSaveStudentCard={(card) =>
                  handleSaveUserCard({ ...card, kind: 'student' })
                }
                onEnroll={handleEnroll}
                onSubmitReceipt={handleSubmitReceipt}
                onPreviewReceipt={setPreviewReceipt}
                onPreviewCertificate={setPreviewCertificate}
                onNotify={notify}
              />
            )}

            {activeTab === 'parent' && (
              <ParentPortal
                state={state}
                defaultChildName={userProfile?.displayName || ''}
                onSelectSection={handleSelectSection}
                onSelectBillingCycle={handleSelectBillingCycle}
                onSubmitReceipt={handleSubmitReceipt}
                onNotify={notify}
              />
            )}

            {activeTab === 'teacher' && (
              <TeacherPortal
                state={state}
                userProfile={userProfile}
                isAuthorized={isTeacher}
                approvedGross={financialStats.approvedGross}
                platformShareAmount={financialStats.platformShareAmount}
                teacherShareAmount={financialStats.teacherShareAmount}
                approvedReceiptsCount={financialStats.approvedCount}
                onSaveTeacherCard={(card) =>
                  handleSaveUserCard({ ...card, kind: 'teacher' })
                }
                onMarkPresent={handleMarkPresent}
                onEnroll={handleEnroll}
                onOpenRoster={() => setRosterOpen(true)}
                onSaveTeacherCcp={handleSaveTeacherCcp}
                onRequestPayout={handleRequestPayout}
                onPublishLesson={handlePublishLesson}
                onToggleLessonDownload={handleToggleLessonDownload}
                onDeleteLesson={handleDeleteLesson}
                onGrantStudentCert={handleGrantStudentCert}
                onNotify={notify}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPortal
                state={state}
                userProfile={userProfile}
                isAuthorized={isAdmin}
                platformShareAmount={financialStats.platformShareAmount}
                teacherShareAmount={financialStats.teacherShareAmount}
                onSaveAdminCard={(card) =>
                  handleSaveUserCard({ ...card, kind: 'admin' })
                }
                onSaveBanking={handleSaveBanking}
                onSavePrices={handleSavePrices}
                onSaveRevenueSplit={handleSaveRevenueSplit}
                onGrantTeacherHonor={handleGrantTeacherHonor}
                onAddAdmin={handleAddAdmin}
                onPromoteUserToTeacher={handlePromoteUserToTeacher}
                onRemoveAdmin={handleRemoveAdmin}
                onRemoveTeacher={handleRemoveTeacher}
                onUpdateReceiptStatus={handleUpdateReceiptStatus}
                onCompletePayout={handleCompletePayout}
                onPreviewReceipt={setPreviewReceipt}
                onCopyText={handleCopyText}
                onDownloadSourceCode={handleDownloadSourceCode}
                isExportingSource={isExportingSource}
                onNotify={notify}
              />
            )}

            {activeTab === 'sections' && (
              <SectionsPortal
                state={state}
                onSelectSection={handleSelectSection}
                onSelectBillingCycle={handleSelectBillingCycle}
                onNavigate={setActiveTab}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-5 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
          <span className="font-bold text-slate-300">
            منصة النبراس التعليمية — <strong className="text-gold-royal">تحت إشراف الأستاذة ليلى</strong> · جميع الحقوق محفوظة ©{' '}
            {new Date().getFullYear()}
          </span>
          <span className="text-slate-500">
            حماية سحابية مفعّلة عبر Firebase Auth و Firestore RBAC · تواصل:{' '}
            <a
              href={buildWhatsAppLink('السلام عليكم منصة النبراس التعليمية')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-mono"
              dir="ltr"
            >
              {WHATSAPP_NUMBER_DISPLAY}
            </a>
          </span>
        </div>
      </footer>

      {/* Modals */}
      <RosterModal
        isOpen={rosterOpen}
        roster={state.roster}
        onToggleStatus={handleToggleRosterStudent}
        onAddStudent={handleAddRosterStudent}
        onClose={() => setRosterOpen(false)}
      />

      <ReceiptModal
        receipt={previewReceipt}
        canModerate={isAdmin}
        onUpdateStatus={handleUpdateReceiptStatus}
        onClose={() => setPreviewReceipt(null)}
      />

      <CertificateModal
        certificate={previewCertificate}
        onClose={() => setPreviewCertificate(null)}
      />

      <SecurityScanModal
        isOpen={securityOpen}
        email={firebaseUser?.email ?? null}
        emailVerified={Boolean(firebaseUser?.emailVerified)}
        role={effectiveRole}
        dbConnected={dbConnected}
        onClose={() => setSecurityOpen(false)}
      />

      {/* Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const toneStyle =
            toast.tone === 'success'
              ? 'border-emerald-500/55 bg-emerald-950/95 text-emerald-100'
              : toast.tone === 'warning'
              ? 'border-amber-500/55 bg-amber-950/95 text-amber-100'
              : toast.tone === 'error'
              ? 'border-rose-500/55 bg-rose-950/95 text-rose-100'
              : 'border-turquoise-400/55 bg-darknavy/95 text-slate-100';

          const ToneIcon =
            toast.tone === 'success'
              ? CheckCircle2
              : toast.tone === 'warning' || toast.tone === 'error'
              ? TriangleAlert
              : Info;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-3 rounded-xl border shadow-xl text-xs font-bold flex items-center gap-2.5 ${toneStyle}`}
            >
              <ToneIcon className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{toast.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
