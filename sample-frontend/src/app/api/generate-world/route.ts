import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { WORLD_GENERATION_PROMPT, buildWorldFromResponse } from '@/lib/world-generator';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: WORLD_GENERATION_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const world = buildWorldFromResponse(parsed, uuid());

    return NextResponse.json(world);
  } catch (error) {
    console.error('World generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate world' },
      { status: 500 }
    );
  }
}
