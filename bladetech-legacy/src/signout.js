// src/signout.js
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Usage example
signOutUser();
