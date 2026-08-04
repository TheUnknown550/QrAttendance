import bcrypt from "bcryptjs";
import { OrganizationRole, Prisma, PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function createQrToken() {
  return randomBytes(24).toString("hex");
}

function createJoinCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function createInviteToken() {
  return randomBytes(24).toString("hex");
}

function getOptionalSeedUser() {
  const name = process.env.SEED_USER_NAME?.trim();
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD?.trim();

  if (!name || !email || !password) {
    return null;
  }

  return {
    name,
    email,
    password,
  };
}

async function main() {
  await prisma.attendanceRecord.deleteMany();
  await prisma.eventSession.deleteMany();
  await prisma.eventSeries.deleteMany();
  await prisma.organizationInvite.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: "OpenAI Learning Hub",
      joinCode: createJoinCode(),
    },
  });

  const secondOrganization = await prisma.organization.create({
    data: {
      name: "Frontend Guild",
      joinCode: createJoinCode(),
    },
  });

  const seedUser = getOptionalSeedUser();

  if (seedUser) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);

    const seededUser = await prisma.user.create({
      data: {
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
      },
    });

    await prisma.organizationMembership.createMany({
      data: [
        {
          userId: seededUser.id,
          organizationId: organization.id,
          role: OrganizationRole.OWNER,
        },
        {
          userId: seededUser.id,
          organizationId: secondOrganization.id,
          role: OrganizationRole.ADMIN,
        },
      ],
    });

    await prisma.organizationInvite.create({
      data: {
        organizationId: organization.id,
        createdByUserId: seededUser.id,
        token: createInviteToken(),
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      },
    });
  }

  const series = await prisma.eventSeries.create({
    data: {
      organizationId: organization.id,
      name: "AI Workshop Series",
      description: "Recurring workshop program for internal training.",
      startDate: new Date("2026-05-01T09:00:00.000Z"),
      endDate: new Date("2026-05-29T09:00:00.000Z"),
    },
  });

  const sessions = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      prisma.eventSession.create({
        data: {
          eventSeriesId: series.id,
          title: `Session ${index + 1}`,
          description: `Hands-on workshop session ${index + 1}.`,
          sessionDate: new Date(`2026-05-${String(index * 7 + 1).padStart(2, "0")}T09:00:00.000Z`),
        },
      }),
    ),
  );

  const attendeeSeeds = [
    ["Ava Johnson", "ava.johnson@example.com"],
    ["Liam Carter", "liam.carter@example.com"],
    ["Mia Thompson", "mia.thompson@example.com"],
    ["Noah Patel", "noah.patel@example.com"],
    ["Emma Nguyen", "emma.nguyen@example.com"],
    ["Lucas Kim", "lucas.kim@example.com"],
    ["Sophia Rivera", "sophia.rivera@example.com"],
    ["Ethan Brooks", "ethan.brooks@example.com"],
    ["Olivia Perez", "olivia.perez@example.com"],
    ["James Morris", "james.morris@example.com"],
  ];

  const attendees = await Promise.all(
    attendeeSeeds.map(([name, email], index) =>
      prisma.attendee.create({
        data: {
          organizationId: organization.id,
          name,
          email,
          phone: `555-010${index}`,
          profileImageUrl: `https://i.pravatar.cc/300?img=${index + 10}`,
          qrToken: createQrToken(),
        },
      }),
    ),
  );

  const attendanceRows: Prisma.AttendanceRecordCreateManyInput[] = [];

  attendees.forEach((attendee, attendeeIndex) => {
    sessions.forEach((session, sessionIndex) => {
      if ((attendeeIndex + sessionIndex) % 3 !== 0) {
        attendanceRows.push({
          attendeeId: attendee.id,
          eventSessionId: session.id,
          checkedInAt: new Date(session.sessionDate),
        });
      }
    });
  });

  await prisma.attendanceRecord.createMany({
    data: attendanceRows,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
