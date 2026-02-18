import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function token() {
  return randomBytes(24).toString("hex");
}

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log("No organization found. Sign in and create a workspace first, then run: npx prisma db seed");
    process.exit(1);
  }

  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found. Sign up first, then run: npx prisma db seed");
    process.exit(1);
  }

  const now = new Date();
  const inTwoDays = new Date(now);
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Events (mix of statuses)
  const event1 = await prisma.event.upsert({
    where: { id: "seed-event-1" },
    update: {
      description: "The premier developer conference bringing together engineers, designers, and product leaders to share insights, showcase breakthroughs, and shape the future of technology.",
      location: { venue: "Moscone Center", address: "747 Howard St", city: "San Francisco", country: "USA" },
      brandingSettings: { primaryColor: "#7c3aed", accentColor: "#4f46e5", badgeTemplate: "default" },
      registrationSettings: {
        approvalRequired: false,
        customFields: [
          { id: "cf-phone", label: "Phone number", type: "tel", required: false, placeholder: "+1 (555) 000-0000" },
          { id: "cf-company", label: "Company", type: "text", required: false, placeholder: "Your company name" },
          { id: "cf-role", label: "Job title", type: "text", required: false, placeholder: "e.g. Software Engineer" },
          { id: "cf-dietary", label: "Dietary requirements", type: "select", required: false, options: ["None", "Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "Other"] },
        ],
      },
    },
    create: {
      id: "seed-event-1",
      tenantId: org.id,
      name: "Tech Conf 2026",
      slug: "tech-conf-2026",
      description: "The premier developer conference bringing together engineers, designers, and product leaders to share insights, showcase breakthroughs, and shape the future of technology.",
      location: { venue: "Moscone Center", address: "747 Howard St", city: "San Francisco", country: "USA" },
      startDate: inTwoDays,
      endDate: inThreeDays,
      timezone: "America/Los_Angeles",
      capacity: 500,
      visibility: "public",
      status: "PUBLISHED",
      brandingSettings: {
        primaryColor: "#7c3aed",
        accentColor: "#4f46e5",
        badgeTemplate: "default",
      },
      registrationSettings: {
        approvalRequired: false,
        customFields: [
          { id: "cf-phone", label: "Phone number", type: "tel", required: false, placeholder: "+1 (555) 000-0000" },
          { id: "cf-company", label: "Company", type: "text", required: false, placeholder: "Your company name" },
          { id: "cf-role", label: "Job title", type: "text", required: false, placeholder: "e.g. Software Engineer" },
          { id: "cf-dietary", label: "Dietary requirements", type: "select", required: false, options: ["None", "Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "Other"] },
        ],
      },
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: "seed-event-2" },
    update: {},
    create: {
      id: "seed-event-2",
      tenantId: org.id,
      name: "Product Launch",
      slug: "product-launch",
      description: "New product reveal and demos.",
      location: { venue: "HQ Auditorium", city: "New York", country: "USA" },
      startDate: nextMonth,
      endDate: nextMonth,
      timezone: "America/New_York",
      capacity: 200,
      visibility: "public",
      status: "DRAFT",
    },
  });

  const event3 = await prisma.event.upsert({
    where: { id: "seed-event-3" },
    update: {},
    create: {
      id: "seed-event-3",
      tenantId: org.id,
      name: "Community Meetup",
      slug: "community-meetup",
      description: "Monthly community meetup.",
      location: { city: "Austin", country: "USA" },
      startDate: lastWeek,
      endDate: lastWeek,
      timezone: "America/Chicago",
      capacity: 80,
      visibility: "unlisted",
      status: "COMPLETED",
    },
  });

  const events = [event1, event2, event3];

  // Sessions for event1 (with descriptions and speakers)
  const day1Morning = new Date(inTwoDays);
  day1Morning.setHours(9, 0, 0, 0);
  const day1MorningEnd = new Date(inTwoDays);
  day1MorningEnd.setHours(10, 30, 0, 0);
  const day1WorkshopStart = new Date(inTwoDays);
  day1WorkshopStart.setHours(11, 0, 0, 0);
  const day1WorkshopEnd = new Date(inTwoDays);
  day1WorkshopEnd.setHours(12, 30, 0, 0);
  const day1PanelStart = new Date(inTwoDays);
  day1PanelStart.setHours(14, 0, 0, 0);
  const day1PanelEnd = new Date(inTwoDays);
  day1PanelEnd.setHours(15, 0, 0, 0);
  const day2Morning = new Date(inThreeDays);
  day2Morning.setHours(10, 0, 0, 0);
  const day2MorningEnd = new Date(inThreeDays);
  day2MorningEnd.setHours(11, 30, 0, 0);

  const session1 = await prisma.eventSession.upsert({
    where: { id: "seed-session-1" },
    update: {
      name: "Opening Keynote: The Future of Dev",
      description: "Join our CEO as they unveil the roadmap for the next decade of developer tooling and explore how AI is reshaping software engineering.",
      room: "Main Hall",
      track: "Main Stage",
      startTime: day1Morning,
      endTime: day1MorningEnd,
      speakers: [
        { name: "Sarah Chen", title: "CEO, TechCorp" },
        { name: "Marcus Rivera", title: "VP Engineering, CloudBase" },
      ],
    },
    create: {
      id: "seed-session-1",
      eventId: event1.id,
      name: "Opening Keynote: The Future of Dev",
      description: "Join our CEO as they unveil the roadmap for the next decade of developer tooling and explore how AI is reshaping software engineering.",
      type: "keynote",
      room: "Main Hall",
      track: "Main Stage",
      startTime: day1Morning,
      endTime: day1MorningEnd,
      capacity: 500,
      speakers: [
        { name: "Sarah Chen", title: "CEO, TechCorp" },
        { name: "Marcus Rivera", title: "VP Engineering, CloudBase" },
      ],
      status: "scheduled",
    },
  });
  const session2 = await prisma.eventSession.upsert({
    where: { id: "seed-session-2" },
    update: {
      name: "Workshop: Building Production APIs",
      description: "Hands-on workshop covering REST and GraphQL API design patterns, authentication, rate limiting, and deployment best practices.",
      room: "Workshop Room A",
      track: "Workshops",
      startTime: day1WorkshopStart,
      endTime: day1WorkshopEnd,
      speakers: [{ name: "Emily Zhang", title: "Staff Engineer, Stripe" }],
    },
    create: {
      id: "seed-session-2",
      eventId: event1.id,
      name: "Workshop: Building Production APIs",
      description: "Hands-on workshop covering REST and GraphQL API design patterns, authentication, rate limiting, and deployment best practices.",
      type: "workshop",
      room: "Workshop Room A",
      track: "Workshops",
      startTime: day1WorkshopStart,
      endTime: day1WorkshopEnd,
      capacity: 40,
      speakers: [{ name: "Emily Zhang", title: "Staff Engineer, Stripe" }],
      status: "scheduled",
    },
  });
  await prisma.eventSession.upsert({
    where: { id: "seed-session-3" },
    update: {},
    create: {
      id: "seed-session-3",
      eventId: event1.id,
      name: "Panel: Open Source Sustainability",
      description: "Industry leaders discuss funding models, maintainer burnout, and the future of open source.",
      type: "panel",
      room: "Main Hall",
      track: "Main Stage",
      startTime: day1PanelStart,
      endTime: day1PanelEnd,
      capacity: 500,
      speakers: [
        { name: "Liam Foster", title: "Maintainer, Vite" },
        { name: "Ava Patel", title: "OSPO Lead, Google" },
      ],
      status: "scheduled",
    },
  });
  await prisma.eventSession.upsert({
    where: { id: "seed-session-4" },
    update: {},
    create: {
      id: "seed-session-4",
      eventId: event1.id,
      name: "Deep Dive: Edge Computing",
      description: "Explore how edge computing and serverless architecture work together to deliver sub-50ms latency globally.",
      type: "conference",
      room: "Room B",
      track: "Technical",
      startTime: day2Morning,
      endTime: day2MorningEnd,
      capacity: 120,
      speakers: [{ name: "Noah Kim", title: "CTO, EdgeStack" }],
      status: "scheduled",
    },
  });

  // Content sections for event1
  const sectionData = [
    {
      id: "seed-section-1",
      eventId: event1.id,
      title: "About this event",
      type: "about",
      sortOrder: 0,
      isVisible: true,
      content: `Tech Conf 2026 is the premier gathering for developers, engineers, and tech leaders. Over two action-packed days, you'll hear from industry pioneers, participate in hands-on workshops, and connect with a global community of innovators.

Whether you're a seasoned architect or just starting your journey, there's something here for everyone. Expect deep technical sessions, lively panels, and plenty of networking opportunities.

All attendees receive lunch, coffee breaks, a conference swag bag, and access to all recorded sessions after the event.`,
    },
    {
      id: "seed-section-2",
      eventId: event1.id,
      title: "Frequently asked questions",
      type: "faq",
      sortOrder: 1,
      isVisible: true,
      content: `Q: Is there a dress code?
A: Smart casual. Wear what makes you comfortable.

Q: Will sessions be recorded?
A: Yes! All main stage talks and panels will be recorded and shared with registered attendees within 2 weeks.

Q: Is there parking available?
A: Moscone Center has underground parking. Public transit (BART) is also highly recommended.

Q: Can I get a refund?
A: Free tickets can be cancelled anytime. Paid tickets are refundable up to 7 days before the event.`,
    },
    {
      id: "seed-section-3",
      eventId: event1.id,
      title: "Our sponsors",
      type: "sponsors",
      sortOrder: 2,
      isVisible: true,
      content: `Gold: TechCorp, CloudBase, DevTools Inc.
Silver: OpenStack Foundation, CodeBridge, DataFlow
Community: Local Developer Guild, WomenWhoCode SF, DevOpsDays`,
    },
  ];

  for (const sec of sectionData) {
    await prisma.eventSection.upsert({
      where: { id: sec.id },
      update: {},
      create: sec,
    });
  }

  // Ticket types per event
  const tt1 = await prisma.ticketType.upsert({
    where: { id: "seed-tt-1" },
    update: {},
    create: {
      id: "seed-tt-1",
      eventId: event1.id,
      name: "General",
      price: 0,
      currency: "USD",
      quantity: 300,
      sold: 45,
      sessionAccess: "all",
      allowedSessionIds: [],
    },
  });
  const tt2 = await prisma.ticketType.upsert({
    where: { id: "seed-tt-2" },
    update: {},
    create: {
      id: "seed-tt-2",
      eventId: event1.id,
      name: "VIP",
      price: 99,
      currency: "USD",
      quantity: 50,
      sold: 12,
      sessionAccess: "all",
      allowedSessionIds: [],
    },
  });
  const tt3 = await prisma.ticketType.upsert({
    where: { id: "seed-tt-3" },
    update: {},
    create: {
      id: "seed-tt-3",
      eventId: event2.id,
      name: "Early Bird",
      price: 29,
      currency: "USD",
      quantity: 100,
      sold: 0,
      sessionAccess: "all",
      allowedSessionIds: [],
    },
  });

  // Stations for event1 and event3
  const station1 = await prisma.station.upsert({
    where: { id: "seed-station-1" },
    update: {},
    create: {
      id: "seed-station-1",
      eventId: event1.id,
      name: "Main Entrance",
      type: "entrance",
      isActive: true,
    },
  });
  const station2 = await prisma.station.upsert({
    where: { id: "seed-station-2" },
    update: {},
    create: {
      id: "seed-station-2",
      eventId: event1.id,
      name: "Conference #2",
      type: "session_room",
      isActive: true,
    },
  });
  const station3 = await prisma.station.upsert({
    where: { id: "seed-station-3" },
    update: {},
    create: {
      id: "seed-station-3",
      eventId: event3.id,
      name: "Registration Desk",
      type: "registration_desk",
      isActive: true,
    },
  });

  // Registrations for event1 (with confirmation tokens for QR testing)
  const regs: { id: string; eventId: string; ticketTypeId: string; firstName: string; lastName: string; email: string; confirmationToken: string; status: "CONFIRMED" | "PENDING"; customFieldValues?: Record<string, string> }[] = [
    { id: "seed-reg-1", eventId: event1.id, ticketTypeId: tt1.id, firstName: "Alex", lastName: "Smith", email: "alex@example.com", confirmationToken: token(), status: "CONFIRMED", customFieldValues: { "cf-phone": "+1 (415) 555-0101", "cf-company": "TechCorp", "cf-role": "Senior Engineer", "cf-dietary": "None" } },
    { id: "seed-reg-2", eventId: event1.id, ticketTypeId: tt1.id, firstName: "Jordan", lastName: "Lee", email: "jordan@example.com", confirmationToken: token(), status: "CONFIRMED", customFieldValues: { "cf-phone": "+1 (650) 555-0202", "cf-company": "StartupXYZ", "cf-role": "Product Manager", "cf-dietary": "Vegetarian" } },
    { id: "seed-reg-3", eventId: event1.id, ticketTypeId: tt2.id, firstName: "Sam", lastName: "Taylor", email: "sam@example.com", confirmationToken: token(), status: "CONFIRMED", customFieldValues: { "cf-company": "CloudBase", "cf-role": "CTO", "cf-dietary": "Vegan" } },
    { id: "seed-reg-4", eventId: event1.id, ticketTypeId: tt1.id, firstName: "Riley", lastName: "Brown", email: "riley@example.com", confirmationToken: token(), status: "PENDING", customFieldValues: { "cf-company": "Freelance", "cf-role": "Full-stack Developer" } },
    { id: "seed-reg-5", eventId: event1.id, ticketTypeId: tt1.id, firstName: "Casey", lastName: "Davis", email: "casey@example.com", confirmationToken: token(), status: "CONFIRMED", customFieldValues: { "cf-phone": "+1 (510) 555-0505", "cf-company": "DevTools Inc.", "cf-role": "Designer", "cf-dietary": "Gluten-free" } },
  ];

  for (const r of regs) {
    await prisma.registration.upsert({
      where: { id: r.id },
      update: { customFieldValues: r.customFieldValues as any },
      create: {
        id: r.id,
        eventId: r.eventId,
        ticketTypeId: r.ticketTypeId,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        confirmationToken: r.confirmationToken,
        status: r.status,
        sessionIds: [],
        channel: "public",
        customFieldValues: r.customFieldValues as any,
      },
    });
  }

  // Check-ins for first 3 registrations (so "today" and "total" stats show)
  const reg1 = await prisma.registration.findUnique({ where: { id: "seed-reg-1" } });
  const reg2 = await prisma.registration.findUnique({ where: { id: "seed-reg-2" } });
  const reg3 = await prisma.registration.findUnique({ where: { id: "seed-reg-3" } });
  if (reg1 && reg2 && reg3) {
    await prisma.checkIn.upsert({
      where: { id: "seed-checkin-1" },
      update: {},
      create: {
        id: "seed-checkin-1",
        registrationId: reg1.id,
        stationId: station1.id,
        scannedBy: user.id,
        type: "CHECKIN",
        method: "qr_scan",
      },
    });
    await prisma.checkIn.upsert({
      where: { id: "seed-checkin-2" },
      update: {},
      create: {
        id: "seed-checkin-2",
        registrationId: reg2.id,
        stationId: station1.id,
        scannedBy: user.id,
        type: "CHECKIN",
        method: "manual",
      },
    });
    await prisma.checkIn.upsert({
      where: { id: "seed-checkin-3" },
      update: {},
      create: {
        id: "seed-checkin-3",
        registrationId: reg3.id,
        stationId: station2.id,
        scannedBy: user.id,
        type: "CHECKIN",
        method: "qr_scan",
      },
    });
    // Session check-ins (attendee activity)
    await prisma.checkIn.upsert({
      where: { id: "seed-checkin-s1" },
      update: {},
      create: {
        id: "seed-checkin-s1",
        registrationId: reg1.id,
        sessionId: session1.id,
        stationId: station2.id,
        scannedBy: user.id,
        type: "CHECKIN",
        method: "qr_scan",
      },
    });
    await prisma.checkIn.upsert({
      where: { id: "seed-checkin-s2" },
      update: {},
      create: {
        id: "seed-checkin-s2",
        registrationId: reg1.id,
        sessionId: session2.id,
        stationId: station2.id,
        scannedBy: user.id,
        type: "CHECKIN",
        method: "qr_scan",
      },
    });
    await prisma.checkIn.upsert({
      where: { id: "seed-checkin-s3" },
      update: {},
      create: {
        id: "seed-checkin-s3",
        registrationId: reg2.id,
        sessionId: session1.id,
        stationId: station2.id,
        scannedBy: user.id,
        type: "CHECKIN",
        method: "manual",
      },
    });
  }

  // More registrations for event1 (no check-in yet) so list looks full
  for (let i = 6; i <= 15; i++) {
    const email = `attendee${i}@example.com`;
    const existing = await prisma.registration.findFirst({ where: { eventId: event1.id, email } });
    if (!existing) {
      await prisma.registration.create({
        data: {
          eventId: event1.id,
          ticketTypeId: tt1.id,
          firstName: `Attendee`,
          lastName: `${i}`,
          email,
          confirmationToken: token(),
          status: i % 3 === 0 ? "PENDING" : "CONFIRMED",
          sessionIds: [],
          channel: "public",
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("  Organizations: 1 (existing)");
  console.log("  Events: 3 (Tech Conf 2026, Product Launch, Community Meetup)");
  console.log("  Sessions: 4 (event1 — keynote, workshop, panel, deep dive)");
  console.log("  Content sections: 3 (about, faq, sponsors)");
  console.log("  Ticket types: 3");
  console.log("  Stations: 3");
  console.log("  Registrations: 15+ for Tech Conf");
  console.log("  Check-ins: 3 (for scanner stats)");
  console.log("  Branding: primaryColor + accentColor on Tech Conf");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
