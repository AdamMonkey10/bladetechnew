// src/utils/palletUtils.js
// New utility functions for pallet management - NO CHANGES to existing code

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// --- Pallet Number Generation ---
export const generatePalletNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const prefix = `PAL-${year}-`;
  
  try {
    // Get the latest pallet number for this year
    const palletsRef = collection(db, 'Pallets');
    const q = query(
      palletsRef,
      where('palletNumber', '>=', prefix),
      where('palletNumber', '<', `PAL-${year + 1}-`),
      orderBy('palletNumber', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return `${prefix}001`;
    }
    
    const latestPallet = snapshot.docs[0].data();
    const latestNumber = latestPallet.palletNumber;
    const numberPart = parseInt(latestNumber.split('-')[2]) || 0;
    const nextNumber = (numberPart + 1).toString().padStart(3, '0');
    
    return `${prefix}${nextNumber}`;
  } catch (error) {
    console.error('Error generating pallet number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
};

// --- Pallet Creation ---
export const createPallet = async (palletData) => {
  try {
    const palletNumber = await generatePalletNumber();
    
    const newPallet = {
      palletNumber,
      customer: palletData.customer || '',
      PO: palletData.PO || '',
      SKU: palletData.SKU || '',
      status: 'active',
      maxCapacity: palletData.maxCapacity || 48,
      currentCount: 0,
      createdAt: serverTimestamp(),
      createdBy: palletData.operator || '',
      boxes: [],
      totalQuantity: 0,
    };
    
    const docRef = await addDoc(collection(db, 'Pallets'), newPallet);
    return { id: docRef.id, ...newPallet };
  } catch (error) {
    console.error('Error creating pallet:', error);
    throw error;
  }
};

// --- Get Available Boxes (boxes not assigned to any pallet) ---
export const getAvailableBoxes = async (customer = '', PO = '', SKU = '') => {
  try {
    // First get all boxes
    const boxesRef = collection(db, 'LabelBoxes');
    let q = query(boxesRef, orderBy('createdAt', 'desc'));
    
    // Add filters if provided
    if (customer) {
      q = query(q, where('customer', '==', customer));
    }
    if (PO) {
      q = query(q, where('PO', '==', PO));
    }
    if (SKU) {
      q = query(q, where('SKU', '==', SKU));
    }
    
    const boxesSnapshot = await getDocs(q);
    const allBoxes = boxesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get all assigned boxes from PalletBoxes
    const palletBoxesRef = collection(db, 'PalletBoxes');
    const palletBoxesSnapshot = await getDocs(palletBoxesRef);
    const assignedBoxIds = new Set(
      palletBoxesSnapshot.docs.map(doc => doc.data().boxId)
    );
    
    // Filter out assigned boxes
    const availableBoxes = allBoxes.filter(box => !assignedBoxIds.has(box.id));
    
    return availableBoxes;
  } catch (error) {
    console.error('Error fetching available boxes:', error);
    throw error;
  }
};

// --- Add Box to Pallet ---
export const addBoxToPallet = async (palletId, boxId) => {
  try {
    // Get pallet details
    const palletRef = doc(db, 'Pallets', palletId);
    const palletSnap = await getDoc(palletRef);
    
    if (!palletSnap.exists()) {
      throw new Error('Pallet not found');
    }
    
    const palletData = palletSnap.data();
    
    // Check if pallet is full
    if (palletData.currentCount >= palletData.maxCapacity) {
      throw new Error('Pallet is already at maximum capacity');
    }
    
    // Get box details
    const boxRef = doc(db, 'LabelBoxes', boxId);
    const boxSnap = await getDoc(boxRef);
    
    if (!boxSnap.exists()) {
      throw new Error('Box not found');
    }
    
    const boxData = boxSnap.data();
    
    // Validate compatibility (same customer, PO, SKU)
    if (palletData.customer && palletData.customer !== boxData.customer) {
      throw new Error('Box customer does not match pallet customer');
    }
    if (palletData.PO && palletData.PO !== boxData.PO) {
      throw new Error('Box PO does not match pallet PO');
    }
    if (palletData.SKU && palletData.SKU !== boxData.SKU) {
      throw new Error('Box SKU does not match pallet SKU');
    }
    
    // Check if box is already assigned
    const palletBoxesRef = collection(db, 'PalletBoxes');
    const existingQuery = query(palletBoxesRef, where('boxId', '==', boxId));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Box is already assigned to a pallet');
    }
    
    // Add to PalletBoxes junction table
    await addDoc(collection(db, 'PalletBoxes'), {
      palletId,
      boxId,
      assignedAt: serverTimestamp(),
      boxQuantity: boxData.quantity || 0,
    });
    
    // Update pallet counts
    const newCount = palletData.currentCount + 1;
    const newTotalQuantity = (palletData.totalQuantity || 0) + (boxData.quantity || 0);
    const updatedBoxes = [...(palletData.boxes || []), boxId];
    
    await updateDoc(palletRef, {
      currentCount: newCount,
      totalQuantity: newTotalQuantity,
      boxes: updatedBoxes,
      // Auto-complete if at capacity
      ...(newCount >= palletData.maxCapacity && {
        status: 'completed',
        completedAt: serverTimestamp(),
      }),
    });
    
    return {
      success: true,
      newCount,
      isComplete: newCount >= palletData.maxCapacity,
    };
  } catch (error) {
    console.error('Error adding box to pallet:', error);
    throw error;
  }
};

// --- Get Pallets ---
export const getPallets = async (status = null) => {
  try {
    const palletsRef = collection(db, 'Pallets');
    let q = query(palletsRef, orderBy('createdAt', 'desc'));
    
    if (status) {
      q = query(palletsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching pallets:', error);
    throw error;
  }
};

// --- Get Pallet with Boxes ---
export const getPalletWithBoxes = async (palletId) => {
  try {
    // Get pallet
    const palletRef = doc(db, 'Pallets', palletId);
    const palletSnap = await getDoc(palletRef);
    
    if (!palletSnap.exists()) {
      throw new Error('Pallet not found');
    }
    
    const palletData = { id: palletSnap.id, ...palletSnap.data() };
    
    // Get associated boxes
    const palletBoxesRef = collection(db, 'PalletBoxes');
    const q = query(palletBoxesRef, where('palletId', '==', palletId));
    const palletBoxesSnapshot = await getDocs(q);
    
    const boxIds = palletBoxesSnapshot.docs.map(doc => doc.data().boxId);
    
    // Get box details
    const boxes = [];
    for (const boxId of boxIds) {
      const boxRef = doc(db, 'LabelBoxes', boxId);
      const boxSnap = await getDoc(boxRef);
      if (boxSnap.exists()) {
        boxes.push({ id: boxSnap.id, ...boxSnap.data() });
      }
    }
    
    return {
      ...palletData,
      assignedBoxes: boxes,
    };
  } catch (error) {
    console.error('Error fetching pallet with boxes:', error);
    throw error;
  }
};

// --- Remove Box from Pallet ---
export const removeBoxFromPallet = async (palletId, boxId) => {
  try {
    // Get pallet
    const palletRef = doc(db, 'Pallets', palletId);
    const palletSnap = await getDoc(palletRef);
    
    if (!palletSnap.exists()) {
      throw new Error('Pallet not found');
    }
    
    const palletData = palletSnap.data();
    
    // Don't allow modification of completed pallets
    if (palletData.status === 'completed') {
      throw new Error('Cannot modify completed pallet');
    }
    
    // Remove from PalletBoxes
    const palletBoxesRef = collection(db, 'PalletBoxes');
    const q = query(
      palletBoxesRef,
      where('palletId', '==', palletId),
      where('boxId', '==', boxId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Box not found on this pallet');
    }
    
    const palletBoxDoc = snapshot.docs[0];
    const palletBoxData = palletBoxDoc.data();
    
    // Delete the junction record
    await palletBoxDoc.ref.delete();
    
    // Update pallet counts
    const newCount = Math.max(0, palletData.currentCount - 1);
    const newTotalQuantity = Math.max(0, (palletData.totalQuantity || 0) - (palletBoxData.boxQuantity || 0));
    const updatedBoxes = (palletData.boxes || []).filter(id => id !== boxId);
    
    await updateDoc(palletRef, {
      currentCount: newCount,
      totalQuantity: newTotalQuantity,
      boxes: updatedBoxes,
      // Revert to active if it was auto-completed
      ...(palletData.status === 'completed' && newCount < palletData.maxCapacity && {
        status: 'active',
        completedAt: null,
      }),
    });
    
    return { success: true, newCount };
  } catch (error) {
    console.error('Error removing box from pallet:', error);
    throw error;
  }
};

// --- Complete Pallet Manually ---
export const completePallet = async (palletId) => {
  try {
    const palletRef = doc(db, 'Pallets', palletId);
    const palletSnap = await getDoc(palletRef);
    
    if (!palletSnap.exists()) {
      throw new Error('Pallet not found');
    }
    
    const palletData = palletSnap.data();
    
    if (palletData.status === 'completed') {
      throw new Error('Pallet is already completed');
    }
    
    if (palletData.currentCount === 0) {
      throw new Error('Cannot complete empty pallet');
    }
    
    await updateDoc(palletRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error completing pallet:', error);
    throw error;
  }
};

// --- Pallet Settings ---
export const getPalletSettings = async () => {
  try {
    const settingsRef = doc(db, 'PalletSettings', 'default');
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data();
    } else {
      // Return default settings
      return {
        defaultCapacity: 48,
        autoCompleteAtCapacity: true,
        requireOperatorForCompletion: false,
      };
    }
  } catch (error) {
    console.error('Error fetching pallet settings:', error);
    return {
      defaultCapacity: 48,
      autoCompleteAtCapacity: true,
      requireOperatorForCompletion: false,
    };
  }
};