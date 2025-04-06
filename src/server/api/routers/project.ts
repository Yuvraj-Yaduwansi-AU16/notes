/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { findUserBySessionId } from "~/utils/getUser";

// Schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    dueDate: z.date().optional(),
    assignedTo: z.array(z.string()).optional(), // Array of user IDs
    tags: z.array(z.string()).optional(), // Array of tag names
  })).optional(),
});

// Schema for project update
const updateProjectSchema = z.object({
  id: z.string().min(1, "Id is required"),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).default("ACTIVE").optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  tasks: z.object({
    create: z.array(z.object({
      title: z.string().min(1, "Task title is required"),
      description: z.string().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      dueDate: z.date().optional(),
      assignedTo: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    })).optional(),
    update: z.array(z.object({
      id: z.string(),
      title: z.string().min(1, "Task title is required").optional(),
      description: z.string().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      dueDate: z.date().optional(),
      assignedTo: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    })).optional(),
    delete: z.array(z.string()).optional(), // Array of task IDs to delete
  }).optional(),
});

export const projectRouter = createTRPCRouter({
  // List all projects for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
    try {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view projects",
        });
      }

      const projects = await ctx.db.project.findMany({
        where: {
          creatorId: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id,
        },
        include: {
          creator: true,
          tasks: {
            include: {
              assignments: {
                include: {
                  user: true,
                },
              },
              tags: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return projects;
    } catch (error) {
      console.error("Error in project.list:", error);
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
        message: "Failed to fetch projects. Please try again.",
      });
    }
  }),

  // Get a single project by ID
  listOne: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const project = await ctx.db.project.findUnique({
          where: { id: input },
          include: {
            creator: {
              select: {
                name: true,
              },
            },
            tasks: {
              include: {
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
                tags: true,
              },
            },
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        return project;
      } catch (error) {
        console.error("Error in project.listOne:", error);
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
          message: "Failed to fetch project. Please try again.",
        });
      }
    }),

  // Create a new project
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);
      const { tasks, ...projectData } = input;

      const project = await ctx.db.project.create({
        data: {
          ...projectData,
          creatorId: ctx.session.user.id === userBySessionId.id? ctx.session.user.id : userBySessionId.id,
          tasks: tasks ? {
            create: tasks.map(task => ({
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
              assignments: task.assignedTo ? {
                create: task.assignedTo.map(userId => ({
                  userId,
                })),
              } : undefined,
              tags: task.tags ? {
                connectOrCreate: task.tags.map(tagName => ({
                  where: { id: tagName }, // Using id instead of name for unique constraint
                  create: { name: tagName },
                })),
              } : undefined,
            })),
          } : undefined,
        },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          tasks: {
            include: {
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
              tags: true,
            },
          },
        },
      });

      return project;
    }),

  // Update an existing project
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, tasks, ...projectData } = input;
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);

      // Check if the current user is the project creator
      const project = await ctx.db.project.findUnique({
        where: { id },
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
          message: "Only the project creator can update the project",
        });
      }

      const updatedProject = await ctx.db.project.update({
        where: { id },
        data: {
          ...projectData,
          tasks: tasks ? {
            create: tasks.create?.map(task => ({
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate,
              assignments: task.assignedTo ? {
                create: task.assignedTo.map(userId => ({
                  userId,
                })),
              } : undefined,
              tags: task.tags ? {
                connectOrCreate: task.tags.map(tagName => ({
                  where: { id: tagName },
                  create: { name: tagName },
                })),
              } : undefined,
            })),
            update: tasks.update?.map(task => ({
              where: { id: task.id },
              data: {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                assignments: task.assignedTo ? {
                  deleteMany: {}, // Remove all existing assignments
                  create: task.assignedTo.map(userId => ({
                    userId,
                  })),
                } : undefined,
                tags: task.tags ? {
                  set: [], // Remove all existing tags
                  connectOrCreate: task.tags.map(tagName => ({
                    where: { id: tagName },
                    create: { name: tagName },
                  })),
                } : undefined,
              },
            })),
            delete: tasks.delete?.map(taskId => ({ id: taskId })),
          } : undefined,
        },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
          tasks: {
            include: {
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
              tags: true,
            },
          },
        },
      });

      return updatedProject;
    }),

  // Delete a project
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const userBySessionId = await findUserBySessionId(ctx.db, ctx.session?.user?.id);

      // Check if the current user is the project creator
      const project = await ctx.db.project.findUnique({
        where: { id: input },
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
          message: "Only the project creator can delete the project",
        });
      }

      try {
        // Delete all tasks and their assignments first
        await ctx.db.taskAssignment.deleteMany({
          where: {
            task: {
              projectId: input,
            },
          },
        });

        await ctx.db.task.deleteMany({
          where: {
            projectId: input,
          },
        });

        // Then delete the project
        await ctx.db.project.delete({
          where: {
            id: input,
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project. Please try again.",
        });
      }
    }),
}); 