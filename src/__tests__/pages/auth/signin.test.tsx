/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import Login from "../../../pages/login";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  useSession: jest
    .fn()
    .mockReturnValue({ data: null, status: "unauthenticated" }),
}));

describe("Login Page", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (signIn as jest.Mock).mockReset();
    mockRouter.push.mockReset();
  });

  it("renders the login form", () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in$/i }),
    ).toBeInTheDocument();
  });

  it("handles Google sign-in", () => {
    render(<Login />);

    const googleButton = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    googleButton.click();

    expect(signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
      redirect: true,
    });
  });
});
