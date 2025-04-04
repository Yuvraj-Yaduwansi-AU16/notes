import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { findUserBySessionId } from "./user";

// Schema for task creation
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.date().optional(),
  tagIds: z.array(z.string()).optional(),
  assignments: z.array(z.string()).optional(),
});
const updateTaskSchema = z.object({
  id: z.string().min(1, "Id is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.date().optional(),
  tagIds: z.array(z.string()).optional(),
  assignments: z.array(z.string()).optional(),
});

export const taskRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
    try {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view tasks",
        });
      }

      const tasks = await ctx.db.task.findMany({
        where: {
          OR: [
            { creatorId: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id },
            { assignments: { some: { userId: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id } } },
          ],
        },
        include: {
          creator: true,
          tags: true,
          assignments: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tasks;
    } catch (error) {
      console.error("Error in task.list:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2021") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database table not found. Please contact support.",
          });
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tasks. Please try again.",
      });
    }
  }),
  listOne: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const task = await ctx.db.task.findUnique({
          where: { id: input },
          include: {
            creator: {
              select: {
                name: true,
              },
            },
            tags: true,
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        return task;
      } catch (error) {
        console.error("Error in task.listOne:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2021") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database table not found. Please contact support.",
            });
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch task. Please try again.",
        });
      }
    }),
  update: protectedProcedure.input(updateTaskSchema).mutation(async ({ ctx, input }) => {
    const task = await ctx.db.task.update({
      where: {
        id: input.id,
      },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        tags: input.tagIds
            ? {
                connect: input.tagIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        creator: true,
        tags: true,
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    return task;
  }),
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    try {
      // First, delete all assignments for this task
      await ctx.db.taskAssignment.deleteMany({
        where: {
          taskId: input,
        },
      });

      // Then delete the task
      await ctx.db.task.delete({
        where: {
          id: input,
        },
      });

      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete task. Please try again.",
      });
    }
  }),
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { assignments, ...taskData } = input;
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
      const task = await ctx.db.task.create({
        data: {
          ...taskData,
          creatorId:  ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id,
          assignments: assignments
            ? {
                create: assignments.map((userId) => ({
                  userId,
                })),
              }
            : undefined,
        },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          tags: true,
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return task;
    }),
  assign: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { taskId, userId } = input;
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
      // Check if the current user is the task creator
      const task = await ctx.db.task.findUnique({
        where: { id: taskId },
        select: { creatorId: true },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      if (task.creatorId !== (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the task creator can assign members",
        });
      }

      // Check if the user is already assigned
      const existingAssignment = await ctx.db.taskAssignment.findUnique({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });

      if (existingAssignment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already assigned to this task",
        });
      }

      // Create the assignment
      await ctx.db.taskAssignment.create({
        data: {
          taskId,
          userId,
        },
      });

      return { success: true };
    }),
    removeAssign: protectedProcedure.input(z.object({
      taskId: z.string(),
      userId: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await ctx.db.taskAssignment.delete({
        where: {
          taskId_userId: {
            taskId: input.taskId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),
}); 