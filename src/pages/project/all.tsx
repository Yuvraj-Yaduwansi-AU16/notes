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
import { LoadingPage } from "~/components/ui/loading-page";
type Project = RouterOutputs["project"]["list"][number];

const ProjectsPage = () => {
  const router = useRouter();
  const { data: projects, isLoading } = api.project.list.useQuery();

  if (isLoading) {
    return <LoadingPage message="Loading projects..." />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Button onClick={() => void router.push("/project/create")}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project: Project) => (
          <Card
            key={project.id}
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={() => void router.push(`/project/${project.id}`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{project.name}</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
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
              <p className="mb-4 text-sm text-gray-600">
                {project.description ?? "No description provided"}
              </p>
              <div className="space-y-2 text-sm">
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
    </div>
  );
};

export default ProjectsPage;
