import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    const where = {};
    if (assetId) {
      where.assetId = assetId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        asset: true,
        bookedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { assetId, startTime, endTime } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const bookedById = payload.id;

    if (!assetId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }

    // Overlap validation: Two people can't book the same room at overlapping times
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { in: ['UPCOMING', 'ONGOING'] },
        OR: [
          // New booking starts during an existing booking
          {
            startTime: { lt: end },
            endTime: { gt: start }
          }
        ]
      }
    });

    if (overlappingBooking) {
      return NextResponse.json(
        { error: 'Slot is unavailable. It overlaps with an existing booking.' },
        { status: 409 }
      );
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        assetId,
        bookedById,
        startTime: start,
        endTime: end,
        status: 'UPCOMING'
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: bookedById,
        action: 'CREATED_BOOKING',
        target: assetId,
        details: `Booked from ${start.toISOString()} to ${end.toISOString()}`
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
