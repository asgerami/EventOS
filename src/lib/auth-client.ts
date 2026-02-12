import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL, // e.g. http://localhost:3000
    plugins: [
        organizationClient(),
        adminClient()
    ]
});

export const {
    signIn,
    signUp,
    useSession
} = authClient;
