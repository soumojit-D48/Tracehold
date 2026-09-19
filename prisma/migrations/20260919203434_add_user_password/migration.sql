ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

UPDATE "User"
SET "passwordHash" = '$2b$12$R6DaNpNBkFToBjtfGMOXOuCzdLcYvtvRE4XWfKXhmz7a47vC/QHv2'
WHERE "passwordHash" IS NULL;

ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
