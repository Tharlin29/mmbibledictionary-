import { newBible20Entries } from '../src/data/seedDataBatch2.ts';

const FIREBASE_DB_URL = 'https://mmbbdictionary.firebaseio.com';

async function upload20Words() {
  console.log('Fetching current dictionary from Firebase...');
  const res = await fetch(`${FIREBASE_DB_URL}/dictionary.json`);
  const existing = await res.json() || {};
  
  const existingTitles = new Set(
    Object.values(existing)
      .filter((v: any) => v && v.title)
      .map((v: any) => v.title.trim().toLowerCase())
  );

  console.log('Currently in Firebase:', existingTitles.size);

  let added = 0;
  for (const entry of newBible20Entries) {
    if (existingTitles.has(entry.title.trim().toLowerCase())) {
      console.log(`Skipping existing: ${entry.title}`);
      continue;
    }

    const payload = {
      title: entry.title.trim(),
      category: entry.category || 'ဝေါဟာရနှင့် သမ္မာတရားများ',
      imageUrl: entry.imageUrl || '',
      meaning: entry.meaning.trim(),
      updatedAt: Date.now()
    };

    const pushRes = await fetch(`${FIREBASE_DB_URL}/dictionary.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (pushRes.ok) {
      console.log(`[${added + 1}/${newBible20Entries.length}] Uploaded: ${entry.title}`);
      added++;
      existingTitles.add(entry.title.trim().toLowerCase());
    } else {
      console.error(`Failed to upload ${entry.title}:`, await pushRes.text());
    }
  }

  console.log(`\nSuccessfully uploaded ${added} new Bible words!`);
  const verifyRes = await fetch(`${FIREBASE_DB_URL}/dictionary.json?shallow=true`);
  const keys = await verifyRes.json() || {};
  console.log('New total in Firebase:', Object.keys(keys).length);
}

upload20Words().catch(console.error);
