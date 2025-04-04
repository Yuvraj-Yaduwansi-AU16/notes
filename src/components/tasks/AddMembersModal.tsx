/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Search, UserPlus } from "lucide-react";

interface Assignment {
  userId: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface AddMembersModalProps {
  taskId: string;
  currentAssignments: Assignment[];
  onAssign?: (userId: string, name: string) => void;
  onRemove?: (userId: string) => void;
}

export function AddMembersModal({
  taskId,
  currentAssignments,
  onAssign,
  onRemove,
}: AddMembersModalProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const itemsPerPage = 10;

  const { data, isLoading } = api.user.list.useQuery(
    {
      search: searchQuery,
      page,
      limit: itemsPerPage,
    },
    {
      enabled: isOpen && !!session, // Only fetch when modal is open and user is logged in
      retry: false, // Don't retry on failure to prevent session issues
    },
  );

  const assignTask = api.task.assign.useMutation({
    onSuccess: () => {
      toast.success("Member added successfully!");
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to add member");
    },
  });

  const handleAssignUser = (userId: string, name: string) => {
    if (!session) {
      toast.error("Please log in to assign members");
      return;
    }

    if (taskId) {
      assignTask.mutate({
        taskId,
        userId,
      });
    } else if (onAssign) {
      onAssign(userId, name);
    }
  };

  const isUserAssigned = (userId: string) => {
    return currentAssignments.some(
      (assignment) => assignment.userId === userId,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {data?.users.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    variant={isUserAssigned(user.id) ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleAssignUser(user.id, user.name ?? "")}
                    disabled={isUserAssigned(user.id)}
                  >
                    {isUserAssigned(user.id) ? "Added" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.users || data.users.length < itemsPerPage}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
