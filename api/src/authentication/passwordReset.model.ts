import { Document, model, Schema } from 'mongoose';
import { PasswordReset } from './passwordReset.interface';

const passwordResetSchema = new Schema({
  userId: {
    ref: 'User',
    type: Schema.Types.ObjectId,
  },
  secret: { type: String, index: true },
  requestedAt: { type: Date },
  reRequestedAt: { type: Date },
});

passwordResetSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

export const PasswordResetModel = model<PasswordReset & Document>('PasswordReset', passwordResetSchema);
