export interface User {
  username: string;
  password: string | undefined;
  email?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  initials: string;
  role: string;
  created: Date;
  updated: Date;
}
