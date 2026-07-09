export interface IUser {
  id?: string;
  name: string;
  email: string;
  phone_number: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}