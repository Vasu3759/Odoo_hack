import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let where = {};
    
    // RBAC logic for viewing assets
    if (payload.role === 'EMPLOYEE') {
      where = {
        OR: [
          { allocations: { some: { assignedToId: payload.id, status: 'ACTIVE' } } },
          { isShared: true }
        ]
      };
    } else if (payload.role === 'DEPT_HEAD') {
      // Need user's department
      const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { departmentId: true } });
      if (user && user.departmentId) {
        where = {
          OR: [
            {
              allocations: {
                some: {
                  OR: [
                    { assignedDeptId: user.departmentId },
                    { assignedTo: { departmentId: user.departmentId } }
                  ],
                  status: 'ACTIVE'
                }
              }
            },
            { isShared: true }
          ]
        };
      } else {
        // No department assigned, can only see their own and shared
        where = {
          OR: [
            { allocations: { some: { assignedToId: payload.id, status: 'ACTIVE' } } },
            { isShared: true }
          ]
        };
      }
    }
    // ASSET_MANAGER and ADMIN see all (where remains {})

    const assets = await prisma.asset.findMany({
      where,
      include: { 
        category: true, 
        allocations: { where: { status: 'ACTIVE' }, include: { assignedTo: true, assignedDept: true } },
        bookings: { where: { status: { in: ['UPCOMING', 'ONGOING'] } } }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { tag, name, categoryId, condition, isShared } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'ASSET_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden: Missing permissions' }, { status: 403 });
    }

    if (!tag || !name || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newAsset = await prisma.asset.create({
      data: {
        tag,
        name,
        categoryId,
        condition: condition || 'New',
        isShared: !!isShared,
        status: 'AVAILABLE'
      },
      include: { category: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.id,
        action: 'REGISTERED_ASSET',
        target: newAsset.id,
        details: `Registered new asset: ${name} (${tag})`
      }
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset tag already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
