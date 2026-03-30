// authService.js

import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from "firebase/auth";

/**
 * Registers a new user with email and password.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<UserCredential>} - The user credential object.
 */
export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Logs in an existing user with email and password.
 * @param {string} email - User's email address.
 * @param {string} password - User's password.
 * @returns {Promise<UserCredential>} - The user credential object.
 */
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Logs out the current user.
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
  return signOut(auth);
};

/**
 * Sends a password reset email to the specified email address.
 * @param {string} email - User's email address.
 * @returns {Promise<void>}
 */
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};
