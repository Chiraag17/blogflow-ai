import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/ai/gemini-service';
import { BlogGenerationFormData, ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: BlogGenerationFormData = await req.json();

    if (!body.topic || !body.websiteId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Topic and websiteId are required fields' },
        { status: 400 }
      );
    }

    const generated = await geminiService.generateBlog(body);

    return NextResponse.json<ApiResponse<typeof generated>>({
      success: true,
      data: generated,
      message: 'Article successfully drafted with Gemini AI',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Internal generation error' },
      { status: 500 }
    );
  }
}
