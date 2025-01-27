const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");
const {  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } = require('firebase/auth');

const firebaseConfig = {
    apiKey: "AIzaSyDR11SK3kfGsyRGfCl0FSta-zVnCuma2FU",
    authDomain: "cemiterio-qrcode.firebaseapp.com",
    projectId: "cemiterio-qrcode",
    storageBucket: "cemiterio-qrcode.firebasestorage.app",
    messagingSenderId: "1051416706231",
    appId: "1:1051416706231:web:807119655ec3837421a132"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

module.exports = {  auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, db, storage };
