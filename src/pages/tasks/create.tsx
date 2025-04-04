import { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
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
import Header from "~/components/Header";

interface FormData {
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
}

interface Assignment {
  userId: string;
  name: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully!");
      void router.push("/");
    },
    onError: (error) => {
      if (error.message?.includes("401")) {
        toast.error("Your session has expired. Please log in again.");
        void router.push("/login");
      } else {
        toast.error(error.message ?? "An unexpected error occurred");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please log in to create a task");
      return;
    }
    createTask.mutate({
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

  const handleAssignUser = (userId: string, name: string) => {
    if (!session) {
      toast.error("Please log in to assign members");
      return;
    }
    setAssignments((prev) => [...prev, { userId, name }]);
  };

  const handleRemoveAssignment = (userId: string) => {
    setAssignments((prev) => prev.filter((a) => a.userId !== userId));
  };

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <AddMembersModal
            taskId=""
            currentAssignments={assignments}
            onAssign={handleAssignUser}
            onRemove={handleRemoveAssignment}
          />
        </div>

        {assignments.length > 0 && (
          <div className="mb-6 rounded-lg border p-4">
            <h2 className="mb-2 text-sm font-medium">Assigned Members</h2>
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.userId}
                  className="bg-primary/10 flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                >
                  <span>{assignment.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(assignment.userId)}
                    className="text-primary hover:text-primary/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

          <Button
            type="submit"
            className="w-full"
            disabled={createTask.isPending}
          >
            {createTask.isPending ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </div>
    </>
  );
}
