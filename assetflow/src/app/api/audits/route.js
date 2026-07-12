import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        items: {
          include: { asset: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}

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
    const { name, scope, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Audit Cycle
      const cycle = await tx.auditCycle.create({
        data: {
          name,
          scope,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: 'OPEN'
        }
      });

      // 2. Fetch all assets (In a real app, we'd filter by the `scope` / department)
      const assets = await tx.asset.findMany({
        where: { status: { not: 'DISPOSED' } } // Don't audit disposed assets
      });

      // 3. Create AuditItems for each asset to be verified during this cycle
      if (assets.length > 0) {
        await tx.auditItem.createMany({
          data: assets.map(asset => ({
            auditCycleId: cycle.id,
            assetId: asset.id,
            status: 'VERIFIED', // Default assumption until auditor marks missing
            auditorId: payload.id // For MVP, assigning the creator as auditor
          }))
        });
      }

      await tx.activityLog.create({
        data: {
          userId: payload.id,
          action: 'AUDIT_CYCLE_CREATED',
          target: cycle.id,
          details: `Created audit cycle ${name} covering ${assets.length} assets`
        }
      });

      return cycle;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating audit cycle:', error);
    return NextResponse.json({ error: 'Failed to create audit cycle' }, { status: 500 });
  }
}
