import 'dotenv/config';
import admin from "firebase-admin";
let configured=false;
const projectId=process.env.FIREBASE_PROJECT_ID, clientEmail=process.env.FIREBASE_CLIENT_EMAIL, privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n');
if(projectId&&clientEmail&&privateKey){if(!admin.apps.length)admin.initializeApp({credential:admin.credential.cert({projectId,clientEmail,privateKey})});configured=true;}
export async function verifyFirebaseToken(idToken){if(!configured)throw new Error('Firebase Admin credentials are not configured');return admin.auth().verifyIdToken(idToken)}
