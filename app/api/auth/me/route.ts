import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { ApiResponse } from '@/app/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth(request);
    
    return NextResponse.json({
      success: true,
      data: user.toJSON(),
    });
    
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Authentication required'
      },
      { status: 401 }
    );
  }
}