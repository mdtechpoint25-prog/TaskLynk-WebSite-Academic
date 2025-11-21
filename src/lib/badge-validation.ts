import { db } from '@/db';
import { users, badges, userBadges } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 🏅 FIX #24: Missing User Tier/Badge Validation
 * Validate that returned badges are legitimately earned
 */

export async function getUserWithValidatedBadges(userId: number) {
  try {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Get user's badges
    const userBadgesList = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    // Validate each badge
    const validatedBadges = [];

    for (const ub of userBadgesList) {
      try {
        const [badge] = await db
          .select()
          .from(badges)
          .where(eq(badges.id, ub.badgeId))
          .limit(1);

        if (!badge) {
          continue; // Badge no longer exists
        }

        // Parse criteria
        const criteria = JSON.parse(badge.criteria as string);

        // Check if user still meets criteria
        const meetsRating =
          !criteria.minRating ||
          (user.ratingAverage && user.ratingAverage >= criteria.minRating);

        const meetsJobs =
          !criteria.minJobs || user.completedJobs >= criteria.minJobs;

        const meetsEarnings =
          !criteria.minEarnings ||
          (user.totalEarned && user.totalEarned >= criteria.minEarnings);

        // Only include badge if all criteria are still met
        if (meetsRating && meetsJobs && meetsEarnings) {
          validatedBadges.push({
            ...ub,
            badge: {
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              color: badge.color,
              category: badge.category,
            },
          });
        } else {
          // Badge criteria no longer met - optionally revoke
          console.warn(
            `User ${userId} no longer meets criteria for badge ${badge.name}`
          );
        }
      } catch (badgeError) {
        console.error('Error validating badge:', badgeError);
      }
    }

    return {
      ...user,
      badges: validatedBadges,
    };
  } catch (error) {
    console.error('Error getting user with validated badges:', error);
    return null;
  }
}

/**
 * Revoke badges that user no longer qualifies for
 */
export async function revokeLostBadges(userId: number): Promise<number> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return 0;
    }

    const userBadgesList = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    let revokedCount = 0;

    for (const ub of userBadgesList) {
      try {
        const [badge] = await db
          .select()
          .from(badges)
          .where(eq(badges.id, ub.badgeId))
          .limit(1);

        if (!badge) continue;

        const criteria = JSON.parse(badge.criteria as string);

        const meetsRating =
          !criteria.minRating ||
          (user.ratingAverage && user.ratingAverage >= criteria.minRating);

        const meetsJobs =
          !criteria.minJobs || user.completedJobs >= criteria.minJobs;

        const meetsEarnings =
          !criteria.minEarnings ||
          (user.totalEarned && user.totalEarned >= criteria.minEarnings);

        // Revoke if criteria not met
        if (!meetsRating || !meetsJobs || !meetsEarnings) {
          await db.delete(userBadges).where(eq(userBadges.id, ub.id));
          revokedCount++;
        }
      } catch (error) {
        console.error('Error checking badge criteria:', error);
      }
    }

    return revokedCount;
  } catch (error) {
    console.error('Error revoking lost badges:', error);
    return 0;
  }
}
