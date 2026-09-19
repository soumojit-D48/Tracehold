-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TENANT', 'CONTRACTOR', 'LANDLORD', 'ADMIN');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('WATER_DAMAGE', 'PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED', 'EVIDENCE_READY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "TicketSeverity" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "relatedTickets" TEXT[],
    "noticeDraft" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelMetadata" JSONB,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_unitNumber_key" ON "Unit"("propertyId", "unitNumber");

-- CreateIndex
CREATE INDEX "Ticket_unitId_idx" ON "Ticket"("unitId");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "TicketEvent_ticketId_createdAt_idx" ON "TicketEvent"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_ticketId_idx" ON "Evidence"("ticketId");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
