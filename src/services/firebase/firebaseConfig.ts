import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBMn3eSX53RoBJMR_97sF3Dxe7nEnosv0k',
  authDomain: 'lawyer-companion.firebaseapp.com',
  projectId: 'lawyer-companion',
  storageBucket: 'lawyer-companion.firebasestorage.app',
  messagingSenderId: '753863414543',
  appId: '1:753863414543:web:74fb6424aca63313c2647a',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;