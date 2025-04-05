import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" }); // Call API to clear session
      await signOut({ callbackUrl: "/" }); // Redirect to home after sign out
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  // console.log("🔹 Session:", session);

  return (
    <header className="w-full bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-gray-700"
            >
              Project Manager
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/tasks/assigned"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  router.pathname === "/tasks/assigned"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Tasks
              </Link>
              {session && (
                <Link
                  href="/project/create"
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    router.pathname === "/project/create"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Add Project
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <span className="cursor-pointer text-sm text-gray-700">
                    {session.user?.name ?? "Profile"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
