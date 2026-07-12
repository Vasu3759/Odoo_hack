import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'ASSET_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden: Missing permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { assetId, assignedToId, expectedReturnDate } = body;

    if (!assetId || !assignedToId) {
      return NextResponse.json({ error: 'Missing assetId or assignedToId' }, { status: 400 });
    }

    // Wrap in a transaction to enforce conflict rules
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if asset is AVAILABLE
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error('Asset not found');

      if (asset.status !== 'AVAILABLE') {
        // If it's allocated, we throw a specific error so the frontend can offer a Transfer Request
        const currentAllocation = await tx.allocation.findFirst({
          where: { assetId, status: 'ACTIVE' },
          include: { assignedTo: true }
        });
        
        throw new Error(
          currentAllocation 
            ? `Asset is currently held by ${currentAllocation.assignedTo?.name || 'someone else'}. Request transfer instead?`
            : `Asset is not available (Current status: ${asset.status})`
        );
      }

      // 2. Create Allocation
      const allocation = await tx.allocation.create({
        data: {
          assetId,
          assignedToId,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          status: 'ACTIVE'
        }
      });

      // 3. Update Asset Status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'ALLOCATED' }
      });

      // 4. Log Activity
      await tx.activityLog.create({
        data: {
          userId: payload.id, // The manager who did the allocation
          action: 'ASSET_ALLOCATED',
          target: assetId,
          details: `Allocated to user ${assignedToId}`
        }
      });

      return allocation;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error allocating asset:', error);
    // If it's our custom conflict error, return 409 Conflict
    if (error.message.includes('currently held') || error.message.includes('not available')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to allocate asset' }, { status: 500 });
  }
}
