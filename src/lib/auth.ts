import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { prisma } from "@/lib/db";

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
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // Cache for 5 minutes
        },
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
