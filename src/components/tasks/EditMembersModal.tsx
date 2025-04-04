import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import type { Task } from "@prisma/client";

interface Assignment {
  userId: string;
  name: string;
}

interface EditMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  task: Task;
  currentAssignments: Assignment[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
}

export function EditMembersModal({
  isOpen,
  onClose,
  taskId,
  task,
  currentAssignments,
  onAssignmentsChange,
}: EditMembersModalProps) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [lastAction, setLastAction] = useState<{
    type: "add" | "remove";
    userId: string;
    name?: string;
  } | null>(null);

  const { data: userData, isLoading: isLoadingUsers } = api.user.list.useQuery(
    { search, page, limit },
    { enabled: isOpen },
  );

  const assignTask = api.task.assign.useMutation({
    onSuccess: () => {
      toast.success("Member added successfully!");
      setLastAction(null);
    },
    onError: () => {
      toast.error("Failed to add member");
      // Revert the optimistic update
      if (lastAction?.type === "add") {
        onAssignmentsChange(
          currentAssignments.filter((a) => a.userId !== lastAction.userId),
        );
      }
      setLastAction(null);
    },
  });

  const removeAssign = api.task.removeAssign.useMutation({
    onSuccess: () => {
      toast.success("Member removed successfully!");
      setLastAction(null);
    },
    onError: () => {
      toast.error("Failed to remove member");
      // Revert the optimistic update
      if (lastAction?.type === "remove" && lastAction.name) {
        onAssignmentsChange([
          ...currentAssignments,
          { userId: lastAction.userId, name: lastAction.name },
        ]);
      }
      setLastAction(null);
    },
  });

  const handleAddUser = (user: { id: string; name: string | null }) => {
    if (currentAssignments.some((a) => a.userId === user.id)) {
      toast.error("User is already assigned to this task");
      return;
    }
    if (!user.name) {
      toast.error("User name is required");
      return;
    }

    // Store the action for potential rollback
    setLastAction({ type: "add", userId: user.id });

    // Optimistic update
    onAssignmentsChange([
      ...currentAssignments,
      { userId: user.id, name: user.name ?? "" },
    ]);

    // Make the API call
    assignTask.mutate({
      taskId,
      userId: user.id,
    });
  };

  const handleRemoveUser = (userId: string, name: string) => {
    // Store the action for potential rollback
    setLastAction({ type: "remove", userId, name });

    // Optimistic update
    onAssignmentsChange(currentAssignments.filter((a) => a.userId !== userId));

    // Make the API call
    removeAssign.mutate({
      taskId,
      userId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task Members</DialogTitle>
          <DialogDescription>
            Add or remove members from this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="text-center">Loading users...</div>
            ) : userData?.users.length === 0 ? (
              <div className="text-center">No users found</div>
            ) : (
              userData?.users.map((user) => {
                const isAssigned = currentAssignments.some(
                  (a) => a.userId === user.id,
                );
                const isCurrentUser = user.id === session?.user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    {!isCurrentUser && user.id !== task.creatorId && (
                      <Button
                        variant={isAssigned ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          isAssigned
                            ? handleRemoveUser(user.id, user.name ?? "")
                            : handleAddUser(user)
                        }
                        disabled={
                          assignTask.isPending || removeAssign.isPending
                        }
                      >
                        {isAssigned ? "Remove" : "Add"}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {userData && userData.pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(userData.pages, p + 1))}
                disabled={page === userData.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
