import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { prisma } from "@/lib/db";
import { sendOrganizationInvitation } from "@/lib/email";

// Define RBAC roles and permissions (event-level + organization plugin dimensions)
const ac = createAccessControl({
    // Event/workspace level
    event: ["create", "read", "update", "delete"],
    session: ["create", "read", "update", "delete"],
    attendee: ["create", "read", "update", "delete", "scan"],
    station: ["create", "read", "update", "delete"],
    report: ["read", "export"],
    // Organization plugin: required for invite/member/org management
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    team: ["create", "update", "delete"],
    ac: ["create", "read", "update", "delete"],
});

const owner = ac.newRole({
    event: ["create", "read", "update", "delete"],
    session: ["create", "read", "update", "delete"],
    attendee: ["create", "read", "update", "delete", "scan"],
    station: ["create", "read", "update", "delete"],
    report: ["read", "export"],
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    team: ["create", "update", "delete"],
    ac: ["create", "read", "update", "delete"],
});

const cohost = ac.newRole({
    event: ["create", "read", "update"],
    session: ["create", "read", "update"],
    attendee: ["create", "read", "update", "scan"],
    station: ["create", "read", "update"],
    report: ["read", "export"],
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    team: ["create", "update", "delete"],
    ac: ["read"],
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
            async sendInvitationEmail(data) {
                const baseUrl = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");
                const inviteLink = `${baseUrl}/accept-invitation?invitationId=${data.id}`;
                await sendOrganizationInvitation({
                    email: data.email,
                    invitedByUsername: data.inviter?.user?.name ?? data.inviter?.user?.email ?? "A team member",
                    invitedByEmail: data.inviter?.user?.email ?? "",
                    teamName: data.organization?.name ?? "the workspace",
                    inviteLink,
                });
            },
        }),
        admin(), // Super Admin capabilities
    ],
    socialProviders: {
        // github: { ... }, // Add providers later
    }
});
