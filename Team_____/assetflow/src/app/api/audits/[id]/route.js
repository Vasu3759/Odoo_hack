import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// Close Audit Cycle
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'ASSET_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden: Missing permissions' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark cycle closed
      const cycle = await tx.auditCycle.update({
        where: { id },
        data: { status: 'CLOSED' },
        include: { items: true }
      });

      // 2. Propagate discrepancies to actual Asset status
      // If an auditor marked it MISSING, change asset to LOST.
      // If marked DAMAGED, maybe it needs UNDER_MAINTENANCE, but let's just log it or flag it.
      for (const item of cycle.items) {
        if (item.status === 'MISSING') {
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: 'LOST' } // Automatically flag as lost
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId: payload.id,
          action: 'AUDIT_CYCLE_CLOSED',
          target: id,
          details: `Closed audit cycle ${cycle.name}`
        }
      });

      return cycle;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error closing audit cycle:', error);
    return NextResponse.json({ error: 'Failed to close audit cycle' }, { status: 500 });
  }
}
