import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body; // APPROVED or REJECTED

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const transferRequest = await prisma.transferRequest.findUnique({
      where: { id },
      include: { fromUser: true, asset: true }
    });

    if (!transferRequest) {
      return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
    }

    // Role Check: ADMIN and ASSET_MANAGER can approve ANY transfer
    // DEPT_HEAD can approve transfers within their department
    let hasAccess = false;
    if (['ADMIN', 'ASSET_MANAGER'].includes(payload.role)) {
      hasAccess = true;
    } else if (payload.role === 'DEPT_HEAD') {
      // Check if the user requesting the transfer is in their department
      const approver = await prisma.user.findUnique({ where: { id: payload.id } });
      if (approver && approver.departmentId === transferRequest.fromUser.departmentId) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Missing permissions' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status
      const updatedTransfer = await tx.transferRequest.update({
        where: { id },
        data: { status }
      });

      // If approved, update the allocation
      if (status === 'APPROVED') {
        // End current allocation
        await tx.allocation.updateMany({
          where: { assetId: transferRequest.assetId, status: 'ACTIVE' },
          data: { status: 'RETURNED' }
        });

        // Create new allocation
        await tx.allocation.create({
          data: {
            assetId: transferRequest.assetId,
            assignedToId: transferRequest.toId,
            status: 'ACTIVE'
          }
        });
      }

      await tx.activityLog.create({
        data: {
          userId: payload.id,
          action: 'TRANSFER_PROCESSED',
          target: transferRequest.assetId,
          details: `Transfer request ${status} for asset ${transferRequest.asset.tag}`
        }
      });

      return updatedTransfer;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating transfer request:', error);
    return NextResponse.json({ error: 'Failed to update transfer request' }, { status: 500 });
  }
}
