/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "~/lib/supabase";

export default function VerifyEmail() {
  const { data: session } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          setError("Invalid verification link");
          setIsVerifying(false);
          return;
        }

        // Verify the email using Supabase
        const {
          data: { user },
          error: verifyError,
        } = await supabase.auth.verifyOtp({
          token_hash: accessToken,
          type: "email",
        });

        if (verifyError) {
          console.error("Verification error:", verifyError);
          setDebugInfo(JSON.stringify(verifyError, null, 2));
          setError("Failed to verify email. Please try again.");
          setIsVerifying(false);
          return;
        }

        if (!user) {
          setError("Failed to verify email.");
          setIsVerifying(false);
          return;
        }

        setUserEmail(user.email ?? null);

        // Check if the user exists in the Prisma users table
        const { data: userData, error: userFetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userFetchError) {
          console.log(
            "User does not exist in Prisma. Fetching from auth.users...",
          );

          // Fetch additional details from auth.users
          const { data: authUserData, error: authUserError } = await supabase
            .from("auth.users")
            .select("id, email, created_at, raw_user_meta_data")
            .eq("id", user.id)
            .single();

          if (authUserError) {
            console.error("Error fetching from auth.users:", authUserError);
            setError("Error retrieving user details.");
            setIsVerifying(false);
            return;
          }

          // Insert user into Prisma users table
          const { error: insertError } = await supabase.from("users").insert([
            {
              id: authUserData.id,
              email: authUserData.email,
              name: authUserData.raw_user_meta_data?.name ?? "User",
              emailVerified: new Date().toISOString(), // Set email as verified
            },
          ]);

          if (insertError) {
            console.error("Error inserting user into Prisma:", insertError);
            setError("Failed to create user account.");
            setIsVerifying(false);
            return;
          }
        }

        // Email is verified
        setIsVerified(true);
        setIsVerifying(false);
      } catch (err) {
        console.error("Verification error:", err);
        setError("Failed to verify email.");
        setIsVerifying(false);
      }
    };

    // Only run if we have a hash in the URL
    if (window.location.hash) {
      void handleVerification();
    } else {
      setError("Invalid verification link");
      setIsVerifying(false);
    }
  }, []);

  // Redirect if already logged in
  if (session) {
    void router.push("/");
    return null;
  }

  return (
    <>
      <Head>
        <title>Verify Email - Task Manager</title>
        <meta name="description" content="Verify your email address" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="w-full max-w-md space-y-8 rounded-lg bg-white/10 p-8 shadow-2xl">
            <div>
              <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                {isVerifying
                  ? "Verifying your email..."
                  : isVerified
                    ? "Email Verified!"
                    : "Email Verification"}
              </h2>

              {error && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                  {debugInfo && (
                    <details className="mt-2 text-xs text-gray-400">
                      <summary>Debug Information</summary>
                      <pre className="mt-1 overflow-auto rounded bg-black/20 p-2 text-left">
                        {debugInfo}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {isVerified && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-green-400">
                    Your email {userEmail ? `(${userEmail})` : ""} has been
                    successfully verified!
                  </p>
                  <p className="mt-2 text-sm text-gray-300">
                    You can now sign in to your account.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Go to Login
                    </Link>
                  </div>
                </div>
              )}

              {!error && !isVerified && !isVerifying && (
                <p className="mt-2 text-center text-sm text-gray-300">
                  Please check your email for the verification link.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
