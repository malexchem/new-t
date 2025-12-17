export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  passcode: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest {
  username: string;
  firstName?: string;
  lastName?: string;
  passcode: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface OnlineStatusRequest {
  isOnline: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

// Add to existing types

export interface ChannelMessage {
  _id: string;
  senderId: string;
  senderUsername: string;
  senderName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean; // Client-side only
  readCount?: number; // For sender to see how many people read
}

export interface ChannelMessageRequest {
  message: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface LikeRequest {
  messageId: string;
  like: boolean; // true to like, false to unlike
}

export interface MarkReadRequest {
  messageId: string;
}