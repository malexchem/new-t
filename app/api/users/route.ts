import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { User } from '@/app/models/User';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const currentUser = await requireAuth(request);
    
    await connectDB();
    
    // Get all users except current user, sorted by online status then last seen
    const users = await User.find({ _id: { $ne: currentUser._id } })
      .select('-passcode')
      .sort({ isOnline: -1, lastSeen: -1, username: 1 });
    
    return NextResponse.json({
      success: true,
      data: users,
    });
    
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Authentication required'
      },
      { status: 401 }
    );
  }
}