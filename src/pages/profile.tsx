/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PencilIcon } from "lucide-react";
import Header from "~/components/Header";
import type { User } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { LoadingPage } from "~/components/ui/loading-page";
import { ErrorPage } from "~/components/ui/error-page";

interface EditFormData {
  name: string;
  email: string;
}
interface UserMetaData {
  name?: string;
  email?: string;
  email_verified?: boolean;
  id?: string;
  phone_verified?: boolean;
  sub?: string;
}
export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: "",
    email: "",
  });

  const { data: user, isLoading } = api.user.getUser.useQuery();

  const updateUser = api.user.updateUser.useMutation();

  useEffect(() => {
    console.log("🔹 User:", user);
    console.log("🔹 Session:", session);

    if (user) {
      setEditFormData({
        name: user.name ?? "",
        email: user.email ?? "",
      });
    } else if (session?.user) {
      // If we have session data but no user data yet
      setEditFormData({
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      });
    }
  }, [user, session]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser.mutateAsync({
        name: editFormData.name,
        email: editFormData.email,
      });
      toast("Profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      toast("Failed to update profile. Please try again.");
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading profile..." />;
  }

  const displayUser = user ?? session?.user;

  if (!displayUser) {
    return <ErrorPage message="Failed to load profile" />;
  }

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditModalOpen(true)}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 rounded-lg border p-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Name</h2>
            <p className="mt-1 text-lg">{displayUser.name}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Email</h2>
            <p className="mt-1 text-lg">{displayUser.email}</p>
          </div>
          {/* {displayUser.image && (
            <div>
              <h2 className="text-sm font-medium text-gray-500">
                Profile Picture
              </h2>
              <img
                src={displayUser.image}
                alt="Profile"
                className="mt-2 h-20 w-20 rounded-full"
              />
            </div>
          )} */}
          {/* <div>
            <h2 className="text-sm font-medium text-gray-500">Member Since</h2>
            <p className="mt-1 text-lg">
              {displayUser.emailVerified
                ? new Date(displayUser.emailVerified).toLocaleDateString()
                : "Not verified"}
            </p>
          </div> */}
        </div>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <DialogFooter>
                <Button type="submit">Update</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
