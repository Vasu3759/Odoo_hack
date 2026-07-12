import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { itemId } = await params;
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['ADMIN', 'ASSET_MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden: Missing permissions' }, { status: 403 });
    }

    const { status, notes } = await request.json();

    const item = await prisma.auditItem.update({
      where: { id: itemId },
      data: { status, notes, auditorId: payload.id }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating audit item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}
