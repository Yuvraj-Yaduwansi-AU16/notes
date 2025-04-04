/* eslint-disable @typescript-eslint/no-unsafe-call */

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

export default function TasksPage() {
  const { data: tasks, isLoading } = api.task.list.useQuery();
  const router = useRouter();
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tasks</h1>
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
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Button asChild>
            <Link href="/tasks/create">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks?.map((task) => (
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
                      Created by {task.creator.name ?? "Unknown"}
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
                <p className="line-clamp-2 text-sm text-gray-600">
                  {task.description}
                </p>
                {task.dueDate && (
                  <p className="mt-2 text-sm text-gray-500">
                    Due: {format(new Date(task.dueDate), "MMM d, yyyy h:mm a")}
                  </p>
                )}
                {task.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        style={{
                          backgroundColor: tag.color ?? "#e5e7eb",
                          color: tag.color ? "#ffffff" : "#374151",
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
