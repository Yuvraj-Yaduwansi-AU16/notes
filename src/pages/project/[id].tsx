/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Users, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import type { RouterOutputs } from "~/utils/api";
import { EditMembersModal } from "~/components/tasks/EditMembersModal";
import { DeleteTaskModal } from "~/components/tasks/DeleteTaskModal";
import type { Task } from "@prisma/client";
import Header from "~/components/Header";
import { LoadingPage } from "~/components/ui/loading-page";
import { ErrorPage } from "~/components/ui/error-page";
type Project = RouterOutputs["project"]["listOne"];
// type Task = RouterOutputs["project"]["listOne"]["tasks"][number];
type User = RouterOutputs["user"]["list"]["users"][number];

interface TaskFormData {
  id: string;
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  dueDate: string | null;
  assignments: { userId: string; name: string }[];
}

const ProjectPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED" | "ARCHIVED">(
    "ACTIVE",
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tasks, setTasks] = useState<TaskFormData[]>([]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    index: number;
    id?: string;
  } | null>(null);
  const [isProjectDeleteModalOpen, setIsProjectDeleteModalOpen] =
    useState(false);

  const { data: users } = api.user.list.useQuery({
    search: "",
    page: 1,
    limit: 100,
  });
  const { data: project, isLoading } = api.project.listOne.useQuery(
    id as string,
    { enabled: !!id },
  );
  const updateProject = api.project.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated successfully");
      void router.push("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeAssign = api.task.removeAssign.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      void router.push("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Initialize form with project data when loaded
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setStatus(project.status);
      setStartDate(project.startDate?.toISOString().split("T")[0] ?? "");
      setEndDate(project.endDate?.toISOString().split("T")[0] ?? "");
      setTasks(
        project.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString().split("T")[0] ?? null,
          assignments: task.assignments.map((assignment) => ({
            userId: assignment.user.id,
            name: assignment.user.name ?? "",
          })),
        })),
      );
    }
  }, [project]);

  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        id: "",
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: null,
        assignments: [],
      },
    ]);
  };

  const handleTaskChange = (
    index: number,
    field: keyof TaskFormData,
    value: string | null,
  ) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[index];
    if (task) {
      updatedTasks[index] = { ...task, [field]: value };
      setTasks(updatedTasks);
    }
  };

  const handleAssignmentsChange = (
    index: number,
    assignments: { userId: string; name: string }[],
  ) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[index];
    if (task) {
      updatedTasks[index] = { ...task, assignments };
      setTasks(updatedTasks);
    }
  };

  const handleRemoveTask = (index: number) => {
    const taskToRemove = tasks[index];
    if (taskToRemove?.id) {
      setDeletedTasks((prev) => [...prev, taskToRemove.id]);
    }
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleDeleteClick = (index: number) => {
    const task = tasks[index];
    setTaskToDelete({ index, id: task?.id });
    setIsDeleteModalOpen(true);
  };

  const handleRemoveProject = async () => {
    if (!id) return;
    await deleteProject.mutateAsync(id as string);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const existingTasks = tasks.filter((task) => task.id);
      const newTasks = tasks.filter((task) => !task.id);

      const projectData = {
        id: id as string,
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        tasks: {
          create: newTasks.map((task) => ({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            assignments: task.assignments.map((a) => a.userId),
          })),
          update: existingTasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            assignments: task.assignments.map((a) => a.userId),
          })),
          delete: deletedTasks,
        },
      };

      await updateProject.mutateAsync(projectData);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading project..." />;
  }

  if (!project) {
    return <ErrorPage message="Failed to load project" />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Edit Project
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update the project details below
            </p>
          </div>

          <div className="mb-6 flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsProjectDeleteModalOpen(true)}
            >
              Delete Project
            </Button>
          </div>

          <Card className="mx-auto max-w-3xl">
            <CardHeader>
              <CardTitle className="text-xl">Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full"
                        placeholder="Enter project name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status}
                        onValueChange={(
                          value: "ACTIVE" | "COMPLETED" | "ARCHIVED",
                        ) => setStatus(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Enter project description"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Tasks</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTask}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <Card
                        key={index}
                        className="border border-gray-200 bg-white p-6 shadow-sm"
                      >
                        <div className="space-y-4">
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Task Title</Label>
                              <Input
                                value={task.title}
                                onChange={(e) =>
                                  handleTaskChange(
                                    index,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                required
                                placeholder="Enter task title"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Due Date</Label>
                              <Input
                                type="date"
                                value={task.dueDate ?? ""}
                                onChange={(e) =>
                                  handleTaskChange(
                                    index,
                                    "dueDate",
                                    e.target.value || null,
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={task.description}
                              onChange={(e) =>
                                handleTaskChange(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter task description"
                            />
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={task.status}
                                onValueChange={(value: Task["status"]) =>
                                  handleTaskChange(index, "status", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TODO">To Do</SelectItem>
                                  <SelectItem value="IN_PROGRESS">
                                    In Progress
                                  </SelectItem>
                                  <SelectItem value="REVIEW">Review</SelectItem>
                                  <SelectItem value="DONE">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select
                                value={task.priority}
                                onValueChange={(value: Task["priority"]) =>
                                  handleTaskChange(index, "priority", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LOW">Low</SelectItem>
                                  <SelectItem value="MEDIUM">Medium</SelectItem>
                                  <SelectItem value="HIGH">High</SelectItem>
                                  <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Assigned Members</Label>
                            <div className="flex flex-wrap gap-2">
                              {task.assignments.map((assignment) => (
                                <div
                                  key={assignment.userId}
                                  className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm"
                                >
                                  <span>{assignment.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedAssignments =
                                        task.assignments.filter(
                                          (a) => a.userId !== assignment.userId,
                                        );

                                      // First call the API to remove the assignment
                                      void removeAssign
                                        .mutateAsync({
                                          taskId: task.id,
                                          userId: assignment.userId,
                                        })
                                        .then(() => {
                                          // Only update UI if API call succeeds
                                          handleAssignmentsChange(
                                            index,
                                            updatedAssignments,
                                          );
                                        })
                                        .catch((error) => {
                                          console.error(
                                            "Failed to remove assignment:",
                                            error,
                                          );
                                        });
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedTaskIndex(index);
                                setIsModalOpen(true);
                              }}
                              className="mt-2"
                            >
                              Add Members
                            </Button>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(index)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Task
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="submit"
                    disabled={updateProject.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateProject.isPending ? "Updating..." : "Update Project"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {selectedTaskIndex !== null && (
          <EditMembersModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTaskIndex(null);
            }}
            taskId={tasks[selectedTaskIndex]?.id ?? ""}
            task={tasks[selectedTaskIndex] as unknown as Task}
            currentAssignments={tasks[selectedTaskIndex]?.assignments ?? []}
            onAssignmentsChange={(assignments) =>
              handleAssignmentsChange(selectedTaskIndex, assignments)
            }
          />
        )}

        {taskToDelete && (
          <DeleteTaskModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setTaskToDelete(null);
            }}
            onConfirm={() => {
              if (taskToDelete.index !== null) {
                handleRemoveTask(taskToDelete.index);
              }
            }}
            title="Delete Task"
            description="Are you sure you want to delete this task? This action cannot be undone."
          />
        )}

        <DeleteTaskModal
          isOpen={isProjectDeleteModalOpen}
          onClose={() => setIsProjectDeleteModalOpen(false)}
          onConfirm={handleRemoveProject}
          title="Delete Project"
          description="Are you sure you want to delete this project? This action cannot be undone."
          confirmText="Delete Project"
        />
      </div>
    </>
  );
};

export default ProjectPage;
