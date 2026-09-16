import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Transaction, CategoryBudgets, RecurringRule, ExchangeRates } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirestoreSync(
  userId: string | undefined,
  setTransactions: Dispatch<SetStateAction<Transaction[]>>,
  setCategoryBudgets: Dispatch<SetStateAction<CategoryBudgets>>,
  setRecurringRules: Dispatch<SetStateAction<RecurringRule[]>>,
  setExchangeRates: Dispatch<SetStateAction<ExchangeRates>>
) {
  useEffect(() => {
    if (!userId) return; // Only sync if user is logged in

    const transPath = `users/${userId}/transactions`;
    const settingsPath = `users/${userId}/settings`;

    // 1. Subscribe to transactions collection in Firestore
    const unsubTransactions = onSnapshot(collection(db, transPath), (snapshot) => {
      if (!snapshot.empty) {
        const remoteData: Transaction[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Transaction));
        remoteData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(remoteData);
      } else {
        setTransactions([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, transPath);
    });

    // 2. Subscribe to user_settings document in Firestore
    const unsubSettings = onSnapshot(doc(db, settingsPath, 'default'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.categoryBudgets) {
          try {
            setCategoryBudgets(JSON.parse(data.categoryBudgets));
          } catch(e){}
        }
        if (data.recurringRules) setRecurringRules(data.recurringRules);
        if (data.exchangeRates) setExchangeRates(data.exchangeRates);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${settingsPath}/default`);
    });

    return () => {
      unsubTransactions();
      unsubSettings();
    };
  }, [userId, setTransactions, setCategoryBudgets, setRecurringRules, setExchangeRates]);
}

export async function saveTransactionToFirestore(userId: string | undefined, transaction: Transaction) {
  if (!userId) return;
  const path = `users/${userId}/transactions`;
  try {
    const docRef = doc(db, path, transaction.id);
    const serverTimestamp = Date.now();
    
    // First check if doc exists
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      // Update
      await setDoc(docRef, {
        ...transaction,
        userId,
        createdAt: docSnap.data().createdAt, // keep original
        updatedAt: serverTimestamp
      }, { merge: false }); // merge false to enforce schema fully
    } else {
      // Create
      await setDoc(docRef, {
        ...transaction,
        userId,
        createdAt: serverTimestamp,
        updatedAt: serverTimestamp
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${transaction.id}`);
  }
}

export async function deleteTransactionFromFirestore(userId: string | undefined, id: string) {
  if (!userId) return;
  const path = `users/${userId}/transactions`;
  try {
    await deleteDoc(doc(db, path, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function saveSettingsToFirestore(
  userId: string | undefined,
  settings: {
    categoryBudgets?: CategoryBudgets;
    recurringRules?: RecurringRule[];
    exchangeRates?: ExchangeRates;
    language?: string;
    theme?: string;
  }
) {
  if (!userId) return;
  const path = `users/${userId}/settings`;
  try {
    const docRef = doc(db, path, 'default');
    const serverTimestamp = Date.now();
    
    const docSnap = await getDocFromServer(docRef);
    
    // Convert to strings for storage to bypass nested schema limits
    const toSave: any = {
      userId,
      updatedAt: serverTimestamp,
    };
    if (settings.categoryBudgets) toSave.categoryBudgets = JSON.stringify(settings.categoryBudgets);
    if (settings.language) toSave.language = settings.language;
    if (settings.theme) toSave.theme = settings.theme;

    if (docSnap.exists()) {
      toSave.createdAt = docSnap.data().createdAt;
    } else {
      toSave.createdAt = serverTimestamp;
    }
    
    // Notice we do { merge: true } here because we might not save all settings at once (e.g. only theme)
    await setDoc(docRef, toSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/default`);
  }
}
