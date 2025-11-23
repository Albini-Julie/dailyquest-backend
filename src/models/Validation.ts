import { Schema, model, Document, Types } from 'mongoose';

export interface IValidation extends Document {
  userQuest: Types.ObjectId;
  validator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const validationSchema = new Schema<IValidation>(
  {
    userQuest: { type: Schema.Types.ObjectId, ref: 'UserQuest', required: true },
    validator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ValidationModel = model<IValidation>('Validation', validationSchema);
