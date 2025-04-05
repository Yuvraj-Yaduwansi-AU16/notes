/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  projectId: z.string().min(1, "Project ID is required"),
  assignments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateTaskSchema = z.object({
  id: z.string().min(1, "Id is required"),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.date().optional(),
  assignments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const taskRouter = createTRPCRouter({
  // List all tasks where user is either creator of the project or assigned to the task
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
            { project: { creatorId: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id } },
            { assignments: { some: { userId: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id } } },
          ],
        },
        include: {
          project: {
            select: {
              name: true,
              creator: {
                select: {
                  name: true,
                },
              },
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

  // List tasks for a specific project where user is either creator or assigned
  listByProject: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const tasks = await ctx.db.task.findMany({
          where: {
            projectId: input,
            OR: [
              { project: { creatorId: ctx.session.user.id } },
              { assignments: { some: { userId: ctx.session.user.id } } },
            ],
          },
          include: {
            project: {
              select: {
                name: true,
                creator: {
                  select: {
                    name: true,
                  },
                },
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
          orderBy: {
            createdAt: "desc",
          },
        });

        return tasks;
      } catch (error) {
        console.error("Error in task.listByProject:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tasks. Please try again.",
        });
      }
    }),

  // Get a single task by ID
  listOne: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const task = await ctx.db.task.findUnique({
          where: { id: input },
          include: {
            project: {
              select: {
                name: true,
                creator: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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

        // Check if user has access to this task
        const hasAccess = task.project.creator.id === ctx.session.user.id || 
                         task.assignments.some(a => a.user.id === ctx.session.user.id);
        
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this task",
          });
        }

        return task;
      } catch (error) {
        console.error("Error in task.listOne:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch task. Please try again.",
        });
      }
    }),

  // Create a new task
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { assignments, tags, ...taskData } = input;
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);

      // Check if user has access to the project
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { creatorId: true },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.creatorId !== (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project creator can create tasks",
        });
      }

      const task = await ctx.db.task.create({
        data: {
          ...taskData,
          assignments: assignments
            ? {
                create: assignments.map((userId) => ({
                  userId,
                })),
              }
            : undefined,
          tags: tags
            ? {
                connectOrCreate: tags.map((tagName) => ({
                  where: { id: tagName },
                  create: { name: tagName },
                })),
              }
            : undefined,
        },
        include: {
          project: {
            select: {
              name: true,
              creator: {
                select: {
                  name: true,
                },
              },
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

  // Update a task
  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, assignments, tags, ...taskData } = input;
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);

      // Check if user has access to the task
      const task = await ctx.db.task.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              creatorId: true,
            },
          },
          assignments: {
            select: {
              userId: true,
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

      const isCreator = task.project.creatorId === (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id);
      const isAssigned = task.assignments.some(a => a.userId === (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id));

      if (!isCreator && !isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this task",
        });
      }

      const updatedTask = await ctx.db.task.update({
        where: { id },
        data: {
          ...taskData,
          assignments: assignments
            ? {
                deleteMany: {}, // Remove all existing assignments
                create: assignments.map((userId) => ({
                  userId,
                })),
              }
            : undefined,
          tags: tags
            ? {
                set: [], // Remove all existing tags
                connectOrCreate: tags.map((tagName) => ({
                  where: { id: tagName },
                  create: { name: tagName },
                })),
              }
            : undefined,
        },
        include: {
          project: {
            select: {
              name: true,
              creator: {
                select: {
                  name: true,
                },
              },
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

      return updatedTask;
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);

      // Check if user has access to the task
      const task = await ctx.db.task.findUnique({
        where: { id: input },
        include: {
          project: {
            select: {
              creatorId: true,
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

      if (task.project.creatorId !== (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project creator can delete tasks",
        });
      }

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

        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task. Please try again.",
        });
      }
    }),

  // Assign a user to a task
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

      // Check if the current user is the project creator
      const task = await ctx.db.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            select: {
              creatorId: true,
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

      if (task.project.creatorId !== (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project creator can assign members",
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

  // Remove a user from a task
  removeAssign: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { taskId, userId } = input;
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);

      // Check if the current user is the project creator
      const task = await ctx.db.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            select: {
              creatorId: true,
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

      if (task.project.creatorId !== (ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only project creator can remove members",
        });
      }

      // Remove the assignment
      await ctx.db.taskAssignment.delete({
        where: {
          taskId_userId: {
            taskId,
            userId,
          },
        },
      });

      return { success: true };
    }),
}); 