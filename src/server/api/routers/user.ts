import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { findUserBySessionId } from "~/utils/getUser";

export const userRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
      try {
        const { search, page, limit } = input;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
          id: { not: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id }, // Exclude current user
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ];
        }

        // Use a transaction to ensure atomicity
        const [users, total] = await ctx.db.$transaction([
          ctx.db.user.findMany({
            where,
            select: {
              id: true,
              name: true,
              email: true,
            },
            skip,
            take: limit,
            orderBy: { name: "asc" },
          }),
          ctx.db.user.count({ where }),
        ]);

        return {
          users,
          total,
          pages: Math.ceil(total / limit),
        };
      } catch (error) {
        console.error("Error in user.list:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2021") {
            // Table does not exist
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database table not found. Please contact support.",
            });
          }
          if (error.code === "P2025") {
            // Record not found
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "No users found.",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users. Please try again.",
        });
      }
    }),
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log("🔹 ctx:", ctx);
      console.log("🔹 Session:", ctx.session);
      
      // First try to find user by session ID
      // let user = await ctx.db.user.findUnique({
      //   where: { id: ctx.session.user.id },
      // });

      let user = await ctx.db.user.findFirst({
        where: {
          OR: [
            { id: ctx.session.user.id },
            { supabaseId: ctx.session.user.id }
          ]
        }
      });
      // If not found, try to find by email
      if (!user && ctx.session.user.email) {
        user = await ctx.db.user.findUnique({
          where: { email: ctx.session.user.email },
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
      console.error("Error in user.getUser:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user. Please try again.",
      });
    }
  }),
  updateUser: protectedProcedure.input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  })).mutation(async ({ ctx, input }) => {
    try { 
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
      const { name, email } = input;
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id },
        data: { name, email },
      });
      return updatedUser;
    } catch (error) {
      console.error("Error in user.updateUser:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update user. Please try again.",
      });
    }
  }),
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      name: z.string().optional(),
      supabaseId: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    return await ctx.db.user.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        supabaseId: input.supabaseId ?? null,
      },
    });
  }),
});
