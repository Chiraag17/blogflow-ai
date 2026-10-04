import { NextRequest, NextResponse } from 'next/server';
import { wordPressService } from '@/services/cms/wordpress-service';
import { ApiResponse, Blog } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { blog, config, status, scheduledDate } = await req.json();

    if (!blog || !config?.siteUrl) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Blog data and WordPress siteUrl are required' },
        { status: 400 }
      );
    }

    // Call WordPress service which enforces human approval validation
    const result = await wordPressService.publishArticle({
      blog,
      config,
      status: status || 'publish',
      scheduledDate,
    });

    if (!result.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: result.error || 'Publishing failed' },
        { status: 422 }
      );
    }

    return NextResponse.json<ApiResponse<typeof result>>({
      success: true,
      data: result,
      message:
        result.status === 'scheduled'
          ? 'Article scheduled successfully in WordPress'
          : 'Article published live successfully to WordPress',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Internal publishing error' },
      { status: 500 }
    );
  }
}
