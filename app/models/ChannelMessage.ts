import mongoose, { Document, Schema } from 'mongoose';

export interface IChannelMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderUsername: string;
  senderName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  likes: mongoose.Types.ObjectId[]; // Array of user IDs who liked
  createdAt: Date;
  updatedAt: Date;
}

const channelMessageSchema: Schema<IChannelMessage> = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  senderUsername: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'file', null],
    default: null,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
}, {
  timestamps: true,
});

// Compound index for efficient queries
channelMessageSchema.index({ senderId: 1, createdAt: -1 });
channelMessageSchema.index({ createdAt: -1 });

export const ChannelMessage = mongoose.models.ChannelMessage || 
  mongoose.model<IChannelMessage>('ChannelMessage', channelMessageSchema);