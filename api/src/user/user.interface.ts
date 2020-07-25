export interface User {
  username: string;
  password: string | undefined;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  sharedNotes?: string[];
  created: Date;
  updated: Date;
}
