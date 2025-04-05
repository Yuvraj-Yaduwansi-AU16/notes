/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useState } from "react";
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
import { AddMembersModal } from "~/components/tasks/AddMembersModal";
import Header from "~/components/Header";

interface Task {
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignments: { userId: string; name: string }[];
}

const CreateProject = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED" | "ARCHIVED">(
    "ACTIVE",
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: users } = api.user.list.useQuery({
    search: "",
    page: 1,
    limit: 100,
  });
  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      void router.push("/");
    },
  });

  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
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
    field: keyof Task,
    value: string | null,
  ) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[index];
    if (task) {
      const updatedTask = { ...task };
      switch (field) {
        case "title":
        case "description":
          updatedTask[field] = value ?? "";
          break;
        case "status":
          updatedTask.status = (value as Task["status"]) ?? "TODO";
          break;
        case "priority":
          updatedTask.priority = (value as Task["priority"]) ?? "MEDIUM";
          break;
        case "dueDate":
          updatedTask.dueDate = value;
          break;
      }
      updatedTasks[index] = updatedTask;
      setTasks(updatedTasks);
    }
  };

  const handleAddMember = () => {
    if (newMemberEmail && !members.includes(newMemberEmail)) {
      setMembers([...members, newMemberEmail]);
      setNewMemberEmail("");
    }
  };

  const handleAssignUser = (userId: string, name: string) => {
    if (selectedTaskIndex === null) return;
    const updatedTasks = [...tasks];
    const task = updatedTasks[selectedTaskIndex];
    if (task && !task.assignments.some((a) => a.userId === userId)) {
      task.assignments.push({ userId, name });
      setTasks(updatedTasks);
    }
  };

  const handleRemoveAssignment = (taskIndex: number, userId: string) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    if (task) {
      task.assignments = task.assignments.filter((a) => a.userId !== userId);
      setTasks(updatedTasks);
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const projectData = {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        tasks: tasks.map((task) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          assignedTo: task.assignments.map((a) => a.userId),
        })),
      };
      await createProject.mutateAsync(projectData);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Create New Project
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Fill in the details below to create a new project
            </p>
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
                                    onClick={() =>
                                      handleRemoveAssignment(
                                        index,
                                        assignment.userId,
                                      )
                                    }
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
                              onClick={() => handleRemoveTask(index)}
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

                <Separator />

                <div className="space-y-6">
                  {members.length > 0 && (
                    <div className="space-y-2">
                      {members.map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3"
                        >
                          <span className="text-sm text-gray-700">
                            {member}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setMembers(members.filter((_, i) => i !== index))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createProject.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createProject.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {selectedTaskIndex !== null && (
          <AddMembersModal
            taskId=""
            currentAssignments={tasks[selectedTaskIndex]?.assignments ?? []}
            onAssign={handleAssignUser}
            onRemove={(userId) =>
              handleRemoveAssignment(selectedTaskIndex, userId)
            }
          />
        )}
      </div>
    </>
  );
};

export default CreateProject;
