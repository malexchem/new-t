import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { UserReadMessage } from '@/app/models/UserReadMessage';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

// GET: Get current user's own messages (for MyChannelScreen)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get current user's messages only
    const messages = await ChannelMessage.find({ senderId: currentUser._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get read counts for these messages
    const messageIds = messages.map(msg => msg._id);
    const readCounts = await UserReadMessage.aggregate([
      {
        $match: {
          messageId: { $in: messageIds }
        }
      },
      {
        $group: {
          _id: '$messageId',
          count: { $sum: 1 }
        }
      }
    ]);

    const readCountMap = new Map(
      readCounts.map(rc => [rc._id.toString(), rc.count])
    );

    // Format response
    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      likes: msg.likes.map((id: { toString: () => any; }) => id.toString()),
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      isLiked: false, // User can't like their own messages
      readCount: readCountMap.get(msg._id.toString()) || 0,
      isOwnMessage: true,
    }));

    // Get total count for pagination
    const total = await ChannelMessage.countDocuments({ senderId: currentUser._id });
    const hasMore = page * limit < total;

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          page,
          limit,
          total,
          hasMore,
        },
      },
    });

  } catch (error: any) {
    console.error('Get my messages error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}