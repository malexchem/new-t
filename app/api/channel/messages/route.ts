import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { UserReadMessage } from '@/app/models/UserReadMessage';
import { requireAuth } from '@/app/lib/auth';
import { 
  ChannelMessageRequest, 
  ApiResponse,
  ChannelMessage as ChannelMessageType 
} from '@/app/lib/types';

// GET: Get channel messages (paginated)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get messages
    const messages = await ChannelMessage.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Check which messages current user has liked
    const messageIds = messages.map(msg => msg._id);
    const likedMessages = await UserReadMessage.find({
      userId: currentUser._id,
      messageId: { $in: messageIds },
    }).select('messageId');

    const likedMessageIds = new Set(
      likedMessages.map(lm => lm.messageId.toString())
    );

    // Get read counts for sender's own messages
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
    const formattedMessages: ChannelMessageType[] = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      likes: msg.likes.map((id: { toString: () => any; }) => id.toString()),
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      isLiked: likedMessageIds.has(msg._id.toString()),
      readCount: msg.senderId.toString() === currentUser._id.toString() 
        ? readCountMap.get(msg._id.toString()) || 0 
        : 0,
      isOwnMessage: msg.senderId.toString() === currentUser._id.toString(),
    }));

    // Get total count for pagination
    const total = await ChannelMessage.countDocuments();
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
    console.error('Get channel messages error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}

// POST: Create a new channel message
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const body: ChannelMessageRequest = await request.json();
    const { message, mediaUrl, mediaType } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Message is required',
        },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage = await ChannelMessage.create({
      senderId: currentUser._id,
      senderUsername: currentUser.username,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      message: message.trim(),
      mediaUrl,
      mediaType,
      likes: [],
    });

    // Format response
    const responseMessage: ChannelMessageType = {
      ...newMessage.toJSON(),
      _id: newMessage._id.toString(),
      senderId: newMessage.senderId.toString(),
      likes: [],
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString(),
      isLiked: false,
      readCount: 0,
      isOwnMessage: true,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseMessage,
        message: 'Message posted successfully',
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create channel message error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to post message',
      },
      { status: 500 }
    );
  }
}