import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Admin Authentication Helper
 * Validates admin role for secure API endpoints
 */

export interface AuthResult {
  success?: boolean;
  error?: string;
  status?: number;
  user?: any;
}

/**
 * Extract bearer token from request headers
 */
function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Validate session token and get user
 */
async function validateToken(token: string): Promise<any | null> {
  try {
    // Query user by token (assuming token is stored in users table or sessions table)
    // For now, we'll treat the token as a user ID for simplicity
    // In production, you should validate against a sessions table
    
    const userId = parseInt(token);
    if (isNaN(userId)) {
      return null;
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Require admin role for API endpoint
 * Returns error object if unauthorized, or success with user object
 * 
 * CRITICAL: Admin accounts do NOT need approval checks - they are auto-approved
 */
export async function requireAdminRole(request: Request): Promise<AuthResult> {
  // Extract token
  const token = extractToken(request);
  
  if (!token) {
    return {
      error: 'Unauthorized: Authentication token required',
      status: 401
    };
  }
  
  // Validate token and get user
  const user = await validateToken(token);
  
  if (!user) {
    return {
      error: 'Unauthorized: Invalid authentication token',
      status: 401
    };
  }
  
  // Check if user is admin
  if (user.role !== 'admin') {
    return {
      error: 'Forbidden: Admin role required',
      status: 403
    };
  }
  
  // 🔴 CRITICAL FIX: Admin accounts do NOT need approval checks
  // Admins are auto-approved and should always have access
  // Only check suspension status for admins
  
  if (user.status === 'suspended') {
    return {
      error: 'Forbidden: Admin account is suspended',
      status: 403
    };
  }
  
  if (user.status === 'blacklisted') {
    return {
      error: 'Forbidden: Admin account is blacklisted',
      status: 403
    };
  }
  
  // All checks passed
  return {
    success: true,
    user
  };
}

/**
 * Require specific role for API endpoint
 * Useful for endpoints that allow multiple roles (e.g., admin or manager)
 */
export async function requireRole(request: Request, allowedRoles: string[]): Promise<AuthResult> {
  const token = extractToken(request);
  
  if (!token) {
    return {
      error: 'Unauthorized: Authentication token required',
      status: 401
    };
  }
  
  const user = await validateToken(token);
  
  if (!user) {
    return {
      error: 'Unauthorized: Invalid authentication token',
      status: 401
    };
  }
  
  if (!allowedRoles.includes(user.role)) {
    return {
      error: `Forbidden: One of these roles required: ${allowedRoles.join(', ')}`,
      status: 403
    };
  }
  
  // 🔴 CRITICAL FIX: Admins do NOT need approval checks
  if (user.role !== 'admin') {
    if (!user.approved) {
      return {
        error: 'Forbidden: Account not approved',
        status: 403
      };
    }
  }
  
  if (user.status === 'suspended') {
    return {
      error: 'Forbidden: Account is suspended',
      status: 403
    };
  }
  
  if (user.status === 'blacklisted') {
    return {
      error: 'Forbidden: Account is blacklisted',
      status: 403
    };
  }
  
  return {
    success: true,
    user
  };
}

/**
 * Extract user ID from request (for authenticated endpoints)
 * Returns null if not authenticated
 */
export async function getUserFromRequest(request: Request): Promise<any | null> {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }
  
  return await validateToken(token);
}