// src/signin.js
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed in:', user);
  } catch (error) {
    console.error('Error signing in:', error);
  }
};

// Usage example
signIn('user@example.com', 'securePassword123');
