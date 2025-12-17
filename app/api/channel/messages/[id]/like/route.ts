import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { ChannelMessage } from '@/app/models/ChannelMessage';
import { requireAuth } from '@/app/lib/auth';
import { LikeRequest, ApiResponse } from '@/app/lib/types';

/*export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const messageId = params.id;
    const body: LikeRequest = await request.json();
    const { like } = body;*/
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ← note Promise<>
): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    await connectDB();

    const { id: messageId } = await params;        // ← unwrap here
    const body: LikeRequest = await request.json();
    const { like } = body;    

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

    if (like) {
      // Like the message
      if (!message.likes.includes(currentUser._id)) {
        message.likes.push(currentUser._id);
        await message.save();
      }
    } else {
      // Unlike the message
      message.likes = message.likes.filter(
        (id: { toString: () => any; }) => id.toString() !== currentUser._id.toString()
      );
      await message.save();
    }

    return NextResponse.json({
      success: true,
      message: like ? 'Message liked' : 'Message unliked',
      data: {
        likes: message.likes.map((id: { toString: () => any; }) => id.toString()),
        likeCount: message.likes.length,
      },
    });

  } catch (error: any) {
    console.error('Like message error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update like',
      },
      { status: 500 }
    );
  }
}