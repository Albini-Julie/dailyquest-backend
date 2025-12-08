import { Schema, model, Document, Types } from 'mongoose';

export type UserQuestStatus = 'initial' | 'in_progress' | 'submitted' | 'validated' | 'failed';

export interface IUserQuest extends Document {
  user: Types.ObjectId;
  quest: Types.ObjectId;
  questTitle: string;
  questDescription?: string;
  questPoints: number;
  status: UserQuestStatus;
  startDate: Date;
  endDate?: Date;
  proofImage: string; 
  validationCount: number;
  createdAt: Date;
  updatedAt: Date;
  changed: boolean;
}

const userQuestSchema = new Schema<IUserQuest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quest: { type: Schema.Types.ObjectId, ref: 'Quest', required: true },
    questTitle: { type: String, required: true },
    questDescription: { type: String },
    questPoints: { type: Number, required: true },
    status: { type: String, enum: ['initial', 'in_progress', 'submitted', 'validated', 'failed'], default: 'initial' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    proofImage: { type: String },
    validationCount: { type: Number, default: 0 },
    changed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserQuestModel = model<IUserQuest>('UserQuest', userQuestSchema);
