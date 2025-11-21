import { NextRequest, NextResponse } from 'next/server';
import { scheduleEmailLogCleanup } from '@/lib/email-log-cleanup';

/**
 * 📧 FIX #27: Email Log Cleanup Cron Endpoint
 * Automated cleanup of old email logs (30+ days)
 */

export async function GET(request: NextRequest) {
  try {
    const result = await scheduleEmailLogCleanup();

    return NextResponse.json({
      success: true,
      message: 'Email log cleanup completed',
      ...result,
    });
  } catch (error: any) {
    console.error('Email log cleanup cron error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup email logs' },
      { status: 500 }
    );
  }
}
