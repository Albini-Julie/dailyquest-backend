// src/modules/module-proposedQuest/proposedQuestModel.ts
import { Schema, model, Document, Types } from 'mongoose';

export type ProposedQuestStatus = 'pending' | 'approved' | 'rejected';

export interface IProposedQuest extends Document {
  title: string;
  proofExample: string;
  author: Types.ObjectId;
  status: ProposedQuestStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date;
}

const proposedQuestSchema = new Schema<IProposedQuest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    proofExample: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

proposedQuestSchema.index(
  { reviewedAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 7,
    partialFilterExpression: {
      status: { $in: ['approved', 'rejected'] },
    },
  }
);

export const ProposedQuestModel = model<IProposedQuest>(
  'ProposedQuest',
  proposedQuestSchema
);
