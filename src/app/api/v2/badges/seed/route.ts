import { NextResponse } from 'next/server';
import { db } from '@/db';
import { badges } from '@/db/schema';

/**
 * POST /api/v2/badges/seed
 * Seed initial badges for the platform
 */
export async function POST() {
  try {
    const now = new Date().toISOString();

    const writerBadges = [
      {
        name: 'Top Performer',
        description: 'Exceptional performance with high ratings',
        icon: '🏆',
        criteria: JSON.stringify({ minRating: 4.8, minJobs: 10 }),
        category: 'writer',
        color: '#FFD700',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Fast Responder',
        description: 'Quick response time and communication',
        icon: '⚡',
        criteria: JSON.stringify({ avgResponseTime: 30, minJobs: 5 }),
        category: 'writer',
        color: '#FFC107',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: '100 Orders Club',
        description: 'Completed 100 successful orders',
        icon: '💯',
        criteria: JSON.stringify({ completedJobs: 100 }),
        category: 'writer',
        color: '#4CAF50',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Zero Revision',
        description: 'Consistently delivers perfect work',
        icon: '✨',
        criteria: JSON.stringify({ revisionRate: 5, minJobs: 20 }),
        category: 'writer',
        color: '#9C27B0',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Deadline Master',
        description: 'Always delivers on time',
        icon: '⏰',
        criteria: JSON.stringify({ onTimeRate: 95, minJobs: 10 }),
        category: 'writer',
        color: '#2196F3',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Client Favorite',
        description: 'High repeat client rate',
        icon: '⭐',
        criteria: JSON.stringify({ repeatClientRate: 50, minJobs: 15 }),
        category: 'writer',
        color: '#FF9800',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Technical Expert',
        description: 'Specialist in technical writing',
        icon: '🔧',
        criteria: JSON.stringify({ specialization: 'technical', rating: 4.5 }),
        category: 'writer',
        color: '#607D8B',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const clientBadges = [
      {
        name: 'Top Client',
        description: 'Valued client with many orders',
        icon: '👑',
        criteria: JSON.stringify({ totalOrders: 20 }),
        category: 'client',
        color: '#FFD700',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Excellent Communicator',
        description: 'Clear instructions and feedback',
        icon: '💬',
        criteria: JSON.stringify({ rating: 4.5, minOrders: 10 }),
        category: 'client',
        color: '#2196F3',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Fair Reviewer',
        description: 'Reasonable revision requests',
        icon: '⭐',
        criteria: JSON.stringify({ lowRevisions: true, minOrders: 15 }),
        category: 'client',
        color: '#4CAF50',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Long-term Partner',
        description: 'Long-standing platform member',
        icon: '🤝',
        criteria: JSON.stringify({ membershipMonths: 6 }),
        category: 'client',
        color: '#9C27B0',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'High Volume Client',
        description: 'Frequently posts orders',
        icon: '📊',
        criteria: JSON.stringify({ totalOrders: 50 }),
        category: 'client',
        color: '#FF5722',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Prompt Payer',
        description: 'Quick payment processing',
        icon: '💳',
        criteria: JSON.stringify({ paymentDelay: 24, minOrders: 10 }),
        category: 'client',
        color: '#00BCD4',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const allBadges = [...writerBadges, ...clientBadges];

    // Insert badges
    await db.insert(badges).values(allBadges);

    return NextResponse.json({
      success: true,
      message: 'Badges seeded successfully',
      count: allBadges.length,
      writerBadges: writerBadges.length,
      clientBadges: clientBadges.length,
    });
  } catch (error: any) {
    console.error('Error seeding badges:', error);
    
    if (error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { message: 'Badges already exist, skipping seed' },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to seed badges' },
      { status: 500 }
    );
  }
}
