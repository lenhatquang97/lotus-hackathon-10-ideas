import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { EVALUATION_PROMPT, buildEvaluationContext } from '@/lib/evaluator';

export async function POST(req: NextRequest) {
  try {
    const { worldTitle, scenarioContext, cefrLevel, transcript } = await req.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const context = buildEvaluationContext(worldTitle, scenarioContext, cefrLevel, transcript);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EVALUATION_PROMPT },
        { role: 'user', content: context },
      ],
      temperature: 0.6,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No evaluation response' }, { status: 500 });
    }

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const evaluation = JSON.parse(cleaned);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate session' },
      { status: 500 }
    );
  }
}
