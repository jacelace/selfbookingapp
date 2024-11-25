import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminEmail = 'admin@example.com';
const adminPassword = 'admin123';

// Initialize Firebase Admin with service account
const serviceAccount = {
  type: "service_account",
  project_id: "therapy-session-booking-app",
  private_key_id: "a09a4043d74e1edf3d3fcdec3404a8ff1031088d",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNqfRETtklFxkj\n/2rnXNlpVYocSVkXaG1M6Ha6f+igoJs7Sf/el1iAIFAIQdYyoMCPDLYg8v+vnq7i\n9whpT/IqLP9SWBnxcNBRzetzl7Pwr/CKGjeRe8bzlxZPwOkmP0/yzisBaz32wY6h\nUSDoWmK4SGWQc/T6KlFtTr/ln3EyfvcI8QneC0hvg8bqlnZxWAyqYBaM/J04tuju\niJneWYTnzX68cFQet7vveWGcDvPiOGl3Hu3f6n4TzxR3ziJcEkVRamnff+TTIBhY\nJFQXjEGrSO5Ry73AeYeA131F9qcamXm2F3FnYpz0oMvQTWKiEbxKlSbz+CScJt6R\nZEK/UAG5AgMBAAECggEAZEA2K53rx2KtBJkauVDPQcNKoWM3pGto7BZc2ahD8xiW\n0p3Ntek8YKhfmsbM7LzjYFen6APLkwXc5hHY7czklJ5+jtsXOlPtmBKydRQ7yFVb\nAVaqQ6Z8Yn0BiTrV66jtBcRtvjFScRgEuKndSqXUfVP8/h8oCVHbg1bhv8Kq4RuW\nzTDsOvQnD3gQq3h6Yfx0aEioXJajd7+a4wgflkGpdAhEcylOpApAG5dQuGZDiIgw\n+uaoYnOYL8o20Btryr6WHSTHLxmdlA38AKwvl3BEDKYOfR5bZ1uEhJJ7ovOCjgt/\n81GfPY5Ie3o4j4Z8p9BXr2p7dUFXKR6xcFUKJKAgiQKBgQDwJC45IKCF2Yfxr2fV\nO7ok7ubk9o6z8iLgYwqTlBxp+1RHDtVKpFMJZxHaU5y1aE9SxkQndL3LVa7rkDoX\n+QV60gO5i7KMtTNYPIUH9TB+gszE8oVlYwwycYXHqpqW9v9lVmJDXB6PsxU5/KBg\ny7hFkzN7vmsj0RFhdKNzel/B1wKBgQDbPuY5SQqlUtJGELehTUg0l5SQDpuvHEY3\njA+oSc/d/cjyu//1/pPIno7z1iIsaEhv/Bq+pxV4TAafteR/RVUxvv1Cn4ofEDFx\nHxEKCqvvCGn+bSGjmSLvizdb+N5FTemvmvJ2ehCKYY/Etvqf7Pi+mX1fXw3v9hHU\nf+SDm7kG7wKBgQC4+RWFuYUMNPgLCTJwxFXotwCxYt2e7CdDMebmsFKGrCpJpbpT\niWnQt0zAIGF4NoXLW58JyVmccz6OgoTNDGrVJUnrNRjuW3DWSZ+q9olJGZWDKs/n\nvbiabmk+2EHFgTJOq5B7FE0SIT57cQVUKfeh1/XzHkTGzPaXW9G/VIbH9wKBgDuB\n6wMJbDZLMH+L8gt56ms76TrgfCkfR3+0KFvJDP53757SoDqoinwdbTeJm2TqOR8M\nEkZFG3K3T+Txfb99lg4WhK8clmSwBHtrrzhGhTwv0HUaMdMxsWXLJ49zEQFGkHL1\nX3IA15R3vonqEERwEWPKTVkhd6r14wkGXYPLNIFJAoGBAO7yXy0q4n+w53fxhB+O\nnrEsDu7HIx699lc5rJvGdXb0cvbqP3vR5fNCx3aUqIr0V/f1/IH6a6kfC3WnsDZN\nAfWqX6hDM6dT9F70Co5DhbiB6402qlHzCIWyWlhde3JhW/46mGf0M2VoDw3YTj0p\nUbed67v6ndsr0Rfq36IKFbs7\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-10si4@therapy-session-booking-app.iam.gserviceaccount.com",
  client_id: "109146241274578306046",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-10si4%40therapy-session-booking-app.iam.gserviceaccount.com"
};

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
const db = getFirestore(app);

async function setupAdmin() {
  try {
    // Create or update the user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: true
      });
      console.log('New admin user created in Auth');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        userRecord = await auth.getUserByEmail(adminEmail);
        console.log('Existing admin user found in Auth');
      } else {
        throw error;
      }
    }

    // Set custom claims for admin
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Create or update the user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: adminEmail,
      isAdmin: true,
      role: 'admin',
      status: 'active',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    console.log('Admin user setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin user:', error);
    process.exit(1);
  }
}

setupAdmin();