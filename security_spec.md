# Security Specification — منصة النبراس التعليمية مع الأستاذة ليلى

## 1. Core Data Invariants
1. **Zero-Trust Default Deny**: Every unmatched path under `/databases/{database}/documents` is explicitly denied (`allow read, write: if false;`).
2. **Verified Identity Mandate**: All authenticated mutations require `request.auth != null && request.auth.token.email_verified == true`. Bootstrapped director email (`fatifati23.mt@gmail.com`) MUST also require `email_verified == true` to defeat email spoofing.
3. **No Self-Assigned Privileged Roles**: During `/users/{userId}` creation, non-admin users may only create a profile with `role in ['student', 'parent']`. Users can never mutate their own `role` field. Only `isAdmin()` can create `/admins/{adminId}` or `/teachers/{teacherId}` records.
4. **PII Isolation**: `/users/{userId}` and `/admins/{adminId}` contain personal emails; `get` is strictly restricted to owner or admin, and `list` is restricted to `isBootstrapAdmin()` or owner-scoped `resource.data.uid == request.auth.uid`.
5. **Financial & Receipt Integrity**:
   - Students/parents can ONLY create `/receipts/{receiptId}` with `ownerId == request.auth.uid` and `status == 'pending'`.
   - Students/parents can NEVER approve, reject, or alter receipts after submission.
   - Only `isAdmin()` can transition receipt `status` (`pending` -> `approved` | `rejected`).
   - Students/parents can only read (`get`/`list`) their own receipts (`resource.data.ownerId == request.auth.uid`).
6. **Teacher Revenue & Payout Protection**:
   - Teachers can only create `/payouts/{payoutId}` with `teacherId == request.auth.uid` and `status == 'قيد التحويل'`.
   - Only `isAdmin()` can mark a payout as `'تم التحويل'`.
7. **Platform Configuration Integrity**:
   - Only `isAdmin()` can modify `ccp`, `baridi`, and section prices (`pricePrivate`, `priceSmall`, `priceGroup`) or `approvedGrossTotal` on `/settings/platform`.
   - Teachers can only update `teacherCcp` or attendance counters (`privatePres`, `smallPres`, `groupPres`) via strict `affectedKeys().hasOnly(...)` action branches.
8. **Temporal & Structural Integrity**:
   - Every document ID path variable is validated with `isValidId()` on `get`, `create`, `update`, and `delete`.
   - Every string field has strict `.size()` upper and lower bounds.
   - All `createdAt` and `updatedAt` timestamps must match `request.time`, and `createdAt` / `ownerId` / `authorId` are immutable after creation.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Self-Assigned Admin Role**: Unprivileged user creates `/users/{uid}` with `{ "role": "admin" }`.
2. **Role Escalation Update**: Existing student updates `/users/{uid}` changing `{ "role": "teacher" }`.
3. **Ghost / Shadow Field Injection**: Student creates `/receipts/{id}` with extra field `{ "isVerified": true }`.
4. **Pre-Approved Receipt Fraud**: Student creates `/receipts/{id}` with `{ "status": "approved" }`.
5. **Owner Spoofing on Receipt**: Student A creates `/receipts/{id}` with `{ "ownerId": "studentB" }`.
6. **Student Self-Approval Update**: Student A updates their own `/receipts/{id}` changing `{ "status": "approved" }`.
7. **Cross-User Receipt Theft**: Student A attempts `get` or unfiltered `list` on `/receipts` belonging to Student B.
8. **Cross-User PII Read**: Student A attempts `get` on `/users/studentB`.
9. **Unauthorized Price Tampering**: Student or Teacher attempts to update `/settings/platform` changing `{ "pricePrivate": 0, "ccp": "hacker" }`.
10. **Email Spoofing Attack**: Unverified account with `email == "fatifati23.mt@gmail.com"` and `email_verified == false` attempts admin write.
11. **ID Poisoning & Resource Exhaustion**: Attacker creates `/lessons/../../invalid$id` or submits a 250KB `title` string.
12. **Teacher Payout Self-Completion**: Teacher creates `/payouts/{id}` with `{ "status": "تم التحويل" }` or updates their own payout status to `'تم التحويل'`.
