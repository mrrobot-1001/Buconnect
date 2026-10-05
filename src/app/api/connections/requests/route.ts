import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || currentUser?.id;

    if (!userId) {
      return NextResponse.json({ incoming: [], outgoing: [] });
    }

    // Get all requests sent TO this user (PENDING for acceptance, ACCEPTED for showing connections)
    const incomingRequests = await prisma.connectionRequest.findMany({
      where: {
        followingId: userId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
            course: true,
            batch: true,
            profession: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all requests sent BY this user (PENDING for tracking, ACCEPTED for showing connections)
    const outgoingRequests = await prisma.connectionRequest.findMany({
      where: {
        followerId: userId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
            course: true,
            batch: true,
            profession: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      incoming: incomingRequests,
      outgoing: outgoingRequests,
    });
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return NextResponse.json({ error: 'Failed to fetch connection requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }

    if (currentUser.id === recipientId) {
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if request already exists
    const existing = await prisma.connectionRequest.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: recipientId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
      }
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Already connected' }, { status: 409 });
      }
      // If rejected, allow sending again
    }

    // Create connection request
    const requestData = await prisma.connectionRequest.create({
      data: {
        followerId: currentUser.id,
        followingId: recipientId,
        status: 'PENDING',
      },
      include: {
        follower: {
          select: { id: true, name: true, profileImage: true },
        },
        following: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${currentUser.name} sent you a connection request`,
        actorId: currentUser.id,
        link: `/connections`,
      },
    });

    return NextResponse.json(requestData);
  } catch (error) {
    console.error('Error creating connection request:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create connection request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { requestId, status }: { requestId: string; status: string } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update request status
    const requestData = await prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if current user is the recipient
    if (requestData.followingId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedRequest = await prisma.connectionRequest.update({
      where: { id: requestId },
      data: { status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' },
      include: {
        follower: {
          select: { id: true, name: true, profileImage: true },
        },
        following: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    // If accepted, create the connection
    if (status === 'ACCEPTED') {
      await prisma.connection.create({
        data: {
          followerId: requestData.followerId,
          followingId: requestData.followingId,
        },
      }).catch((e: any) => {
        // Ignore duplicate errors
        if (e.code !== 'P2002') throw e;
      });

      // Create notification for the requester (follower)
      await prisma.notification.create({
        data: {
          userId: requestData.followerId,
          type: 'connection_accepted',
          title: 'Connection Accepted',
          message: `Your connection request was accepted`,
          actorId: requestData.followingId,
          link: `/profile/${requestData.followingId}`,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating connection request:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update connection request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }

    // Delete the request (works in both directions - sender or recipient can cancel)
    const deleted = await prisma.connectionRequest.deleteMany({
      where: {
        OR: [
          { followerId: currentUser.id, followingId: recipientId },
          { followerId: recipientId, followingId: currentUser.id },
        ],
      },
    });

    return NextResponse.json({ success: true, deleted: deleted.count > 0 });
  } catch (error) {
    console.error('Error deleting connection request:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete connection request' }, { status: 500 });
  }
}