import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useLoginForm } from "./hooks";
import { LoginFormView } from "./views";

export function LoginFormContainer() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const props = useLoginForm();
  return <LoginFormView {...props} />;
}
