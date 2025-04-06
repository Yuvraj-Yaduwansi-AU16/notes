import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

export async function findUserBySessionId(db: Prisma.TransactionClient, sessionId: string, email?: string) {
    try {
      // First try to find user by session ID or supabaseId
      let user = await db.user.findFirst({
        where: {
          OR: [
            { id: sessionId },
            { supabaseId: sessionId }
          ]
        }
      });
  
      // If not found and email is provided, try to find by email
      if (!user && email) {
        user = await db.user.findUnique({
          where: { email }
        });
      }
  
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in database",
        });
      }
  
      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user. Please try again.",
      });
    }
  }