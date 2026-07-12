import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { assetId, fromId, toId, reason } = body;

    if (!assetId || !fromId || !toId) {
      return NextResponse.json({ error: 'Missing required fields for transfer' }, { status: 400 });
    }

    const transferRequest = await prisma.transferRequest.create({
      data: {
        assetId,
        fromId,
        toId,
        reason,
        status: 'PENDING'
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: payload.id,
        action: 'TRANSFER_REQUESTED',
        target: assetId,
        details: `Transfer requested from user ${fromId} to user ${toId}`
      }
    });

    return NextResponse.json(transferRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer request:', error);
    return NextResponse.json({ error: 'Failed to create transfer request' }, { status: 500 });
  }
}
