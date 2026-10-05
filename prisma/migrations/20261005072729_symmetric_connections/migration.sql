-- Connections are mutual. Normalise existing data so every connected pair has
-- Connection rows in both directions and an ACCEPTED request.

-- 1. Accepted requests that never produced Connection rows
INSERT INTO "Connection" ("id", "followerId", "followingId", "createdAt")
SELECT gen_random_uuid()::text, r."followerId", r."followingId", r."updatedAt"
FROM "ConnectionRequest" r
WHERE r."status" = 'ACCEPTED'
ON CONFLICT ("followerId", "followingId") DO NOTHING;

-- 2. Reverse row for every one-way connection
INSERT INTO "Connection" ("id", "followerId", "followingId", "createdAt")
SELECT gen_random_uuid()::text, c."followingId", c."followerId", c."createdAt"
FROM "Connection" c
ON CONFLICT ("followerId", "followingId") DO NOTHING;

-- 3. A pending/rejected request between two connected people is settled
UPDATE "ConnectionRequest" r
SET "status" = 'ACCEPTED', "updatedAt" = NOW()
WHERE r."status" <> 'ACCEPTED'
  AND EXISTS (
    SELECT 1 FROM "Connection" c
    WHERE c."followerId" = r."followerId" AND c."followingId" = r."followingId"
  );

-- 4. Connected pairs with no request at all get an ACCEPTED one (one per pair)
INSERT INTO "ConnectionRequest" ("id", "followerId", "followingId", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, c."followerId", c."followingId", 'ACCEPTED', c."createdAt", NOW()
FROM "Connection" c
WHERE c."followerId" < c."followingId"
  AND NOT EXISTS (
    SELECT 1 FROM "ConnectionRequest" r
    WHERE (r."followerId" = c."followerId" AND r."followingId" = c."followingId")
       OR (r."followerId" = c."followingId" AND r."followingId" = c."followerId")
  );

-- 5. Two requests for the same pair (crossed): keep one, drop the duplicate
DELETE FROM "ConnectionRequest" r
USING "ConnectionRequest" o
WHERE r."followerId" = o."followingId"
  AND r."followingId" = o."followerId"
  AND r."status" = 'ACCEPTED' AND o."status" = 'ACCEPTED'
  AND r."followerId" > r."followingId";
