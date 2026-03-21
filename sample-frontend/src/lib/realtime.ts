import type { AgentPersona } from './types';

function buildAgentSystemPrompt(agent: AgentPersona, scenarioContext: string, conversationBeats: string[]): string {
  return `You are ${agent.name}, a ${agent.age}-year-old ${agent.nationality} ${agent.profession}.

PERSONALITY: ${agent.personality}

COMMUNICATION STYLE: ${agent.communicationStyle}
ACCENT: Speak naturally as someone with a ${agent.accent} accent would.

YOUR OPINIONS (hold these consistently):
${agent.opinionAnchors.map(o => `- ${o}`).join('\n')}

YOUR RELATIONSHIP TO THE LEARNER: You are their ${agent.relationshipToLearner}. Adjust your formality and tone accordingly.

SCENARIO: ${scenarioContext}

CONVERSATION ARC (follow this natural progression):
${conversationBeats.map((b, i) => `${i + 1}. ${b}`).join('\n')}

CRITICAL RULES:
- Stay in character at ALL times. You ARE ${agent.name}, not an AI.
- Never mention that you are an AI, a language learning tool, or that this is practice.
- Speak naturally with your accent patterns and communication style.
- React authentically to what the learner says — agree, disagree, ask follow-ups, show emotion.
- If the learner is quiet for too long, gently re-engage them ("What do you think?" / "I'd love to hear your take").
- Keep your responses conversational length (1-3 sentences typically). Don't monologue.
- Use vocabulary appropriate for the scenario. Don't simplify your language unnaturally.
- If the learner makes English mistakes, do NOT correct them. Just respond naturally to the content.
- Show your personality through your word choices, expressions, and reactions.`;
}

export interface RealtimeConnection {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  disconnect: () => void;
  switchAgent: (agent: AgentPersona, scenarioContext: string, conversationBeats: string[]) => void;
}

export async function connectRealtime(
  agent: AgentPersona,
  scenarioContext: string,
  conversationBeats: string[],
  onTranscript: (speaker: 'user' | 'agent', text: string, agentId: string, agentName: string) => void,
  onConnectionChange: (connected: boolean) => void,
  onSpeakingChange: (speaking: boolean) => void,
): Promise<RealtimeConnection> {
  // Get ephemeral token from our API
  const tokenRes = await fetch('/api/realtime-token', { method: 'POST' });
  if (!tokenRes.ok) throw new Error('Failed to get realtime token');
  const tokenData = await tokenRes.json();
  const ephemeralKey = tokenData.client_secret.value;

  // Create peer connection
  const pc = new RTCPeerConnection();

  // Set up audio element for AI output
  const audioEl = document.createElement('audio');
  audioEl.autoplay = true;
  pc.ontrack = (e) => {
    audioEl.srcObject = e.streams[0];
  };

  // Get user mic and add to peer connection
  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

  // Create data channel for events
  const dc = pc.createDataChannel('oai-events');

  const systemPrompt = buildAgentSystemPrompt(agent, scenarioContext, conversationBeats);

  dc.addEventListener('open', () => {
    onConnectionChange(true);
    // Configure session
    dc.send(JSON.stringify({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: systemPrompt,
        voice: 'sage',
        input_audio_transcription: { model: 'gpt-4o-mini-transcribe' },
        turn_detection: { type: 'server_vad', threshold: 0.5, silence_duration_ms: 800 },
      }
    }));
  });

  dc.addEventListener('message', (e) => {
    const event = JSON.parse(e.data);

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      if (event.transcript?.trim()) {
        onTranscript('user', event.transcript.trim(), agent.id, agent.name);
      }
    }

    if (event.type === 'response.audio_transcript.done') {
      if (event.transcript?.trim()) {
        onTranscript('agent', event.transcript.trim(), agent.id, agent.name);
      }
    }

    if (event.type === 'response.audio.delta') {
      onSpeakingChange(true);
    }

    if (event.type === 'response.audio.done') {
      onSpeakingChange(false);
    }
  });

  // Create and send SDP offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ephemeralKey}`,
      'Content-Type': 'application/sdp',
    },
    body: offer.sdp,
  });

  const answerSdp = await sdpRes.text();
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

  const disconnect = () => {
    dc.close();
    pc.close();
    ms.getTracks().forEach(t => t.stop());
    audioEl.remove();
    onConnectionChange(false);
  };

  const switchAgent = (newAgent: AgentPersona, ctx: string, beats: string[]) => {
    if (dc.readyState === 'open') {
      const newPrompt = buildAgentSystemPrompt(newAgent, ctx, beats);
      dc.send(JSON.stringify({
        type: 'session.update',
        session: { instructions: newPrompt }
      }));
    }
  };

  return { pc, dc, disconnect, switchAgent };
}
