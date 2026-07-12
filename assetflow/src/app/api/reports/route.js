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

    // Parallel aggregate queries for speed
    const [
      totalAssets,
      assetsByStatus,
      assetsByCategoryRaw,
      recentMaintenance,
      activeBookingsCount
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        _count: { _all: true }
      }),
      prisma.maintenanceRequest.count({
        where: { status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] } }
      }),
      prisma.booking.count({
        where: { status: { in: ['UPCOMING', 'ONGOING'] } }
      })
    ]);

    // We need category names for the category breakdown
    const categories = await prisma.assetCategory.findMany();
    const assetsByCategory = assetsByCategoryRaw.map(group => ({
      category: categories.find(c => c.id === group.categoryId)?.name || 'Unknown',
      count: group._count._all
    }));

    // Format status breakdown
    const statusBreakdown = assetsByStatus.map(s => ({
      name: s.status,
      count: s._count._all
    }));

    return NextResponse.json({
      totalAssets,
      statusBreakdown,
      assetsByCategory,
      activeMaintenance: recentMaintenance,
      activeBookings: activeBookingsCount
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
