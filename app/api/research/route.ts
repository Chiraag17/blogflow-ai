import { NextRequest, NextResponse } from 'next/server';
import { tavilyService } from '@/services/research/tavily-service';
import { ApiResponse, ResearchTopic } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.topic) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Research topic is required' },
        { status: 400 }
      );
    }

    const results = await tavilyService.conductResearch({
      topic: body.topic,
      category: body.category || 'General',
      targetAudience: body.targetAudience,
      keywords: body.keywords,
    });

    return NextResponse.json<ApiResponse<typeof results>>({
      success: true,
      data: results,
      message: 'Research topics and citations extracted successfully',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Internal research error' },
      { status: 500 }
    );
  }
}
