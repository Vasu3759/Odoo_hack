import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

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

    const body = await request.json();
    const { name, condition, isShared } = body;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        condition,
        isShared: !!isShared
      },
      include: { category: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.id,
        action: 'ASSET_UPDATED',
        target: updatedAsset.id,
        details: `Updated asset details for ${updatedAsset.tag}`
      }
    });

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}
