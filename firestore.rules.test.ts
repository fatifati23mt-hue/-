/**
 * Security Rules Specification Verification Matrix (Dirty Dozen Payloads)
 * Maps each adversarial payload from security_spec.md to the exact rule gate in firestore.rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'get' | 'list';
  actor: string;
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  blockingGate: string;
}

export const DIRTY_DOZEN_SECURITY_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Assigned Admin Role on Registration',
    collectionPath: '/users/attacker_uid',
    operation: 'create',
    actor: 'verified student (attacker_uid)',
    payload: { uid: 'attacker_uid', displayName: 'Attacker', email: 'a@test.com', role: 'admin' },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "incoming().role in ['student', 'parent']",
  },
  {
    id: 2,
    name: 'Self Role Escalation on Profile Update',
    collectionPath: '/users/student_uid',
    operation: 'update',
    actor: 'verified student (student_uid)',
    payload: { role: 'teacher' },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "incoming().role == existing().role && affectedKeys().hasOnly(['displayName', 'updatedAt'])",
  },
  {
    id: 3,
    name: 'Ghost / Shadow Field Injection on Receipt',
    collectionPath: '/receipts/rec_1',
    operation: 'create',
    actor: 'verified student (student_uid)',
    payload: { ownerId: 'student_uid', status: 'pending', isVerified: true },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isValidReceipt(incoming()) -> data.keys().hasOnly([...])',
  },
  {
    id: 4,
    name: 'Pre-Approved Receipt Fraud on Create',
    collectionPath: '/receipts/rec_2',
    operation: 'create',
    actor: 'verified student (student_uid)',
    payload: { ownerId: 'student_uid', status: 'approved', amount: 6000 },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: "incoming().status == 'pending'",
  },
  {
    id: 5,
    name: 'Owner Spoofing on Receipt Creation',
    collectionPath: '/receipts/rec_3',
    operation: 'create',
    actor: 'verified student A',
    payload: { ownerId: 'student_B', status: 'pending' },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'incoming().ownerId == request.auth.uid',
  },
  {
    id: 6,
    name: 'Student Self-Approval Update on Own Receipt',
    collectionPath: '/receipts/rec_4',
    operation: 'update',
    actor: 'verified student A (owner)',
    payload: { status: 'approved' },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isAdmin() required on receipts update',
  },
  {
    id: 7,
    name: 'Cross-User Receipt Theft (Get / Unfiltered List)',
    collectionPath: '/receipts/student_B_receipt',
    operation: 'get',
    actor: 'verified student A',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'existing().ownerId == request.auth.uid || isAdmin()',
  },
  {
    id: 8,
    name: 'Cross-User PII Theft on Users Collection',
    collectionPath: '/users/student_B',
    operation: 'get',
    actor: 'verified student A',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isOwner(userId) || isAdmin()',
  },
  {
    id: 9,
    name: 'Unauthorized Platform Price or CCP Tampering',
    collectionPath: '/settings/platform',
    operation: 'update',
    actor: 'verified student or teacher',
    payload: { pricePrivate: 0, ccp: '000000' },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isAdmin() required for ccp/baridi/pricePrivate/priceSmall/priceGroup',
  },
  {
    id: 10,
    name: 'Unverified Email Spoofing of Director Account',
    collectionPath: '/settings/finance',
    operation: 'get',
    actor: 'unverified account with email fatifati23.mt@gmail.com (email_verified=false)',
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isVerifiedSignedIn() -> request.auth.token.email_verified == true',
  },
  {
    id: 11,
    name: 'ID Poisoning & Oversized Payload Injection',
    collectionPath: '/lessons/bad$id..hack',
    operation: 'create',
    actor: 'teacher',
    payload: { title: 'A'.repeat(250000) },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isValidId(lessonId) && isNonEmptyString(data.title, 160)',
  },
  {
    id: 12,
    name: 'Teacher Revenue / Payout Self-Completion Fraud',
    collectionPath: '/payouts/pay_1',
    operation: 'update',
    actor: 'verified teacher',
    payload: { status: 'تم التحويل' },
    expectedOutcome: 'PERMISSION_DENIED',
    blockingGate: 'isAdmin() required on payouts update; finance approvedGrossTotal restricted to isAdmin()',
  },
];
