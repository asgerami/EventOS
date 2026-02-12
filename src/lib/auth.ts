import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { organization, admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";

const prisma = new PrismaClient();

// Define RBAC roles and permissions
const ac = createAccessControl({
    event: ["create", "read", "update", "delete"],
    session: ["create", "read", "update", "delete"],
    attendee: ["create", "read", "update", "delete", "scan"],
    station: ["create", "read", "update", "delete"],
    report: ["read", "export"],
});

const owner = ac.newRole({
    event: ["create", "read", "update", "delete"],
    session: ["create", "read", "update", "delete"],
    attendee: ["create", "read", "update", "delete", "scan"],
    station: ["create", "read", "update", "delete"],
    report: ["read", "export"],
});

const cohost = ac.newRole({
    event: ["create", "read", "update"],
    session: ["create", "read", "update"],
    attendee: ["create", "read", "update", "scan"],
    station: ["create", "read", "update"],
    report: ["read", "export"],
});

const staff = ac.newRole({
    attendee: ["read", "scan"],
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        organization({
            ac: ac,
            roles: {
                owner,
                cohost, // Custom role
                staff,  // Custom role
            },
            allowUserToCreateOrganization: true, // Super Admin will restrict this in production via middleware or logical checks
        }),
        admin(), // Super Admin capabilities
    ],
    socialProviders: {
        // github: { ... }, // Add providers later
    }
});
