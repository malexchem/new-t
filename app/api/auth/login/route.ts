import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { User } from '@/app/models/User';
import { generateToken } from '@/app/lib/auth';
import { AuthRequest, AuthResponse, ApiResponse } from '@/app/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    await connectDB();
    
    const body: AuthRequest = await request.json();
    const { username, passcode } = body;
    
    // Validate input
    if (!username || !passcode) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Username and passcode are required' 
        },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findOne({ 
      username: username.toLowerCase().trim() 
    });
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }
    
    // Check passcode (plain text comparison per requirement)
    if (user.passcode !== passcode) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }
    
    // Update last seen and online status
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();
    
    // Generate token
    const token = generateToken(user._id.toString());
    
    return NextResponse.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
      }
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Server error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}