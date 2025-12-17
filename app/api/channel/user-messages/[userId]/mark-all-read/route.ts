import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { UserReadMessage } from '@/app/models/UserReadMessage';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

// POST: Mark all messages from a user as read
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const senderId = params.userId;

    // Get all unread messages from this user
    const unreadMessages = await ChannelMessage.find({
      senderId,
      _id: {
        $nin: await UserReadMessage.find({
          userId: currentUser._id,
        }).distinct('messageId')
      }
    }).select('_id');

    if (unreadMessages.length > 0) {
      // Create read records for all unread messages
      const readRecords = unreadMessages.map(message => ({
        userId: currentUser._id,
        messageId: message._id,
        readAt: new Date(),
      }));

      await UserReadMessage.insertMany(readRecords);
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${unreadMessages.length} messages as read`,
    });

  } catch (error: any) {
    console.error('Mark all messages read error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to mark messages as read',
      },
      { status: 500 }
    );
  }
}