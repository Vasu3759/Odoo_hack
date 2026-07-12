import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    // Prevent deleting yourself
    if (id === payload.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    const user = await prisma.user.delete({
      where: { id }
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.id,
        action: 'EMPLOYEE_DELETED',
        target: id,
        details: `Deleted user account for ${user.name} (${user.email})`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    // Prisma throws P2003 if there are foreign key constraints (e.g. they own an asset or have a booking)
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete user because they are linked to active assets or bookings' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
