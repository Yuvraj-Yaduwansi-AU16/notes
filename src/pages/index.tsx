/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { api } from "~/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import type { RouterOutputs } from "~/utils/api";
import Header from "~/components/Header";

type Project = RouterOutputs["project"]["list"][number];

const ProjectsPage = () => {
  const router = useRouter();
  const { data: projects, isLoading } = api.project.list.useQuery();

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-12">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Projects</h1>
            <Button onClick={() => void router.push("/project/create")}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container px-5 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Projects</h1>
            <p className="mt-2 text-gray-500">
              Manage and track your projects in one place
            </p>
          </div>
          <Button
            onClick={() => void router.push("/project/create")}
            className="h-11 px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-12 text-center">
            <div className="rounded-full bg-gray-50 p-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating a new project
            </p>
            <Button
              onClick={() => void router.push("/project/create")}
              className="mt-4"
            >
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project: Project) => (
              <Card
                key={project.id}
                className="group cursor-pointer transition-all hover:shadow-lg"
                onClick={() => void router.push(`/project/${project.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="line-clamp-1">{project.name}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        project.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : project.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-6 line-clamp-2 text-sm text-gray-600">
                    {project.description ?? "No description provided"}
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Tasks</span>
                      <span className="font-medium">
                        {project.tasks.length} tasks
                      </span>
                    </div>
                    {project.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Start Date</span>
                        <span className="font-medium">
                          {format(new Date(project.startDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">End Date</span>
                        <span className="font-medium">
                          {format(new Date(project.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectsPage;
