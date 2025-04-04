/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { AddMembersModal } from "~/components/tasks/AddMembersModal";
import { DeleteTaskModal } from "~/components/tasks/DeleteTaskModal";
import { EditMembersModal } from "~/components/tasks/EditMembersModal";
import Header from "~/components/Header";

interface FormData {
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | null;
  creator: {
    name: string | null;
  };
  creatorId: string;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  assignments: Array<{
    id: string;
    name: string;
    user: {
      id: string;
      name: string | null;
    };
  }>;
}

export default function EditTaskPage() {
  const router = useRouter();
  const { id } = router.query;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMembersModalOpen, setIsEditMembersModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
  });
  const [assignments, setAssignments] = useState<
    { userId: string; name: string }[]
  >([]);

  const { data: task, isLoading: isLoadingTask } = api.task.listOne.useQuery(
    id as string,
    {
      enabled: !!id,
    },
  );

  useEffect(() => {
    if (task) {
      console.log(task, "task");
      setFormData({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 16)
          : "",
      });
      setAssignments(
        task.assignments.map((assignment) => ({
          userId: assignment.user.id,
          name: assignment.user.name ?? "",
        })),
      );
    }
  }, [task]);

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully!");
      void router.push("/");
    },
    onError: (error) => {
      toast.error(error.message ?? "An unexpected error occurred");
    },
  });

  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully!");
    },
    onError: () => {
      toast.error("An unexpected error occurred");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const x = {
      id: id as string,
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      assignments: assignments.map((a) => a.userId),
    };
    console.log(x, "xxxxx");
    updateTask.mutate({
      id: id as string,
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      assignments: assignments.map((a) => a.userId),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoadingTask) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <h1 className="text-2xl font-bold text-red-500">Task not found</h1>
        <Button className="mt-4" onClick={() => void router.push("/")}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Task</h1>
          <Button
            variant="outline"
            onClick={() => setIsEditMembersModalOpen(true)}
          >
            Edit Members
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: FormData["status"]) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: FormData["priority"]) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
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
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => void router.push("/")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={updateTask.isPending}
            >
              {updateTask.isPending ? "Updating..." : "Update Task"}
            </Button>
          </div>
          <Button
            className="flex-1 bg-red-700 hover:bg-red-700"
            onClick={(e) => {
              e.preventDefault();
              setIsDeleteModalOpen(true);
            }}
          >
            Delete Task
          </Button>
        </form>
        {isDeleteModalOpen && (
          <DeleteTaskModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              try {
                const success = await deleteTask.mutateAsync(task.id);
                if (success) {
                  await router.push("/");
                }
              } catch (error) {
                console.error("Error deleting task:", error);
                toast.error("Failed to delete task. Please try again.");
              }
            }}
            title="Delete Task"
            description="Are you sure you want to delete this task? This action cannot be undone."
          />
        )}
        {isEditMembersModalOpen && (
          <EditMembersModal
            isOpen={isEditMembersModalOpen}
            onClose={() => setIsEditMembersModalOpen(false)}
            taskId={task.id}
            task={task}
            currentAssignments={assignments}
            onAssignmentsChange={setAssignments}
          />
        )}
      </div>
    </>
  );
}
