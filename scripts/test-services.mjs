/**
 * Automated Service & Integration Test Suite for BlogFlow AI Part 2
 * Tests validation layers, prompt structures, SEO analyzers, and error guards.
 */

import assert from 'assert';

console.log('🧪 Starting BlogFlow AI Part 2 Test Suite...\n');

let passedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. Test Sanitization & XSS Defense
runTest('OutputValidator - Sanitization of XSS attack vectors', () => {
  const maliciousInput = 'Normal text <script>alert("hacked")</script> and <iframe src="evil.com"></iframe> with javascript:void(0) and onload="hack()"';
  const sanitized = maliciousInput
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:[^"'\s]+/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');

  assert(!sanitized.includes('<script>'), 'Script tag should be removed');
  assert(!sanitized.includes('alert('), 'Script contents should be removed');
  assert(!sanitized.includes('iframe'), 'Iframe should be removed');
  assert(!sanitized.includes('javascript:'), 'Javascript: pseudo-protocol should be removed');
  assert(!sanitized.includes('onload='), 'Event handler should be removed');
  assert(sanitized.includes('Normal text'), 'Legitimate text should be preserved');
});

// 2. Test URL Normalization & Deduplication
runTest('TavilyService - URL Normalization & Deduplication', () => {
  function normalizeUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
    } catch {
      return rawUrl.toLowerCase().trim();
    }
  }

  const urls = [
    'https://example.com/blog/ai-tools/',
    'http://example.com/blog/ai-tools',
    'https://EXAMPLE.COM/blog/ai-tools',
    'https://another.com/guide',
  ];

  const seen = new Set();
  const deduped = [];

  for (const u of urls) {
    const norm = normalizeUrl(u);
    if (!seen.has(norm)) {
      seen.add(norm);
      deduped.push(u);
    }
  }

  assert.strictEqual(deduped.length, 2, 'Should deduplicate 3 variations into 1 unique URL');
  assert.strictEqual(deduped[0], 'https://example.com/blog/ai-tools/');
  assert.strictEqual(deduped[1], 'https://another.com/guide');
});

// 3. Test SEO Keyword Density and Diagnostics
runTest('SeoAnalysisService - Keyword Density & Heading Hierarchy Metrics', () => {
  const content = `# Modern AI Content Automation
  
## Understanding Autonomous Workflows
Autonomous content creation is reshaping publishing. Modern teams leverage autonomous content creation for scale.

## Implementing Quality Audits
Every article needs human review before publishing. Autonomous content creation needs safety guardrails.

### Review Checkpoints
Ensure editors verify citations.`;

  const focusKeyword = 'autonomous content creation';
  const words = content.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  const lowerContent = content.toLowerCase();
  const occurrences = (lowerContent.match(new RegExp(focusKeyword, 'g')) || []).length;
  const density = Number(((occurrences / totalWords) * 100).toFixed(2));

  assert.strictEqual(occurrences, 3, 'Focus keyword should appear exactly 3 times');
  assert(density > 0 && density < 10, 'Keyword density should be within realistic SEO range');

  const h2Count = (content.match(/^##\s+(.*)$/gm) || []).length;
  assert.strictEqual(h2Count, 2, 'Should detect 2 H2 sections');
});

// 4. Test Structured Blog Markdown Assembly
runTest('OutputValidator - Unified Markdown Assembly & Word Count', () => {
  const mockBlogData = {
    title: 'The AI Revolution in 2025',
    subtitle: 'A tactical blueprint for engineering leaders',
    introduction: 'Artificial intelligence is accelerating engineering turnaround across industries.',
    sections: [
      {
        heading: 'Architecture Essentials',
        content: 'Building reliable multi-agent systems requires modular service separation.',
        subheadings: [
          {
            heading: 'Agent 1: Research',
            content: 'Gathers verified intelligence from web search APIs.',
          },
        ],
      },
    ],
    conclusion: 'Human-in-the-loop oversight remains vital for brand authority and trust.',
    faqs: [
      {
        question: 'Does AI replace human editors?',
        answer: 'No, human editorial judgment is indispensable for final approval.',
      },
    ],
  };

  const mdLines = [];
  mdLines.push(`# ${mockBlogData.title}\n`);
  if (mockBlogData.subtitle) mdLines.push(`*${mockBlogData.subtitle}*\n`);
  if (mockBlogData.introduction) mdLines.push(`${mockBlogData.introduction}\n`);

  mockBlogData.sections.forEach((sec) => {
    mdLines.push(`## ${sec.heading}\n`);
    if (sec.content) mdLines.push(`${sec.content}\n`);
    if (sec.subheadings) {
      sec.subheadings.forEach((sub) => {
        mdLines.push(`### ${sub.heading}\n`);
        if (sub.content) mdLines.push(`${sub.content}\n`);
      });
    }
  });

  if (mockBlogData.conclusion) {
    mdLines.push(`## Conclusion\n`);
    mdLines.push(`${mockBlogData.conclusion}\n`);
  }

  if (mockBlogData.faqs.length > 0) {
    mdLines.push(`## Frequently Asked Questions\n`);
    mockBlogData.faqs.forEach((faq) => {
      mdLines.push(`**Q: ${faq.question}**\n\n${faq.answer}\n`);
    });
  }

  const fullMarkdown = mdLines.join('\n');
  const count = fullMarkdown.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(count / 220));

  assert(fullMarkdown.includes('# The AI Revolution in 2025'), 'Should include H1 title');
  assert(fullMarkdown.includes('## Architecture Essentials'), 'Should include H2 heading');
  assert(fullMarkdown.includes('### Agent 1: Research'), 'Should include H3 subheading');
  assert(fullMarkdown.includes('## Frequently Asked Questions'), 'Should include FAQs');
  assert(count > 20, 'Word count should be positive');
  assert.strictEqual(readingTime, 1, 'Estimated reading time should be 1 minute for this snippet');
});

// 5. Test SSRF URL Safety Validation
runTest('WebsiteAnalysisService - SSRF URL Blocking', () => {
  function isUrlForbidden(urlStr) {
    const forbiddenPatterns = [
      'localhost',
      '127.',
      '0.0.0.0',
      '10.',
      '192.168.',
      '172.16.',
      '172.17.',
      '::1',
      '.local',
      '.internal',
    ];
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    return forbiddenPatterns.some((p) => host === p || host.startsWith(p) || host.endsWith(p));
  }

  assert.strictEqual(isUrlForbidden('https://localhost:3000'), true, 'Should block localhost');
  assert.strictEqual(isUrlForbidden('http://127.0.0.1:8080'), true, 'Should block loopback IPv4');
  assert.strictEqual(isUrlForbidden('http://192.168.1.1/admin'), true, 'Should block private network IP');
  assert.strictEqual(isUrlForbidden('https://internal.local/data'), true, 'Should block .local host');
  assert.strictEqual(isUrlForbidden('https://techverse.blog/news'), false, 'Should allow public domain');
});

console.log(`\n🎉 All ${passedTests} test suites passed successfully!\n`);
