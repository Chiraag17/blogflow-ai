/**
 * HTTP Integration Test Script
 */
async function testRoutes() {
  const routes = [
    '/websites',
    '/research',
    '/generator',
    '/content/blog-1',
    '/approvals',
  ];

  console.log('Testing frontend pages:');
  for (const route of routes) {
    const res = await fetch(`http://localhost:3000${route}`);
    console.log(`  ${route} -> HTTP ${res.status}`);
  }

  console.log('\nTesting backend SEO analysis API:');
  const seoRes = await fetch('http://localhost:3000/api/ai/analyze-seo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Guide to Autonomous AI Pipelines',
      content: '# Guide to Autonomous AI Pipelines\n\n## Overview\nAutonomous AI pipelines enable high-speed publication.',
      focusKeyword: 'autonomous ai pipelines',
      metaTitle: 'Guide to Autonomous AI Pipelines (2025)',
      metaDescription: 'Explore how autonomous AI pipelines accelerate content publishing while keeping humans in the loop.',
    }),
  });
  const seoData = await seoRes.json();
  console.log(`  POST /api/ai/analyze-seo -> HTTP ${seoRes.status}, success: ${seoData.success}, SEO Score: ${seoData.data?.seoScore}%`);

  console.log('\nTesting backend outline generation API:');
  const outlineRes = await fetch('http://localhost:3000/api/ai/generate-outline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: 'Modern Web Development with Next.js',
      targetAudience: 'Software Developers',
      tone: 'technical',
    }),
  });
  const outlineData = await outlineRes.json();
  console.log(`  POST /api/ai/generate-outline -> HTTP ${outlineRes.status}, response received`);
}

testRoutes().catch(console.error);
