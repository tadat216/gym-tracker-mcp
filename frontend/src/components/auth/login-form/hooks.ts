import { useState } from "react";
import { useApiLoginApiAuthLoginPost } from "@/api/auth/auth";
import { useAuth } from "@/contexts/auth-context";

export function useLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const mutation = useApiLoginApiAuthLoginPost();

  const handleSubmit = () => {
    setError(null);
    mutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          login(data.access_token);
        },
        onError: () => {
          setError("Invalid username or password.");
        },
      }
    );
  };

  return {
    username,
    password,
    isLoading: mutation.isPending,
    error,
    onUsernameChange: setUsername,
    onPasswordChange: setPassword,
    onSubmit: handleSubmit,
  };
}
