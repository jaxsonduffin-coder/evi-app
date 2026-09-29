"use strict";
// =============================================
// EVI - Cloud Functions
// Serverless backend for AI-powered features
// =============================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlertPush = exports.exportUserData = exports.checkImportantDates = exports.joinHouseholdByCode = exports.createHouseholdInvite = exports.deleteAccount = exports.onDocumentUploaded = exports.analyzeDocument = exports.askHousehold = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const vision_1 = require("@google-cloud/vision");
const crypto = __importStar(require("crypto"));
admin.initializeApp();
(0, v2_1.setGlobalOptions)({ region: 'us-central1' });
// Lazy-initialize clients — secrets are only available at request time, not module load
let _openai = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}
let _vision = null;
function getVision() {
    if (!_vision) {
        _vision = new vision_1.ImageAnnotatorClient();
    }
    return _vision;
}
// =============================================
// askHousehold — Ask EVI chat endpoint
// =============================================
exports.askHousehold = (0, https_1.onRequest)({ cors: true, secrets: ['OPENAI_API_KEY'] }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ error: 'Method not allowed' });
            return;
        }
        const { messages, context } = req.body;
        if (!messages || !Array.isArray(messages)) {
            res.status(400).send({ error: 'messages is required' });
            return;
        }
        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 500,
        });
        const content = completion.choices[0].message.content || '';
        res.status(200).send({
            content,
            sources: [], // TODO: Extract source references from response
        });
    }
    catch (err) {
        console.error('askHousehold error:', err);
        res.status(500).send({ error: err.message || 'Internal error' });
    }
});
// =============================================
// analyzeDocument — Extract data from uploaded documents
// =============================================
exports.analyzeDocument = (0, https_1.onRequest)({ cors: true, secrets: ['OPENAI_API_KEY'], timeoutSeconds: 120 }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ error: 'Method not allowed' });
            return;
        }
        const { fileURL, mimeType, hint } = req.body;
        if (!fileURL) {
            res.status(400).send({ error: 'fileURL is required' });
            return;
        }
        // Step 1: OCR with Google Vision
        let extractedText = '';
        if (mimeType?.startsWith('image/') || mimeType === 'application/pdf') {
            const [ocr] = await getVision().documentTextDetection(fileURL);
            extractedText = ocr.fullTextAnnotation?.text || '';
        }
        // Step 2: Analyze text with GPT to extract structured data
        const systemPrompt = `You are a document analyzer. Given the text extracted from a document, return a JSON object with:
- summary: brief 1-2 sentence summary
- suggestedTitle: short descriptive title
- suggestedCategory: one of "home", "vehicle", "utility", "personal", "insurance", "warranty", "receipt", "contract", "medical", "financial", "identification", "other"
- suggestedSubcategory: when suggestedCategory is "identification", one of "drivers_license", "passport", "state_id", "credit_card", "debit_card", "vehicle_registration", "social_security_card", "other"
- keyDates: array of {label, date (ISO), isDeadline (boolean)}
- keyAmounts: array of {label, amount (number), currency}
- extractedData: any other structured info found (parties, account numbers, etc. — NEVER include full card numbers, SSNs, or government ID numbers here, only last 4 digits if present)

Pay special attention to identification & personal cards:
- Driver's licenses, state IDs, and passports: extract the expiration date as a keyDate with label "Expires" and isDeadline true.
- Credit/debit cards: extract the card expiration date (MM/YY) as a keyDate with label "Card expires" and isDeadline true. Never extract or repeat the full card number.
- Vehicle registration: extract the registration expiration date as a keyDate with label "Registration expires" and isDeadline true.
For any of these, set suggestedCategory to "identification" and pick the closest suggestedSubcategory.

${hint?.category ? `Hint: category is likely "${hint.category}"` : ''}

Document text:
${extractedText.slice(0, 8000)}

Return ONLY valid JSON, no markdown.`;
        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });
        const raw = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(raw);
        res.status(200).send({
            ...parsed,
            extractedText,
            confidence: 0.85,
        });
    }
    catch (err) {
        console.error('analyzeDocument error:', err);
        res.status(500).send({ error: err.message || 'Internal error' });
    }
});
// =============================================
// onDocumentUploaded — Trigger analysis when a doc is created
// =============================================
exports.onDocumentUploaded = (0, firestore_1.onDocumentCreated)({
    document: 'documents/{documentId}',
    secrets: ['OPENAI_API_KEY'],
}, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const document = snap.data();
    const documentId = event.params.documentId;
    // Skip if already analyzed
    if (document.summary)
        return;
    try {
        // Call the analyze function internally
        const analyzeUrl = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/analyzeDocument`;
        const response = await fetch(analyzeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileURL: document.fileURL,
                mimeType: document.mimeType,
                hint: { category: document.category },
            }),
        });
        if (!response.ok)
            return;
        const analysis = await response.json();
        // Update document with analysis
        await admin.firestore().collection('documents').doc(documentId).update({
            summary: analysis.summary,
            keyDates: analysis.keyDates || [],
            keyAmounts: analysis.keyAmounts || [],
            extractedData: analysis.extractedData || {},
        });
        // Auto-create tasks from deadline dates
        const deadlines = (analysis.keyDates || []).filter((d) => d.isDeadline);
        for (const deadline of deadlines) {
            await admin.firestore().collection('tasks').add({
                householdId: document.householdId,
                title: `${deadline.label} — ${document.title}`,
                description: `Auto-created from document: ${document.title}`,
                priority: 'medium',
                status: 'pending',
                dueDate: new Date(deadline.date),
                isRecurring: false,
                relatedDocumentId: documentId,
                createdBy: document.uploadedBy,
                category: 'auto-generated',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    catch (err) {
        console.error('onDocumentUploaded error:', err);
    }
});
// =============================================
// deleteAccount — Erase user data (Apple mandate)
// =============================================
// Callable function; user must be authenticated.
// Deletes all their data across Firestore + Storage + Auth.
// Called from Profile screen "Delete Account" flow.
exports.deleteAccount = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const db = admin.firestore();
    const storage = admin.storage();
    const bucket = storage.bucket();
    try {
        // 1. Get user profile to find household
        const userSnap = await db.collection('users').doc(uid).get();
        const userData = userSnap.data();
        // 2. Delete all household documents from Storage + Firestore
        if (userData?.householdIds) {
            for (const householdId of userData.householdIds) {
                // Delete storage
                try {
                    await bucket.deleteFiles({ prefix: `households/${householdId}/` });
                }
                catch (e) {
                    console.warn('Storage delete failed:', e);
                }
                // Query all collections for this household
                const collections = [
                    'documents',
                    'tasks',
                    'alerts',
                    'events',
                    'vehicles',
                    'homeProfiles',
                    'chats',
                ];
                for (const col of collections) {
                    const snap = await db.collection(col).where('householdId', '==', householdId).get();
                    const batch = db.batch();
                    snap.docs.forEach((d) => batch.delete(d.ref));
                    if (snap.docs.length > 0)
                        await batch.commit();
                }
                // Delete household doc if user is the last member / creator
                const householdSnap = await db.collection('households').doc(householdId).get();
                const householdData = householdSnap.data();
                if (householdData?.createdBy === uid) {
                    await db.collection('households').doc(householdId).delete();
                }
                else if (householdData?.memberIds) {
                    // Just remove user from members
                    await db.collection('households').doc(householdId).update({
                        memberIds: admin.firestore.FieldValue.arrayRemove(uid),
                        members: householdData.members.filter((m) => m.userId !== uid),
                    });
                }
            }
        }
        // 3. Delete referrals
        const refsIn = await db.collection('referrals').where('referrerId', '==', uid).get();
        const refsOut = await db.collection('referrals').where('referredUserId', '==', uid).get();
        const refBatch = db.batch();
        [...refsIn.docs, ...refsOut.docs].forEach((d) => refBatch.delete(d.ref));
        if (refsIn.size + refsOut.size > 0)
            await refBatch.commit();
        // 4. Delete user doc from Firestore
        await db.collection('users').doc(uid).delete();
        // 5. Delete Firebase Auth user
        await admin.auth().deleteUser(uid);
        return { success: true };
    }
    catch (err) {
        console.error('deleteAccount error:', err);
        throw new https_1.HttpsError('internal', err.message || 'Delete failed');
    }
});
// =============================================
// createHouseholdInvite — Generate a short-lived join code for a household
// =============================================
// Callable; caller must already be a member of the household.
// Returns { code } — a 6-character code valid for 7 days, single-use.
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
function generateInviteCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
    }
    return code;
}
exports.createHouseholdInvite = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const { householdId } = request.data || {};
    if (!householdId || typeof householdId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'householdId is required.');
    }
    const db = admin.firestore();
    const householdSnap = await db.collection('households').doc(householdId).get();
    const household = householdSnap.data();
    if (!household) {
        throw new https_1.HttpsError('not-found', 'Household not found.');
    }
    if (!household.memberIds?.includes(uid)) {
        throw new https_1.HttpsError('permission-denied', 'You are not a member of this household.');
    }
    // Invalidate any previous unused invites from this household to avoid clutter
    const oldInvites = await db
        .collection('invites')
        .where('householdId', '==', householdId)
        .where('used', '==', false)
        .get();
    const batch = db.batch();
    oldInvites.docs.forEach((d) => batch.update(d.ref, { used: true }));
    if (oldInvites.size > 0)
        await batch.commit();
    // Retry a handful of times in the unlikely event of a code collision
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateInviteCode();
        const existing = await db.collection('invites').where('code', '==', candidate).limit(1).get();
        if (existing.empty) {
            code = candidate;
            break;
        }
    }
    if (!code) {
        throw new https_1.HttpsError('internal', 'Could not generate a unique invite code. Try again.');
    }
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const userSnap = await db.collection('users').doc(uid).get();
    const inviterName = userSnap.data()?.displayName || 'A household member';
    await db.collection('invites').add({
        code,
        householdId,
        householdName: household.name,
        invitedBy: uid,
        invitedByName: inviterName,
        used: false,
        usedBy: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
    });
    return { code, expiresAt: expiresAt.toMillis() };
});
// =============================================
// joinHouseholdByCode — Redeem an invite code and join the household
// =============================================
exports.joinHouseholdByCode = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const rawCode = request.data?.code;
    if (!rawCode || typeof rawCode !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'code is required.');
    }
    const code = rawCode.trim().toUpperCase();
    const db = admin.firestore();
    const inviteQuery = await db
        .collection('invites')
        .where('code', '==', code)
        .limit(1)
        .get();
    if (inviteQuery.empty) {
        throw new https_1.HttpsError('not-found', 'That invite code is invalid.');
    }
    const inviteDoc = inviteQuery.docs[0];
    const invite = inviteDoc.data();
    if (invite.used) {
        throw new https_1.HttpsError('failed-precondition', 'That invite code has already been used.');
    }
    if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
        throw new https_1.HttpsError('failed-precondition', 'That invite code has expired.');
    }
    const householdRef = db.collection('households').doc(invite.householdId);
    const householdSnap = await householdRef.get();
    const household = householdSnap.data();
    if (!household) {
        throw new https_1.HttpsError('not-found', 'That household no longer exists.');
    }
    if (household.memberIds?.includes(uid)) {
        // Already a member — mark invite used and just return the household
        await inviteDoc.ref.update({ used: true, usedBy: uid });
        return { householdId: invite.householdId, alreadyMember: true };
    }
    // Enforce the household owner's plan member limit
    const ownerSnap = await db.collection('users').doc(household.createdBy).get();
    const ownerTier = ownerSnap.data()?.subscriptionTier || 'free';
    const maxMembers = { free: 1, solo: 1, household: 10, pro: 10 };
    const limit = maxMembers[ownerTier] ?? 1;
    const currentCount = household.memberIds?.length || 0;
    if (currentCount >= limit) {
        throw new https_1.HttpsError('resource-exhausted', 'This household has reached its member limit for the owner\'s current plan.');
    }
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data();
    const displayName = userData?.displayName || 'New member';
    await householdRef.update({
        memberIds: admin.firestore.FieldValue.arrayUnion(uid),
        members: admin.firestore.FieldValue.arrayUnion({
            userId: uid,
            displayName,
            role: 'member',
            joinedAt: admin.firestore.Timestamp.now(),
        }),
    });
    await db.collection('users').doc(uid).update({
        householdIds: admin.firestore.FieldValue.arrayUnion(invite.householdId),
        currentHouseholdId: invite.householdId,
        onboardingComplete: true,
    });
    await inviteDoc.ref.update({ used: true, usedBy: uid });
    return { householdId: invite.householdId, householdName: invite.householdName, alreadyMember: false };
});
// =============================================
// checkImportantDates — Daily job: create alerts for upcoming birthdays/anniversaries
// =============================================
// Runs once a day. For every important date whose reminder window matches
// "today", creates a household alert (which sendAlertPush then turns into
// a push notification automatically).
exports.checkImportantDates = (0, scheduler_1.onSchedule)({ schedule: 'every day 13:00', timeZone: 'America/Denver' }, async () => {
    const db = admin.firestore();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const snap = await db.collection('importantDates').get();
    if (snap.empty)
        return;
    const batch = db.batch();
    let writes = 0;
    for (const docSnap of snap.docs) {
        const d = docSnap.data();
        const remindDaysBefore = typeof d.remindDaysBefore === 'number' ? d.remindDaysBefore : 3;
        // Compute this year's (or next year's, if already passed) occurrence
        let occurrence = new Date(today.getFullYear(), d.month - 1, d.day);
        if (occurrence < today) {
            occurrence = new Date(today.getFullYear() + 1, d.month - 1, d.day);
        }
        const daysUntil = Math.round((occurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil !== remindDaysBefore)
            continue;
        const turningAge = d.year ? occurrence.getFullYear() - d.year : undefined;
        const typeLabel = d.type === 'birthday' ? 'birthday' : d.type === 'anniversary' ? 'anniversary' : d.label || 'date';
        const title = d.type === 'birthday'
            ? `${d.personName}'s birthday is coming up${turningAge ? ` (turning ${turningAge})` : ''}`
            : d.type === 'anniversary'
                ? `${d.personName}'s anniversary is coming up${turningAge ? ` (${turningAge} years)` : ''}`
                : `${d.personName} — ${typeLabel} is coming up`;
        const description = daysUntil === 0
            ? `It's today, ${occurrence.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
            : `Coming up on ${occurrence.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`;
        const alertRef = db.collection('alerts').doc();
        batch.set(alertRef, {
            householdId: d.householdId,
            title,
            description,
            severity: daysUntil === 0 ? 'urgent' : 'warning',
            category: 'important_date',
            relatedDocumentId: null,
            relatedTaskId: null,
            dueDate: admin.firestore.Timestamp.fromDate(occurrence),
            isDismissed: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        writes++;
    }
    if (writes > 0)
        await batch.commit();
    console.log(`checkImportantDates: created ${writes} alert(s)`);
});
// =============================================
// exportUserData — Bundle a user's data into a downloadable JSON file
// =============================================
// Callable; satisfies Apple's data-access requirement and general privacy
// compliance (GDPR/CCPA "right to access"). Gathers the user's profile and
// everything tied to their household(s), writes it to Storage under
// exports/{uid}/, and returns a time-limited signed download URL.
exports.exportUserData = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const db = admin.firestore();
    const userSnap = await db.collection('users').doc(uid).get();
    const userData = userSnap.data();
    if (!userData) {
        throw new https_1.HttpsError('not-found', 'User record not found.');
    }
    const householdIds = userData.householdIds || [];
    const households = [];
    const homeProfiles = [];
    const documents = [];
    const tasks = [];
    const events = [];
    const vehicles = [];
    const importantDates = [];
    for (const householdId of householdIds) {
        const householdSnap = await db.collection('households').doc(householdId).get();
        if (householdSnap.exists)
            households.push({ id: householdSnap.id, ...householdSnap.data() });
        const [profilesSnap, docsSnap, tasksSnap, eventsSnap, vehiclesSnap, datesSnap] = await Promise.all([
            db.collection('homeProfiles').where('householdId', '==', householdId).get(),
            db.collection('documents').where('householdId', '==', householdId).get(),
            db.collection('tasks').where('householdId', '==', householdId).get(),
            db.collection('events').where('householdId', '==', householdId).get(),
            db.collection('vehicles').where('householdId', '==', householdId).get(),
            db.collection('importantDates').where('householdId', '==', householdId).get(),
        ]);
        profilesSnap.docs.forEach((d) => homeProfiles.push({ id: d.id, ...d.data() }));
        docsSnap.docs.forEach((d) => {
            // Include metadata and the file's download URL, not the file bytes themselves —
            // the export stays a small JSON file and the person can still fetch each file.
            documents.push({ id: d.id, ...d.data() });
        });
        tasksSnap.docs.forEach((d) => tasks.push({ id: d.id, ...d.data() }));
        eventsSnap.docs.forEach((d) => events.push({ id: d.id, ...d.data() }));
        vehiclesSnap.docs.forEach((d) => vehicles.push({ id: d.id, ...d.data() }));
        datesSnap.docs.forEach((d) => importantDates.push({ id: d.id, ...d.data() }));
    }
    const referralsSnap = await db.collection('referrals').where('referrerId', '==', uid).get();
    const referrals = referralsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: { id: uid, ...userData },
        households,
        homeProfiles,
        documents,
        tasks,
        events,
        vehicles,
        importantDates,
        referrals,
    };
    const bucket = admin.storage().bucket();
    const fileName = `export_${Date.now()}.json`;
    const filePath = `exports/${uid}/${fileName}`;
    const file = bucket.file(filePath);
    // Use a Firebase-style download token (like the client SDK's getDownloadURL)
    // instead of a GCS signed URL — signed URLs need the Cloud Functions runtime
    // service account to have serviceAccountTokenCreator on itself, which is an
    // IAM grant outside what this function should do on its own. The download
    // token approach works with the storage.rules already deployed (only the
    // owning user can read their own exports/{uid}/ path) and needs no extra IAM.
    const downloadToken = crypto.randomUUID();
    await file.save(JSON.stringify(exportPayload, null, 2), {
        contentType: 'application/json',
        metadata: {
            cacheControl: 'private, max-age=0',
            metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
    });
    const encodedPath = encodeURIComponent(filePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
    return { downloadUrl, fileName };
});
// =============================================
// sendAlertPush — Push notification when an urgent/warning alert is created
// =============================================
exports.sendAlertPush = (0, firestore_1.onDocumentCreated)({ document: 'alerts/{alertId}' }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const alert = snap.data();
    if (alert.severity !== 'urgent' && alert.severity !== 'warning')
        return;
    try {
        const householdSnap = await admin
            .firestore()
            .collection('households')
            .doc(alert.householdId)
            .get();
        const household = householdSnap.data();
        if (!household?.memberIds)
            return;
        const tokens = [];
        for (const memberId of household.memberIds) {
            const memberSnap = await admin.firestore().collection('users').doc(memberId).get();
            const memberData = memberSnap.data();
            if (memberData?.pushTokens)
                tokens.push(...memberData.pushTokens);
        }
        if (tokens.length === 0)
            return;
        const messages = tokens.map((to) => ({
            to,
            title: alert.title,
            body: alert.description,
            sound: 'default',
            priority: 'high',
            channelId: alert.severity === 'urgent' ? 'urgent' : 'default',
            data: {
                alertId: event.params.alertId,
                category: alert.category,
            },
        }));
        for (let i = 0; i < messages.length; i += 100) {
            const chunk = messages.slice(i, i + 100);
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            });
        }
    }
    catch (err) {
        console.error('sendAlertPush error:', err);
    }
});
//# sourceMappingURL=index.js.map