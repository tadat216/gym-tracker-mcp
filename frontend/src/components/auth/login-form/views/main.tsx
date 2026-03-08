import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginFormViewProps } from "../types";

export function LoginFormView({
  username,
  password,
  isLoading,
  error,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginFormViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Gym Tracker</h1>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}
