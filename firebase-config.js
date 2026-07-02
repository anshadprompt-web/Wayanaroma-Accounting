// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBadRjkIO_WQlNbRzuF_CPQ8738bKYlj14",
  authDomain: "wayanaroma-accounting.firebaseapp.com",
  projectId: "wayanaroma-accounting",
  storageBucket: "wayanaroma-accounting.firebasestorage.app",
  messagingSenderId: "131833588428",
  appId: "1:131833588428:web:af4408983d15c7bfc33069",
  measurementId: "G-D7P1JV866D"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Set Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
