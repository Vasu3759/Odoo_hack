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

    // Check if there are assets in this category
    const assetCount = await prisma.asset.count({
      where: { categoryId: id }
    });

    if (assetCount > 0) {
      return NextResponse.json({ error: 'Cannot delete: There are assets assigned to this category.' }, { status: 409 });
    }

    await prisma.assetCategory.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
