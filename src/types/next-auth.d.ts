import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      orgId?: string;
      orgRole?: string;
      orgName?: string;
      orgSlug?: string;
    };
  }
}
