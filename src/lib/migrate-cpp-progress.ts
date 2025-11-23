/**
 * Migration Helper: Initialize CPP Progress for Existing Freelancers
 * 
 * This script should be run once to populate the freelancerCPPProgress table
 * with initial records for all existing freelancers.
 * 
 * Usage:
 *   1. Run this manually in database tools, OR
 *   2. Create an admin endpoint that calls this, OR
 *   3. Run as a Drizzle migration script
 */

import { db } from '@/db';
import { users, freelancerCPPProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function initializeCPPProgressForAllFreelancers() {
  try {
    console.log('Starting CPP Progress Initialization...');

    // Get all freelancers
    const freelancers = await db
      .select({
        id: users.id,
        name: users.name,
        completedJobs: users.completedJobs,
      })
      .from(users)
      .where(eq(users.role, 'freelancer'));

    console.log(`Found ${freelancers.length} freelancers to process`);

    let created = 0;
    let skipped = 0;

    for (const freelancer of freelancers) {
      // Check if already initialized
      const existing = await db
        .select()
        .from(freelancerCPPProgress)
        .where(eq(freelancerCPPProgress.freelancerId, freelancer.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Skipped ${freelancer.name} (already initialized)`);
        skipped++;
        continue;
      }

      // Initialize CPP progress
      const now = new Date().toISOString();
      const completedOrders = freelancer.completedJobs || 0;

      // Calculate level based on completed orders
      let currentLevel = 1;
      let ordersInCurrentLevel = 0;
      let nextLevelOrdersRequired = 3;

      if (completedOrders >= 50) {
        currentLevel = 5;
        ordersInCurrentLevel = completedOrders - 50;
        nextLevelOrdersRequired = 0;
      } else if (completedOrders >= 23) {
        currentLevel = 4;
        ordersInCurrentLevel = completedOrders - 23;
        nextLevelOrdersRequired = 50 - completedOrders;
      } else if (completedOrders >= 8) {
        currentLevel = 3;
        ordersInCurrentLevel = completedOrders - 8;
        nextLevelOrdersRequired = 23 - completedOrders;
      } else if (completedOrders >= 3) {
        currentLevel = 2;
        ordersInCurrentLevel = completedOrders - 3;
        nextLevelOrdersRequired = 8 - completedOrders;
      } else {
        currentLevel = 1;
        ordersInCurrentLevel = completedOrders;
        nextLevelOrdersRequired = 3 - completedOrders;
      }

      // Calculate progress percentage
      const levels = [3, 5, 15, 27, Infinity];
      const previousMilestone = currentLevel === 1 ? 0 : levels[currentLevel - 2];
      const currentMilestone = levels[currentLevel - 1];
      const totalInLevel = currentMilestone === Infinity ? ordersInCurrentLevel : currentMilestone - previousMilestone;
      const progressPercentage = totalInLevel === 0 ? 0 : (ordersInCurrentLevel / totalInLevel) * 100;

      await db.insert(freelancerCPPProgress).values({
        freelancerId: freelancer.id,
        currentLevel: currentLevel,
        totalCompletedOrders: completedOrders,
        ordersInCurrentLevel: ordersInCurrentLevel,
        progressPercentage: Math.min(progressPercentage, 100),
        nextLevelOrdersRequired: Math.max(0, nextLevelOrdersRequired),
        isWorkTypeSpecialized: false, // Default to non-specialized; can be updated based on order types
        lastProgressUpdate: now,
        createdAt: now,
        updatedAt: now,
      });

      console.log(
        `✅ Initialized ${freelancer.name} (${completedOrders} orders, Level ${currentLevel})`
      );
      created++;
    }

    console.log(`\n✨ Migration Complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${freelancers.length}`);

    return {
      success: true,
      created,
      skipped,
      total: freelancers.length,
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Initialize CPP Progress for a single freelancer
 */
export async function initializeSingleFreelancerCPP(freelancerId: number) {
  try {
    const freelancer = await db
      .select()
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1);

    if (!freelancer || freelancer.length === 0) {
      throw new Error(`Freelancer ${freelancerId} not found`);
    }

    const existing = await db
      .select()
      .from(freelancerCPPProgress)
      .where(eq(freelancerCPPProgress.freelancerId, freelancerId))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        message: 'CPP Progress already initialized',
      };
    }

    const now = new Date().toISOString();
    const completedOrders = freelancer[0].completedJobs || 0;

    const result = await db
      .insert(freelancerCPPProgress)
      .values({
        freelancerId: freelancerId,
        currentLevel: 1,
        totalCompletedOrders: completedOrders,
        ordersInCurrentLevel: 0,
        progressPercentage: 0,
        nextLevelOrdersRequired: 3,
        isWorkTypeSpecialized: false,
        lastProgressUpdate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      success: true,
      message: 'CPP Progress initialized',
      data: result[0],
    };
  } catch (error) {
    console.error('Error initializing CPP progress:', error);
    throw error;
  }
}

// If this is run as a standalone script
if (require.main === module) {
  initializeCPPProgressForAllFreelancers()
    .then((result) => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
