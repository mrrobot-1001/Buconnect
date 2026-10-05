import { prisma } from '@/lib/prisma';

// A connection is mutual: an accepted request is stored as Connection rows in
// both directions, so followers/following lists and counts match for both
// people. Keep all writes to Connection in this module.

const pairWhere = (a: string, b: string) => ({
  OR: [
    { followerId: a, followingId: b },
    { followerId: b, followingId: a },
  ],
});

export async function areConnected(a: string, b: string) {
  const row = await prisma.connection.findFirst({ where: pairWhere(a, b), select: { id: true } });
  return !!row;
}

// Marks the request accepted and creates both Connection rows atomically.
export async function acceptRequest(requestId: string, followerId: string, followingId: string) {
  return prisma.$transaction([
    prisma.connectionRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
    prisma.connection.createMany({
      data: [
        { followerId, followingId },
        { followerId: followingId, followingId: followerId },
      ],
      skipDuplicates: true,
    }),
  ]);
}

// Removes the connection and any request between the two users, either direction.
export async function disconnect(a: string, b: string) {
  const [, requests] = await prisma.$transaction([
    prisma.connection.deleteMany({ where: pairWhere(a, b) }),
    prisma.connectionRequest.deleteMany({ where: pairWhere(a, b) }),
  ]);
  return requests.count > 0;
}
