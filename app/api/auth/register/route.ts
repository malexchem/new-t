import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import { User } from '@/app/models/User';
import { generateToken } from '@/app/lib/auth';
import { AuthRequest, AuthResponse, ApiResponse } from '@/app/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    await connectDB();
    
    const body: AuthRequest = await request.json();
    const { username, firstName, lastName, passcode } = body;
    
    // Validate input
    if (!username || !firstName || !lastName || !passcode) {
      return NextResponse.json(
        { 
          success: false,
          message: 'All fields are required' 
        },
        { status: 400 }
      );
    }
    
    // Validate passcode
    if (passcode.length !== 4 || !/^\d+$/.test(passcode)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Passcode must be 4 digits' 
        },
        { status: 400 }
      );
    }
    
    // Validate username
    if (username.length < 3) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Username must be at least 3 characters' 
        },
        { status: 400 }
      );
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Username already taken' 
        },
        { status: 409 }
      );
    }
    
    // Create user (passcode stored as plain text per requirement)
    const user = await User.create({
      username: username.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      passcode,
      isOnline: true,
      lastSeen: new Date(),
    });
    
    // Generate token
    const token = generateToken(user._id.toString());
    
    return NextResponse.json(
      {
        success: true,
        data: {
          user: user.toJSON(),
          token,
        }
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Registration error:', error);
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