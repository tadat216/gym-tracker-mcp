export interface LoginFormViewProps {
  username: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}
