import { NextRequest, NextResponse } from 'next/server';
import { blogGenerationService } from '@/services/content/blog-generation.service';
import { ApiResponse, BlogOutline } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.topic) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Topic is required for outline generation.' },
        { status: 400 }
      );
    }

    const outline = await blogGenerationService.generateOutline(
      body.topic,
      body.targetAudience || 'General Audience',
      body.tone || 'professional',
      body.researchSummary || ''
    );

    return NextResponse.json<ApiResponse<BlogOutline>>({
      success: true,
      data: outline,
      message: 'Structured blog outline generated.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Outline generation failed.' },
      { status: 500 }
    );
  }
}
