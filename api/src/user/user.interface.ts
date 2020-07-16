export interface User {
  _id: string;
  username: string;
  password: string | undefined;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  created: Date;
  updated: Date;
}
