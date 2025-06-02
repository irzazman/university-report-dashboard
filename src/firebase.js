// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7W3qdgNVkYpno6JIA1wWrzJ_2z7QjIR8",
  authDomain: "university-report-application.firebaseapp.com",
  databaseURL: "https://university-report-application-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "university-report-application",
  storageBucket: "university-report-application.firebasestorage.app",
  messagingSenderId: "398631636734",
  appId: "1:398631636734:web:800aca76fe0c85b1b89faf",
  measurementId: "G-9YMZRN9MD8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);