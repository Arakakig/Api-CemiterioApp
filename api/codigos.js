const { db } = require('../firebase');
const { collection, query, getDocs, doc, getDoc, setDoc, orderBy } = require('firebase/firestore');

// Save a list of unique codes. Skips existing ones.
async function saveCodes(codes) {
    if (!Array.isArray(codes)) {
        throw new Error('codes must be an array');
    }
    const trimmedCodes = codes
        .filter(Boolean)
        .map((c) => String(c).trim())
        .filter((c) => c.length > 0);

    const uniqueCodes = Array.from(new Set(trimmedCodes));

    let saved = 0;
    let skipped = 0;
    const results = [];

    for (const code of uniqueCodes) {
        try {
            const ref = doc(db, 'codigos', code);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                skipped += 1;
                results.push({ code, status: 'duplicate' });
                continue;
            }
            const now = new Date();
            const data = {
                code,
                status: 'available',
                createdAt: now,
                usedAt: null,
            };
            await setDoc(ref, data);
            saved += 1;
            results.push({ code, status: 'saved' });
        } catch (err) {
            results.push({ code, status: 'error', message: err.message });
        }
    }

    return { saved, skipped, total: uniqueCodes.length, results };
}

async function updateCode(data) {
    const ref = doc(db, 'codigos', data.id);
    console.log(data, data.id)
    await setDoc(ref, data);
    return { id, data };
}


// List all codes with normalized timestamps
async function listCodes() {
    const ref = collection(db, 'codigos');
    let q;
    try {
        q = query(ref, orderBy('createdAt', 'desc'));
    } catch (_) {
        // If index not available, fall back to simple query
        q = ref;
    }
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
        const data = d.data() || {};
        const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().getTime()
            : (data.createdAt instanceof Date ? data.createdAt.getTime() : data.createdAt || null);
        const usedAt = data.usedAt && typeof data.usedAt.toDate === 'function'
            ? data.usedAt.toDate().getTime()
            : (data.usedAt instanceof Date ? data.usedAt.getTime() : data.usedAt || null);
        return {
            id: d.id,
            code: data.code || d.id,
            status: data.status || 'available',
            createdAt,
            usedAt,
        };
    });
    return items;
}

module.exports = { saveCodes, listCodes, updateCode};
