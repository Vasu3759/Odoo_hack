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
    
    // Only Admin can delete
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if there are employees in this department
    const employeeCount = await prisma.user.count({
      where: { departmentId: id }
    });

    if (employeeCount > 0) {
      return NextResponse.json({ error: 'Cannot delete: There are employees assigned to this department.' }, { status: 409 });
    }

    // Check if there are allocations to this department
    const allocationCount = await prisma.allocation.count({
      where: { assignedDeptId: id, status: 'ACTIVE' }
    });

    if (allocationCount > 0) {
      return NextResponse.json({ error: 'Cannot delete: There are active assets allocated to this department.' }, { status: 409 });
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
