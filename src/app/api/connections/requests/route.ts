import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { acceptRequest, disconnect } from '@/lib/connections';

const userSummary = {
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
};

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

async function notifyAccepted(requesterId: string, accepter: { id: string; name: string }) {
  await prisma.notification.create({
    data: {
      userId: requesterId,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${accepter.name} accepted your connection request`,
      actorId: accepter.id,
      link: `/profile/${accepter.id}`,
    },
  });
}

// The signed-in user's own requests. A userId query param is accepted for
// older clients but must be the caller's own id.
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const userId = request.nextUrl.searchParams.get('userId');
    if (userId && userId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [incoming, outgoing] = await Promise.all([
      prisma.connectionRequest.findMany({
        where: { followingId: currentUser.id, status: { in: ['PENDING', 'ACCEPTED'] } },
        include: { follower: userSummary },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.connectionRequest.findMany({
        where: { followerId: currentUser.id, status: { in: ['PENDING', 'ACCEPTED'] } },
        include: { following: userSummary },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ incoming, outgoing });
  } catch (error) {
    return errorResponse(error, 'Failed to fetch connection requests');
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { recipientId } = await request.json();

    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }
    if (currentUser.id === recipientId) {
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
    if (!recipient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [mine, theirs] = await Promise.all([
      prisma.connectionRequest.findUnique({
        where: { followerId_followingId: { followerId: currentUser.id, followingId: recipientId } },
      }),
      prisma.connectionRequest.findUnique({
        where: { followerId_followingId: { followerId: recipientId, followingId: currentUser.id } },
      }),
    ]);

    if (mine?.status === 'ACCEPTED' || theirs?.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Already connected' }, { status: 409 });
    }
    if (mine?.status === 'PENDING') {
      return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
    }

    // They already asked us: requesting back means both want it, so connect now
    if (theirs?.status === 'PENDING') {
      await acceptRequest(theirs.id, recipientId, currentUser.id);
      await notifyAccepted(recipientId, currentUser);
      return NextResponse.json({ ...theirs, status: 'ACCEPTED' });
    }

    // New request, or a fresh try after an earlier rejection
    const requestData = await prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: currentUser.id, followingId: recipientId } },
      create: { followerId: currentUser.id, followingId: recipientId, status: 'PENDING' },
      update: { status: 'PENDING' },
      include: {
        follower: { select: { id: true, name: true, profileImage: true } },
        following: { select: { id: true, name: true, profileImage: true } },
      },
    });

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
    return errorResponse(error, 'Failed to create connection request');
  }
}

// Recipient accepts or rejects a pending request.
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { requestId, status } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const requestData = await prisma.connectionRequest.findUnique({ where: { id: requestId } });
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    if (requestData.followingId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (requestData.status !== 'PENDING') {
      return NextResponse.json({ error: `Request already ${requestData.status.toLowerCase()}` }, { status: 409 });
    }

    if (status === 'ACCEPTED') {
      await acceptRequest(requestId, requestData.followerId, requestData.followingId);
      await notifyAccepted(requestData.followerId, currentUser);
    } else {
      await prisma.connectionRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
    }

    const updated = await prisma.connectionRequest.findUnique({
      where: { id: requestId },
      include: {
        follower: { select: { id: true, name: true, profileImage: true } },
        following: { select: { id: true, name: true, profileImage: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, 'Failed to update connection request');
  }
}

// Withdraw a request or remove a connection (works from either side).
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { recipientId } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }

    const deleted = await disconnect(currentUser.id, recipientId);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return errorResponse(error, 'Failed to delete connection request');
  }
}
