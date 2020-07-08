import { Schema, model, Document } from 'mongoose';
import { User } from './user.interface';

const userSchema = new Schema({
  username: String,
  password: {
    type: String,
    get: (): undefined => undefined,
  },
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  created: Date,
  updated: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: {
    virtuals: true,
    getters: true,
  },
});

userSchema.virtual('fullName').get(function getFullName(this: User) {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'authorId',
});

const UserModel = model<User & Document>('User', userSchema);

export default UserModel;
