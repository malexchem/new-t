import mongoose, { Document, Schema } from 'mongoose';
import { UserReadMessage } from './UserReadMessage';

export interface IUser extends Document {
  username: string;
  firstName: string;
  lastName: string;
  passcode: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
  fullName: string;
}

const userSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  passcode: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for searching
userSchema.index({ username: 'text', firstName: 'text', lastName: 'text' });

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Remove passcode from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passcode;
  return obj;
};

// Add this method to the User model
userSchema.methods.getUnreadChannelMessages = async function(userId: string): Promise<number> {
  const unreadCount = await UserReadMessage.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    // We'll need to join with ChannelMessage to check messages from other users
  });
  return unreadCount;
};

// Check if model exists before creating to prevent OverwriteModelError
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);