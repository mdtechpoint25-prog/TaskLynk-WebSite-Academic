import { db } from '@/db';
import { freelancerProfiles, clientProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 📝 FIX #21: Incomplete Profile Tracking
 * Calculate and update profile completion status
 */

export async function updateFreelancerProfileCompletion(userId: number) {
  try {
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return false;
    }

    // Define required fields for a complete profile
    const isComplete = !!(
      profile.bio &&
      profile.bio.trim().length >= 50 && // Minimum bio length
      profile.skills &&
      JSON.parse(profile.skills as string).length > 0 &&
      profile.availability &&
      profile.hourlyRate &&
      profile.hourlyRate > 0
    );

    // Update profile completion status
    await db
      .update(freelancerProfiles)
      .set({
        isProfileComplete: isComplete,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(freelancerProfiles.userId, userId));

    return isComplete;
  } catch (error) {
    console.error('Error updating freelancer profile completion:', error);
    return false;
  }
}

export async function updateClientProfileCompletion(userId: number) {
  try {
    const [profile] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return false;
    }

    // Define required fields for a complete client profile
    const isComplete = !!(
      profile.companyName &&
      profile.companyName.trim().length > 0 &&
      profile.industry &&
      profile.billingAddress &&
      JSON.parse(profile.billingAddress as string).city &&
      profile.preferredPaymentMethod
    );

    // Update profile completion status
    await db
      .update(clientProfiles)
      .set({
        isProfileComplete: isComplete,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clientProfiles.userId, userId));

    return isComplete;
  } catch (error) {
    console.error('Error updating client profile completion:', error);
    return false;
  }
}

export async function checkProfileCompletion(
  userId: number,
  userType: 'freelancer' | 'client'
): Promise<boolean> {
  if (userType === 'freelancer') {
    return updateFreelancerProfileCompletion(userId);
  } else {
    return updateClientProfileCompletion(userId);
  }
}
