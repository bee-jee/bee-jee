import { Schema, model, Document } from 'mongoose';
import { User } from './user.interface';

const userSchema = new Schema({
  username: {
    type: String,
    index: true,
  },
  password: {
    type: String,
    get: (): undefined => undefined,
  },
  email: {
    type: String,
    index: true,
  },
  firstName: String,
  lastName: String,
  role: String,
  secret: {
    type: String,
    default: '',
  },
  confirm: {
    type: Boolean,
    default: false,
  },
  lastConfirmSend: {
    type: Date,
    default: null,
  },
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

userSchema.virtual('initials').get(function getInitials(this: User) {
  const first = this.firstName[0] || '';
  const last = this.lastName[0] || '';
  return [first, last].map((value) => value.toUpperCase()).join('');
});

userSchema.virtual('sharedNotes', {
  ref: 'UserSharedNote',
  localField: '_id',
  foreignField: 'user',
});

userSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'author',
});

const UserModel = model<User & Document>('User', userSchema);

export default UserModel;
