import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

let app: App | null = null;

export function getAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  // Try service account file first
  const saPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(saPath)) {
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    app = initializeApp({ credential: cert(sa) });
    return app;
  }

  // Fall back to env vars
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (key) {
    let formatted = key.includes('\\n') ? key.split('\\n').join('\n') : key;
    if (formatted.startsWith('"')) formatted = formatted.slice(1, -1);

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatted,
      }),
    });
  } else {
    app = initializeApp();
  }

  return app;
}

export function getAdminFirestore(): Firestore {
  getAdminApp();
  return getFirestore();
}
