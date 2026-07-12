import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    const where = {};
    if (assetId) {
      where.assetId = assetId;
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: true,
        requestedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { assetId, description, priority } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const requestedById = payload.id;

    if (!assetId || !requestedById || !description || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        requestedById,
        description,
        priority,
        status: 'PENDING'
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: requestedById,
        action: 'RAISED_MAINTENANCE',
        target: assetId,
        details: `Raised ${priority} priority request`
      }
    });

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status } = body; 

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const approverId = payload.id;

    if (!['ADMIN', 'ASSET_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden: Missing permissions' }, { status: 403 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Wrap in transaction if we need to update asset state concurrently
    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: { status }
      });

      // Business logic: if approved, asset goes UNDER_MAINTENANCE
      if (status === 'APPROVED' || status === 'IN_PROGRESS') {
        await tx.asset.update({
          where: { id: updatedRequest.assetId },
          data: { status: 'UNDER_MAINTENANCE' }
        });
      }
      
      // If resolved, asset goes back to AVAILABLE (assuming it isn't allocated, simplifying for MVP)
      if (status === 'RESOLVED') {
        // Find if there's an active allocation to decide what to return to
        const activeAllocation = await tx.allocation.findFirst({
          where: { assetId: updatedRequest.assetId, status: 'ACTIVE' }
        });
        
        await tx.asset.update({
          where: { id: updatedRequest.assetId },
          data: { status: activeAllocation ? 'ALLOCATED' : 'AVAILABLE' }
        });
      }

      await tx.activityLog.create({
        data: {
          userId: approverId || null,
          action: `MAINTENANCE_STATUS_UPDATED`,
          target: updatedRequest.assetId,
          details: `Maintenance request changed to ${status}`
        }
      });

      return updatedRequest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
