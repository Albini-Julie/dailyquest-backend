import { Schema, model, Document, Types } from 'mongoose';

export interface IQuest extends Document {
  title: string;
  description?: string;
  points: number;
  creator: Types.ObjectId;
  isReported: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questSchema = new Schema<IQuest>(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      required: [true, 'Le nombre de points est requis'],
      min: [1, 'La quête doit avoir au moins 1 point'],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const QuestModel = model<IQuest>('Quest', questSchema);
