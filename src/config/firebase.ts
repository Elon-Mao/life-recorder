import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAuSzFAheN1RRA3mX4lonvQpL9hTHaT_ws",
  authDomain: "elon-firebase.firebaseapp.com",
  projectId: "elon-firebase",
  storageBucket: "elon-firebase.appspot.com",
  messagingSenderId: "857112867232",
  appId: "1:857112867232:web:88e76ba8c4ae9d9846b4c5"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const provider = new GoogleAuthProvider()