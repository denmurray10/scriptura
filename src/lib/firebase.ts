
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';


const firebaseConfig = {
  apiKey: "AIzaSyCUxpErha69sFBmJKFZU6d1kQzhJ-CWZ-w",
  authDomain: "choicescraft-2af32.firebaseapp.com",
  projectId: "choicescraft-2af32",
  storageBucket: "choicescraft-2af32.firebasestorage.app",
  messagingSenderId: "247190213863",
  appId: "1:247190213863:web:be96d3a0a4acb91d07fe42",
  measurementId: "G-ZZP8N8HFWG"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable Firestore offline persistence
try {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
          console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
        }
      });
} catch (error) {
    console.error("Error enabling Firestore persistence:", error);
}


/**
 * Uploads a data URL (e.g., from a canvas or file reader) to Firebase Storage.
 * @param dataUrl The data URL to upload.
 * @param path The path in Firebase Storage where the file should be saved (e.g., 'character-images').
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export async function uploadDataUrlToFirebase(dataUrl: string, path: string): Promise<string> {
  // If it's already a URL, just return it. This prevents creating nested URLs.
  if (typeof dataUrl === 'string' && dataUrl.startsWith('https://')) {
    return dataUrl;
  }
  
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL provided.');
  }
  
  const mimeMatch = dataUrl.match(/^data:(.*);base64,/);
  if (!mimeMatch) {
      throw new Error("Invalid data URL format. Could not determine MIME type.");
  }
  const mimeType = mimeMatch[1];
  const fileExtension = mimeType.split('/')[1] || 'bin';

  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  // 'data_url' is the format string for uploadString when using data URLs
  const snapshot = await uploadString(storageRef, dataUrl, 'data_url', {
      contentType: mimeType,
  });
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

export { app, auth, db, storage, GoogleAuthProvider, signInWithPopup };
