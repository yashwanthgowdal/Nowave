import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  type Firestore,
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { INITIAL_MENU_ITEMS, DEFAULT_CATEGORIES } from "./sampleMenu";

// Read Vite environment variables cleanly
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Validate if Firebase configuration is provided and valid (not empty or placeholder)
export const isFirebaseConfigured = Boolean(
  apiKey &&
  projectId &&
  !apiKey.includes("your_api_key") &&
  !projectId.includes("your_project_id") &&
  apiKey.length > 5
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.warn("Failed to initialize Firebase app:", err);
  }
}

export { app, db, auth };

/**
 * Auto-Seed Logic:
 * On first launch, if the Firestore menuItems collection is empty,
 * automatically seed it with all 21 restaurant dishes & categories.
 */
export async function autoSeedFirestoreIfEmpty(firestoreDb: Firestore) {
  try {
    const menuItemsCol = collection(firestoreDb, "menuItems");
    const snapshot = await getDocs(menuItemsCol);

    if (snapshot.empty) {
      console.log("🌱 Firestore menuItems collection is empty. Auto-seeding 21 dishes...");
      const batch = writeBatch(firestoreDb);

      // Seed categories
      const categoriesCol = collection(firestoreDb, "categories");
      for (const cat of DEFAULT_CATEGORIES) {
        const catRef = doc(categoriesCol, cat.id);
        batch.set(catRef, cat);
      }

      // Seed menu items
      for (let i = 0; i < INITIAL_MENU_ITEMS.length; i++) {
        const item = INITIAL_MENU_ITEMS[i];
        const itemRef = doc(menuItemsCol);
        batch.set(itemRef, {
          ...item,
          createdAt: Date.now() + i,
          updatedAt: Date.now() + i,
        });
      }

      await batch.commit();
      console.log("✅ Auto-seed complete! All 21 dishes & 5 categories written to Firestore.");
    }
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
}
