import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"](.*)['"]$/, '$1');
    envVars[match[1]] = value;
  }
});

const geminiKey = envVars.GEMINI_API_KEY;
const tavilyKey = envVars.TAVILY_API_KEY;
const geminiModel = envVars.GEMINI_MODEL || 'gemini-2.5-flash';

console.log('Testing live API connections...\n');

// 1. Test Tavily API
async function testTavily() {
  process.stdout.write('1. Connecting to Tavily Search API... ');
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: 'Next.js 15 features',
        max_results: 2,
        search_depth: 'basic'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.log('❌ FAILED (HTTP ' + res.status + ')');
      console.log('   Error details:', err);
      return false;
    }

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      console.log('✅ SUCCESS! Received ' + data.results.length + ' real search results.');
      console.log('   Top source: "' + data.results[0].title + '"');
      return true;
    } else {
      console.log('⚠️ Response received but 0 results found.');
      return false;
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    return false;
  }
}

// 2. Test Gemini API
async function testGemini() {
  process.stdout.write('2. Connecting to Google Gemini API (' + geminiModel + ')... ');
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: 'Respond with exactly the text: "BLOGFLOW_GEMINI_ONLINE"'
    });

    const reply = response.text ? response.text.trim() : '';
    if (reply.includes('BLOGFLOW_GEMINI_ONLINE')) {
      console.log('✅ SUCCESS! Gemini responded correctly.');
      return true;
    } else {
      console.log('✅ SUCCESS! Gemini responded: ' + reply.slice(0, 60));
      return true;
    }
  } catch (err) {
    console.log('❌ FAILED: ' + err.message);
    return false;
  }
}

async function run() {
  const tavilyOk = await testTavily();
  const geminiOk = await testGemini();

  console.log('\n--- Summary ---');
  console.log('Tavily Search API:', tavilyOk ? '🟢 ONLINE & ACTIVE' : '🔴 FAILED');
  console.log('Google Gemini API:', geminiOk ? '🟢 ONLINE & ACTIVE' : '🔴 FAILED');
}

run();
