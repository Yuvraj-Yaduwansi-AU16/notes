import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/router";

interface ErrorPageProps {
  message?: string;
  reset?: () => void;
}

export function ErrorPage({
  message = "Oops... something went wrong!",
  reset,
}: ErrorPageProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <AlertCircle className="text-destructive mx-auto h-12 w-12" />
        <h1 className="text-foreground mt-4 text-2xl font-semibold">
          {message}
        </h1>
        <p className="text-muted-foreground mt-2">
          Please try again or contact support if the problem persists.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          {reset && (
            <Button variant="outline" onClick={() => reset()}>
              Try again
            </Button>
          )}
          <Button onClick={() => void router.push("/")}>Go to Homepage</Button>
        </div>
      </div>
    </div>
  );
}
