/**
 * Maps order status based on user role
 * 
 * Status Mapping Table:
 * | Status     | Admin      | Manager    | Client     | Writer (Freelancer) |
 * |------------|------------|------------|------------|---------------------|
 * | delivered  | Delivered  | Delivered  | Delivered  | Delivered           |
 * | accepted   | Accepted   | Accepted   | In Progress| Available           |
 * | approved   | Approved   | Approved   | Approved   | Approved            |
 * | paid       | Paid       | Paid       | Paid       | Paid                |
 * | revision   | Revision   | Revision   | Revision   | Revision            |
 * | assigned   | Assigned   | Assigned   | In Progress| In Progress         |
 * | editing    | Editing    | Editing    | Editing    | Editing             |
 * | completed  | Completed  | Completed  | Completed  | Completed           |
 * | cancelled  | Cancelled  | Cancelled  | Cancelled  | Cancelled           |
 * | pending    | Pending    | Pending    | Pending    | Pending             |
 * | in_progress| In Progress| In Progress| In Progress| In Progress         |
 * | on_hold    | On Hold    | On Hold    | On Hold    | On Hold             |
 */

export type UserRole = 'admin' | 'manager' | 'client' | 'freelancer';
export type OrderStatus = 'delivered' | 'accepted' | 'approved' | 'paid' | 'revision' | 'assigned' | 'editing' | 'completed' | 'cancelled' | 'pending' | 'in_progress' | 'on_hold';

export function mapStatusForRole(status: string, role: UserRole): string {
  const normalizedStatus = status.toLowerCase().replace(/[-_\s]/g, '_');
  
  // Writer (Freelancer) specific mappings
  if (role === 'freelancer') {
    if (normalizedStatus === 'accepted') return 'Available';
    if (normalizedStatus === 'assigned' || normalizedStatus === 'in_progress') return 'In Progress';
  }
  
  // Client specific mapping: show accepted/assigned as In Progress
  if (role === 'client') {
    if (normalizedStatus === 'accepted' || normalizedStatus === 'assigned') return 'In Progress';
  }
  
  // Standard mappings for all roles (including admin, manager, client)
  const statusMap: Record<string, string> = {
    'delivered': 'Delivered',
    'accepted': 'Accepted',
    'approved': 'Approved',
    'paid': 'Paid',
    'revision': 'Revision',
    'assigned': 'Assigned',
    'in_progress': 'In Progress',
    'editing': 'Editing',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'pending': 'Pending',
    'on_hold': 'On Hold'
  };
  
  return statusMap[normalizedStatus] || status;
}

/**
 * Get badge variant based on status
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalizedStatus = status.toLowerCase().replace(/[-_\s]/g, '_');
  
  switch (normalizedStatus) {
    case 'completed':
    case 'delivered':
    case 'paid':
      return 'default';
    case 'in_progress':
    case 'assigned':
    case 'editing':
    case 'accepted':
    case 'approved':
      return 'secondary';
    case 'cancelled':
    case 'revision':
      return 'destructive';
    case 'on_hold':
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Get status color class based on status
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/[-_\s]/g, '_');
  
  switch (normalizedStatus) {
    case 'completed':
      return 'text-green-600';
    case 'delivered':
      return 'text-blue-600';
    case 'paid':
      return 'text-emerald-600';
    case 'in_progress':
    case 'assigned':
      return 'text-orange-600';
    case 'editing':
      return 'text-purple-600';
    case 'accepted':
    case 'approved':
      return 'text-cyan-600';
    case 'cancelled':
      return 'text-red-600';
    case 'revision':
      return 'text-yellow-600';
    case 'pending':
      return 'text-gray-600';
    case 'on_hold':
      return 'text-amber-600';
    default:
      return 'text-muted-foreground';
  }
}