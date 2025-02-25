import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Load the service account key JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'config', 'service-account.json'),
    'utf8'
  )
);

// Initialize Firebase Admin SDK
const apps = getApps();

const firebaseAdmin = apps.length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  : apps[0];

const adminDb = getFirestore();
const adminAuth = getAuth();

export { firebaseAdmin, adminDb, adminAuth }; 