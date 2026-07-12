import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    // Await params because in Next.js 15+ dynamic route params must be awaited
    const { id } = await params;
    const { role } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Only Admin can assign roles
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, role: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.id,
        action: 'ROLE_UPDATED',
        target: id,
        details: `Assigned role ${role} to user ${user.name}`
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
