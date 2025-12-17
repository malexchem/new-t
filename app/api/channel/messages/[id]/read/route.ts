import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { UserReadMessage } from '@/app/models/UserReadMessage';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

/*export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const messageId = params.id;

    // Find the message
    const message = await ChannelMessage.findById(messageId);
    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Message not found',
        },
        { status: 404 }
      );
    }

    // Don't mark own messages as read
    if (message.senderId.toString() === currentUser._id.toString()) {
      return NextResponse.json({
        success: true,
        message: 'Own message not marked as read',
      });
    }

    // Mark as read (upsert to avoid duplicates)
    await UserReadMessage.findOneAndUpdate(
      {
        userId: currentUser._id,
        messageId: message._id,
      },
      {
        userId: currentUser._id,
        messageId: message._id,
        readAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });

  } catch (error: any) {
    console.error('Mark message read error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to mark message as read',
      },
      { status: 500 }
    );
  }
}*/

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ← Promise
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { id: messageId } = await params;        // ← unwrap here

    // Find the message
    const message = await ChannelMessage.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }

    // Don't mark own messages as read
    if (message.senderId.toString() === currentUser._id.toString()) {
      return NextResponse.json({
        success: true,
        message: 'Own message not marked as read',
      });
    }

    // Mark as read (upsert)
    await UserReadMessage.findOneAndUpdate(
      { userId: currentUser._id, messageId: message._id },
      { userId: currentUser._id, messageId: message._id, readAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });

  } catch (error: any) {
    console.error('Mark message read error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}