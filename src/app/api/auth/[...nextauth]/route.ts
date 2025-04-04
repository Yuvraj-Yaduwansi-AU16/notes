/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import NextAuth from "next-auth/next";
import { authConfig } from "~/server/auth/config";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
