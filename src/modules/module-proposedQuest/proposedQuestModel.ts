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
  },
  { timestamps: true }
);

export const ProposedQuestModel = model<IProposedQuest>(
  'ProposedQuest',
  proposedQuestSchema
);
