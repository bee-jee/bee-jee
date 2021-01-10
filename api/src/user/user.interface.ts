export interface User {
  username: string;
  password: string | undefined;
  email?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  initials?: string;
  role: string;
  secret?: string;
  confirm?: boolean;
  lastConfirmSend?: Date | null;
  created: Date;
  updated: Date;
}
