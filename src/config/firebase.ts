import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDjdofGTzV90a5ysqdVCLGK7ozzTBu09WY",
  authDomain: "life-recorder-elon.firebaseapp.com",
  projectId: "life-recorder-elon",
  storageBucket: "life-recorder-elon.appspot.com",
  messagingSenderId: "768833236583",
  appId: "1:768833236583:web:79b6fadf2c069939c96ec2"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const provider = new GoogleAuthProvider()