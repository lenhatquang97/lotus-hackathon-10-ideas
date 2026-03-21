import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { WORLD_GENERATION_PROMPT, buildWorldFromResponse, buildExtendedPrompt, DIFFICULTY_TO_CEFR } from '@/lib/world-generator';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both old { prompt } and new { brief, knowledgeItems, difficulty } shapes
    let systemPrompt = WORLD_GENERATION_PROMPT;
    let userMessage: string;

    if (body.brief) {
      const extended = buildExtendedPrompt(
        body.brief,
        body.knowledgeItems || [],
        body.difficulty || 'intermediate'
      );
      systemPrompt = extended.systemPrompt;
      userMessage = extended.userMessage;
    } else if (body.prompt) {
      userMessage = body.prompt;
      // If difficulty is passed alongside old prompt shape, adjust CEFR
      if (body.difficulty && DIFFICULTY_TO_CEFR[body.difficulty as keyof typeof DIFFICULTY_TO_CEFR]) {
        systemPrompt += `\n\nIMPORTANT: Target CEFR level ${DIFFICULTY_TO_CEFR[body.difficulty as keyof typeof DIFFICULTY_TO_CEFR]} for this world.`;
      }
    } else {
      return NextResponse.json({ error: 'Prompt or brief is required' }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
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
