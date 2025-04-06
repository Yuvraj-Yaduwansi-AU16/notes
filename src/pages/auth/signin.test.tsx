import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import Login from "../../pages/login";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

describe("Login Page", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    (signIn as jest.Mock).mockReset();
    mockRouter.push.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the login form with all elements", () => {
    render(<Login />);

    // Check if all form elements are present
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in with google/i)).toBeInTheDocument();
  });

  it("shows loading state during form submission", async () => {
    (signIn as jest.Mock).mockImplementation(
      () =>
        new Promise(() => {
          // Empty promise to simulate loading state
        }),
    );

    render(<Login />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /sign in$/i });
    fireEvent.click(submitButton);

    // Check loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("shows error message for invalid credentials", async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({
      error: "Invalid email or password",
    });

    render(<Login />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /sign in$/i });
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText(/invalid email or password/i),
      ).toBeInTheDocument();
    });
  });

  it("redirects to home page after successful login", async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(<Login />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /sign in$/i });
    fireEvent.click(submitButton);

    // Wait for redirect
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });

  it("handles Google sign-in", async () => {
    render(<Login />);

    // Click Google sign-in button
    const googleButton = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    fireEvent.click(googleButton);

    // Check if Google sign-in was called
    expect(signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
      redirect: true,
    });
  });
});
