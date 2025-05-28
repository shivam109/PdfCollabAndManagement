const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Make sure this file is downloaded from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

// Firestore database reference
const db = admin.firestore();

// Firebase storage bucket reference
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
