import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/eden/login")({
  component: () => <Navigate to="/login" />,
});
