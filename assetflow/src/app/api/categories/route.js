import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing category name' }, { status: 400 });

    const category = await prisma.assetCategory.create({
      data: { name }
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.id,
        action: 'CATEGORY_CREATED',
        target: category.id,
        details: `Created asset category: ${name}`
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002') return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
