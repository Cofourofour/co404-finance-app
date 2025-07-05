export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  location: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface UseAuthReturn {
  user: User | null;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string;
}