import { Schema, model, Document, Types } from 'mongoose';

export interface ICommunityMessage extends Document {
  userQuest: Types.ObjectId;  
  author: Types.ObjectId;     
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityMessageSchema = new Schema<ICommunityMessage>(
  {
    userQuest: { type: Schema.Types.ObjectId, ref: 'UserQuest', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String },
  },
  { timestamps: true }
);

export const CommunityMessageModel = model<ICommunityMessage>('CommunityMessage', communityMessageSchema);
