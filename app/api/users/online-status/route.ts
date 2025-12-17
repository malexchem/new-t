import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { User } from '@/app/models/User';
import { requireAuth } from '@/app/lib/auth';
import { OnlineStatusRequest, ApiResponse } from '@/app/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    
    await connectDB();
    
    const body: OnlineStatusRequest = await request.json();
    const { isOnline } = body;
    
    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { 
          success: false,
          message: 'isOnline must be a boolean' 
        },
        { status: 400 }
      );
    }
    
    // Update user's online status
    await User.findByIdAndUpdate(currentUser._id, {
      isOnline,
      lastSeen: new Date(),
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Online status updated' 
    });
    
  } catch (error: any) {
    console.error('Update online status error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Authentication required'
      },
      { status: 401 }
    );
  }
}