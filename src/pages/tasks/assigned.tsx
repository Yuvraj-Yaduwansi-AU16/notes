import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import Header from "~/components/Header";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | null;
  project: {
    name: string;
    creator: {
      id: string;
      name: string | null;
    };
  };
  assignments: Array<{
    id: string;
    taskId: string;
    userId: string;
    assignedAt: Date;
    completedAt: Date | null;
    user: {
      id: string;
      name: string | null;
    };
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

const priorityColors = {
  LOW: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

const statusColors = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-purple-500",
  DONE: "bg-green-500",
};

export default function AssignedTasksPage() {
  const { data: tasks, isLoading } = api.task.list.useQuery();
  const router = useRouter();

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Tasks</h1>
            <Button asChild>
              <Link href="/tasks/create">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  const typedTasks = tasks as Task[] | undefined;

  return (
    <>
      <Header />
      <div className="container mx-auto px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <Button asChild>
            <Link href="/tasks/create">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {typedTasks?.map((task) => (
            <Card
              key={task.id}
              className="transition-shadow hover:shadow-lg"
              onClick={() => {
                void router.push(`/tasks/${task.id}`);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{task.title}</CardTitle>
                    <CardDescription>
                      Project: {task.project.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={`${priorityColors[task.priority]} text-white`}
                    >
                      {task.priority}
                    </Badge>
                    <Badge
                      className={`${statusColors[task.status]} text-white`}
                    >
                      {task.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {task.description ? (
                      <span className="line-clamp-2">{task.description}</span>
                    ) : (
                      "No description"
                    )}
                  </p>
                  {task.dueDate && (
                    <p className="text-sm text-gray-500">
                      Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
