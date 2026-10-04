import { NextRequest, NextResponse } from 'next/server';
import { blogGenerationService, GenerationStatusItem } from '@/services/content/blog-generation.service';
import { ApiResponse } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const status = blogGenerationService.getGenerationStatus(id);

    if (!status) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Generation job with id "${id}" not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<GenerationStatusItem>>({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Error fetching generation status.' },
      { status: 500 }
    );
  }
}
