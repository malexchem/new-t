import mongoose, { Document, Schema } from 'mongoose';

export interface IUserReadMessage extends Document {
  userId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  readAt: Date;
}

const userReadMessageSchema: Schema<IUserReadMessage> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'ChannelMessage',
    required: true,
    index: true,
  },
  readAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound unique index to prevent duplicate reads
userReadMessageSchema.index({ userId: 1, messageId: 1 }, { unique: true });

export const UserReadMessage = mongoose.models.UserReadMessage || 
  mongoose.model<IUserReadMessage>('UserReadMessage', userReadMessageSchema);