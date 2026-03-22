import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  organizationMembers,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }

      // Load org membership on sign-in or when explicitly refreshed
      if (user || trigger === "update") {
        const membership = await db.query.organizationMembers.findFirst({
          where: eq(organizationMembers.userId, token.id as string),
          with: { organization: true },
        });

        if (membership) {
          token.orgId = membership.organizationId;
          token.orgRole = membership.role;
          token.orgName = membership.organization.name;
          token.orgSlug = membership.organization.slug;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.orgId) {
        session.user.orgId = token.orgId as string;
        session.user.orgRole = token.orgRole as string;
        session.user.orgName = token.orgName as string;
        session.user.orgSlug = token.orgSlug as string;
      }
      return session;
    },
  },
});

// Deduplicate auth() calls within a single React server request
const auth = cache(uncachedAuth);

export { handlers, auth, signIn, signOut };
