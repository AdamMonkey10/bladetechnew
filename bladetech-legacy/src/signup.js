// src/signup.js
import { auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed up:', user);
  } catch (error) {
    console.error('Error signing up:', error);
  }
};

// Usage example
signUp('user@example.com', 'securePassword123');
