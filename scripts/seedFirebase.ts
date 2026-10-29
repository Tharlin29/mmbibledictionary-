import { bibleDictionaryEntries } from '../src/data/seedData.ts';

const FIREBASE_DB_URL = 'https://mmbbdictionary.firebaseio.com';

async function uploadToFirebase() {
  console.log('Fetching existing dictionary data from Firebase...');
  const res = await fetch(`${FIREBASE_DB_URL}/dictionary.json`);
  const existingData = await res.json() || {};
  
  const existingTitles = new Set(
    Object.values(existingData)
      .filter((v: any) => v && v.title)
      .map((v: any) => v.title.trim())
  );

  console.log('Currently existing entries in Firebase:', existingTitles.size);
  console.log('Existing titles:', Array.from(existingTitles));

  let addedCount = 0;
  for (const entry of bibleDictionaryEntries) {
    if (existingTitles.has(entry.title.trim())) {
      console.log(`Skipping existing title: "${entry.title}"`);
      continue;
    }

    const payload = {
      title: entry.title.trim(),
      imageUrl: entry.imageUrl || '',
      meaning: entry.meaning.trim(),
      updatedAt: Date.now()
    };

    console.log(`Uploading: "${entry.title}"...`);
    const pushRes = await fetch(`${FIREBASE_DB_URL}/dictionary.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!pushRes.ok) {
      console.error(`Failed to upload ${entry.title}:`, await pushRes.text());
    } else {
      const respJson = await pushRes.json();
      console.log(`Successfully uploaded "${entry.title}" with ID:`, respJson.name);
      addedCount++;
    }
  }

  console.log(`\nAll done! Successfully uploaded ${addedCount} new dictionary entries to Firebase Realtime Database.`);
  
  // Verify final count
  const verifyRes = await fetch(`${FIREBASE_DB_URL}/dictionary.json?shallow=true`);
  const verifyKeys = await verifyRes.json() || {};
  console.log(`Total entries now in Firebase: ${Object.keys(verifyKeys).length}`);
}

uploadToFirebase().catch(console.error);
