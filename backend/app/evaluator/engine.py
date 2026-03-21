import json
from openai import AsyncOpenAI
from app.core.config import settings

_client = None


def get_client():
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


class EvaluationEngine:
    async def score_turn(
        self, learner_text: str, history: list, prev_scores: dict
    ) -> dict:
        words = learner_text.split()
        word_count = len(words)
        unique_ratio = len(set(w.lower() for w in words)) / max(word_count, 1)

        content = min(
            1.0, (min(word_count, 50) / 50) * 0.6 + unique_ratio * 0.4
        )
        has_question = "?" in learner_text
        first_voice = min(
            1.0,
            0.5
            + (0.3 if has_question else 0.0)
            + (0.2 if word_count > 15 else 0.0),
        )
        tone = prev_scores.get("tone", 0.5) * 0.8 + 0.6 * 0.2

        return {
            "tone": round(min(1.0, max(0.0, tone)), 3),
            "content": round(min(1.0, max(0.0, content)), 3),
            "first_voice": round(min(1.0, max(0.0, first_voice)), 3),
        }

    async def compute_final_evaluation(
        self, transcript: list, topic: dict
    ) -> dict:
        learner_turns = [
            t for t in transcript if t.get("speaker") == "learner"
        ]
        if not learner_turns:
            return self._empty_evaluation()

        full_text = " ".join(t.get("text", "") for t in learner_turns)
        all_words = full_text.split()

        total_turns = len(transcript)
        learner_turn_count = len(learner_turns)
        speaking_ratio = learner_turn_count / max(total_turns, 1)

        transcript_text = "\n".join(
            f"{t.get('character_name', 'Learner')}: {t.get('text', '')}"
            for t in transcript[:30]
        )
        topic_title = topic.get("title", "English Conversation")
        domain = topic.get("domain_knowledge", "")[:500]

        prompt = f"""You are an English language coach evaluating a learner's conversation performance.

Topic: {topic_title}
Context: {domain}

Transcript:
{transcript_text}

Evaluate the learner. Respond in JSON:
{{
  "tone_score": 0.0-1.0,
  "content_score": 0.0-1.0,
  "first_voice_score": 0.0-1.0,
  "formality_calibration": 0.0-1.0,
  "assertiveness": 0.0-1.0,
  "emotional_congruence": 0.0-1.0,
  "topical_relevance": 0.0-1.0,
  "logical_coherence": 0.0-1.0,
  "vocabulary_range": 0.0-1.0,
  "grammar_fluency_index": 0.0-1.0,
  "question_quality": 0.0-1.0,
  "highlight_reel": [
    {{"turn_id": "placeholder", "label": "Strong point label", "coach_note": "Explanation..."}}
  ],
  "vocabulary_log": [
    {{"word": "example", "used_correctly": true, "context": "sentence context"}}
  ],
  "coach_narrative": "Two paragraph coaching summary highlighting strengths and areas for improvement."
}}"""

        try:
            client = get_client()
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=1500,
            )
            data = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Evaluation LLM error: {e}")
            data = {}

        tone_score = data.get("tone_score", 0.5)
        content_score = data.get("content_score", 0.5)
        fv_score = data.get("first_voice_score", 0.5)
        composite = round(
            tone_score * 0.33 + content_score * 0.33 + fv_score * 0.34, 3
        )

        return {
            "composite_score": composite,
            "tone": {
                "score": tone_score,
                "formality_calibration": data.get("formality_calibration", 0.5),
                "assertiveness": data.get("assertiveness", 0.5),
                "emotional_congruence": data.get("emotional_congruence", 0.5),
            },
            "content": {
                "score": content_score,
                "topical_relevance": data.get("topical_relevance", 0.5),
                "logical_coherence": data.get("logical_coherence", 0.5),
                "vocabulary_range": data.get("vocabulary_range", 0.5),
                "grammar_fluency_index": data.get("grammar_fluency_index", 0.5),
            },
            "first_voice": {
                "score": fv_score,
                "speaking_time_ratio": round(speaking_ratio, 3),
                "turn_initiation_count": learner_turn_count,
                "question_quality": data.get("question_quality", 0.5),
                "interruption_events": 0,
            },
            "highlight_reel": data.get("highlight_reel", []),
            "vocabulary_log": data.get("vocabulary_log", []),
            "recommended_topic_ids": [],
            "coach_narrative": data.get(
                "coach_narrative", "Great effort! Keep practicing."
            ),
        }

    def _empty_evaluation(self) -> dict:
        return {
            "composite_score": 0.0,
            "tone": {
                "score": 0.0,
                "formality_calibration": 0.0,
                "assertiveness": 0.0,
                "emotional_congruence": 0.0,
            },
            "content": {
                "score": 0.0,
                "topical_relevance": 0.0,
                "logical_coherence": 0.0,
                "vocabulary_range": 0.0,
                "grammar_fluency_index": 0.0,
            },
            "first_voice": {
                "score": 0.0,
                "speaking_time_ratio": 0.0,
                "turn_initiation_count": 0,
                "question_quality": 0.0,
                "interruption_events": 0,
            },
            "highlight_reel": [],
            "vocabulary_log": [],
            "recommended_topic_ids": [],
            "coach_narrative": "No conversation recorded.",
        }
