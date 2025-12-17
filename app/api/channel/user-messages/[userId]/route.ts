import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { UserReadMessage } from '@/app/models/UserReadMessage';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

// GET: Get messages from a specific user
/*export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const senderId = params.userId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;*/
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }  // ← Promise
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { userId: senderId } = await params;        // ← unwrap here

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip  = (page - 1) * limit;


    // Get messages from specific user
    const messages = await ChannelMessage.find({ senderId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark messages as read for current user
    if (currentUser._id.toString() !== senderId) {
      const messageIds = messages.map(msg => msg._id);
      
      // Create read records for unread messages
      const existingReads = await UserReadMessage.find({
        userId: currentUser._id,
        messageId: { $in: messageIds },
      }).select('messageId');

      const existingReadIds = new Set(
        existingReads.map(er => er.messageId.toString())
      );

      const newReads = messages
        .filter(msg => !existingReadIds.has(msg._id.toString()))
        .map(msg => ({
          userId: currentUser._id,
          messageId: msg._id,
          readAt: new Date(),
        }));

      if (newReads.length > 0) {
        await UserReadMessage.insertMany(newReads);
      }
    }

    // Format response
    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      senderId: msg.senderId.toString(),
      likes: msg.likes.map((id: { toString: () => any; }) => id.toString()),
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      isLiked: msg.likes.some((id: { toString: () => any; }) => id.toString() === currentUser._id.toString()),
      isOwnMessage: msg.senderId.toString() === currentUser._id.toString(),
    }));

    // Get total count
    const total = await ChannelMessage.countDocuments({ senderId });
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
    console.error('Get user messages error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}