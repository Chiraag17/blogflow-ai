import { NextRequest, NextResponse } from 'next/server';
import { contentRevisionService } from '@/services/content/content-revision.service';
import { ApiResponse, ContentRevisionResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.selectedText) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Target text to revise is required.' },
        { status: 400 }
      );
    }

    const revision = await contentRevisionService.reviseContent({
      action: body.action || 'rewrite_paragraph',
      selectedText: body.selectedText,
      fullContent: body.fullContent,
      targetTone: body.targetTone,
      customInstructions: body.customInstructions,
    });

    return NextResponse.json<ApiResponse<ContentRevisionResponse>>({
      success: true,
      data: revision,
      message: 'Content revision generated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Content revision failed.' },
      { status: 500 }
    );
  }
}
