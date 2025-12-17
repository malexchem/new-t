import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { UserReadMessage } from '@/app/models/UserReadMessage';
import { User } from '@/app/models/User';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

// GET: Get all users with their latest messages and read status
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    // Get all users except current user
    const users = await User.find({ _id: { $ne: currentUser._id } })
      .select('-passcode')
      .sort({ isOnline: -1, lastSeen: -1, username: 1 })
      .lean();

    const responseData = [];

    for (const user of users) {
      // Get latest message from this user
      const latestMessage = await ChannelMessage.findOne({ senderId: user._id })
        .sort({ createdAt: -1 })
        .lean();

      if (latestMessage) {
        // Check if current user has read this message
        const hasRead = await UserReadMessage.exists({
          userId: currentUser._id,
          messageId: latestMessage._id,
        });

        // Count unread messages from this user
        const totalMessages = await ChannelMessage.countDocuments({ 
          senderId: user._id 
        });
        
        const readMessages = await UserReadMessage.countDocuments({
          userId: currentUser._id,
          messageId: {
            $in: await ChannelMessage.find({ senderId: user._id }).distinct('_id')
          }
        });

        const unreadCount = totalMessages - readMessages;

        responseData.push({
          user: {
            ...user,
            _id: user._id.toString(),
            lastSeen: user.lastSeen.toISOString(),
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString(),
          },
          latestMessage: {
            ...latestMessage,
            _id: latestMessage._id.toString(),
            senderId: latestMessage.senderId.toString(),
            likes: latestMessage.likes.map((id: { toString: () => any; }) => id.toString()),
            createdAt: latestMessage.createdAt.toISOString(),
            updatedAt: latestMessage.updatedAt.toISOString(),
            isLiked: latestMessage.likes.some((id: { toString: () => any; }) => id.toString() === currentUser._id.toString()),
            likeCount: latestMessage.likes.length,
            isRead: !!hasRead,
          },
          unreadCount,
          totalMessages,
        });
      } else {
        // User has no messages yet
        responseData.push({
          user: {
            ...user,
            _id: user._id.toString(),
            lastSeen: user.lastSeen.toISOString(),
            createdAt: user.createdAt?.toISOString(),
            updatedAt: user.updatedAt?.toISOString(),
          },
          latestMessage: null,
          unreadCount: 0,
          totalMessages: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error: any) {
    console.error('Get user latest messages error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch user messages',
      },
      { status: 500 }
    );
  }
}