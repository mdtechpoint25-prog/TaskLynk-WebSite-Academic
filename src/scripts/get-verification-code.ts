import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getVerificationCode() {
  const email = 'testfreelancer@gmail.com';
  
  const [pending] = await db
    .select()
    .from(pendingRegistrations)
    .where(eq(pendingRegistrations.email, email));
  
  if (pending) {
    console.log('Verification code:', pending.verificationCode);
    console.log('Expires at:', pending.codeExpiresAt);
  } else {
    console.log('No pending registration found');
  }
}

getVerificationCode();
