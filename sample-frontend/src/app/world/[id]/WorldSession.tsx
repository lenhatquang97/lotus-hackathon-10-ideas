'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { v4 as uuid } from 'uuid';
import { TranscriptPanel } from '@/components/world/TranscriptPanel';
import { ConversationHUD } from '@/components/world/ConversationHUD';
import { useWorldStore } from '@/store/world-store';
import { useSessionStore } from '@/store/session-store';
import { connectRealtime, type RealtimeConnection } from '@/lib/realtime';
import type { AgentPersona } from '@/lib/types';

const Scene3D = dynamic(
  () => import('@/components/world/Scene3D').then(m => ({ default: m.Scene3D })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-ink)' }}><span className="meta text-white/50">Loading scene...</span></div> }
);

type SessionPhase = 'lobby' | 'active' | 'ending';

export function WorldSession() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const world = useWorldStore(s => s.getWorld(worldId));

  const {
    transcript, activeAgentId, sessionStartTime,
    isConnected, isSpeaking,
    startSession, endSession, setActiveAgent,
    addTranscriptEntry, setConnected, setSpeaking, saveSession,
  } = useSessionStore();

  const [phase, setPhase] = useState<SessionPhase>('lobby');
  const [evaluating, setEvaluating] = useState(false);
  const connectionRef = useRef<RealtimeConnection | null>(null);

  const activeAgent = world?.agents.find(a => a.id === activeAgentId) || world?.agents[0];

  const handleTranscript = useCallback((speaker: 'user' | 'agent', text: string, agentId: string, agentName: string) => {
    addTranscriptEntry({
      id: uuid(),
      speaker,
      agentId,
      agentName,
      text,
      timestamp: Date.now(),
    });
  }, [addTranscriptEntry]);

  const handleStart = async () => {
    if (!world) return;
    const firstAgent = world.agents[0];
    startSession(world.id, firstAgent.id);
    setPhase('active');

    try {
      const conn = await connectRealtime(
        firstAgent,
        world.scenarioContext,
        world.conversationBeats,
        handleTranscript,
        setConnected,
        setSpeaking,
      );
      connectionRef.current = conn;
    } catch (err) {
      console.error('Failed to connect:', err);
      setPhase('lobby');
    }
  };

  const handleSwitchAgent = (agent: AgentPersona) => {
    if (!world || agent.id === activeAgentId) return;
    setActiveAgent(agent.id);
    connectionRef.current?.switchAgent(agent, world.scenarioContext, world.conversationBeats);
  };

  const handleEndSession = async () => {
    setPhase('ending');
    setEvaluating(true);
    connectionRef.current?.disconnect();
    connectionRef.current = null;

    const currentTranscript = useSessionStore.getState().transcript;

    if (currentTranscript.length === 0) {
      endSession();
      router.push('/');
      return;
    }

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldTitle: world?.title,
          scenarioContext: world?.scenarioContext,
          cefrLevel: world?.cefrLevel,
          transcript: currentTranscript,
        }),
      });

      const evaluation = await res.json();
      const sessionId = uuid();

      saveSession({
        id: sessionId,
        worldId: worldId,
        worldTitle: world?.title || '',
        transcript: currentTranscript,
        duration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0,
        evaluation,
        completedAt: new Date().toISOString(),
      });

      endSession();
      router.push(`/debrief/${sessionId}`);
    } catch (err) {
      console.error('Evaluation failed:', err);
      endSession();
      router.push('/');
    }
  };

  useEffect(() => {
    return () => {
      connectionRef.current?.disconnect();
    };
  }, []);

  if (!world) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="text-center">
          <p className="font-display text-xl mb-4" style={{ color: 'var(--color-ink)' }}>World not found</p>
          <Link href="/" className="font-body text-[13px] underline underline-offset-4" style={{ color: 'var(--color-ink)' }}>
            Back to Worlds
          </Link>
        </div>
      </div>
    );
  }

  // LOBBY
  if (phase === 'lobby') {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
        <nav className="h-14 border-b border-[var(--color-fog)] px-12 max-md:px-6 flex items-center justify-between">
          <Link href="/" className="font-display italic text-xl" style={{ color: 'var(--color-ink)' }}>
            LotusHack
          </Link>
          <Link href="/" className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--color-ash)]" style={{ color: 'var(--color-ink)' }}>
            Back
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center p-12 max-md:p-6">
          <div className="max-w-[640px] w-full">
            {/* Meta row */}
            <div className="flex items-baseline justify-between mb-2">
              <span className="meta" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>
                {world.domain.toUpperCase()}
              </span>
              <span className="meta" style={{ fontSize: '10px' }}>
                {world.cefrLevel} &middot; {world.duration} MIN
              </span>
            </div>
            <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-fog)' }} />

            {/* Title */}
            <h1 className="font-display text-[40px] max-md:text-[32px] font-semibold leading-[1.15] mb-6" style={{ color: 'var(--color-ink)' }}>
              {world.title}
            </h1>

            {/* Scenario */}
            <div className="mb-8 p-5 border border-[var(--color-fog)] bg-[var(--color-surface)]">
              <h3 className="meta mb-2" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>Your Scenario</h3>
              <p className="font-body text-[14px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                {world.scenarioContext}
              </p>
            </div>

            {/* Agents */}
            <h3 className="meta mb-4" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>
              You&apos;ll be talking to
            </h3>
            <div className="space-y-px mb-10">
              {world.agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-4 py-4 px-5 bg-[var(--color-surface)] border border-[var(--color-fog)]">
                  <div className="w-9 h-9 flex items-center justify-center border border-[var(--color-fog)]"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ash)' }}>
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-[16px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {agent.name}
                      </span>
                      <span className="meta" style={{ fontSize: '9px', letterSpacing: '0.12em' }}>
                        {agent.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="meta mt-0.5" style={{ fontSize: '10px' }}>
                      {agent.nationality.toUpperCase()} {agent.profession.toUpperCase()} &middot; {agent.communicationStyle.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Drop In */}
            <button
              onClick={handleStart}
              className="w-full font-body text-[14px] uppercase tracking-[0.12em] py-4 bg-[var(--color-ink)] text-white transition-opacity duration-200 hover:opacity-85"
            >
              Drop In
            </button>
            <p className="meta text-center mt-3" style={{ fontSize: '10px' }}>
              Microphone required. Conversation starts immediately.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ENDING
  if (phase === 'ending') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-[var(--color-ink)] border-t-transparent mx-auto mb-4" />
          <p className="font-display text-xl italic mb-1" style={{ color: 'var(--color-ink)' }}>Analyzing your conversation...</p>
          <p className="meta" style={{ fontSize: '11px' }}>Your coach is reviewing your performance</p>
        </div>
      </div>
    );
  }

  // ACTIVE SESSION
  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* 3D Scene + HUD */}
      <div className="relative flex-1">
        <Scene3D
          environment={world.environment}
          agents={world.agents}
          activeAgentId={activeAgentId || world.agents[0].id}
          isSpeaking={isSpeaking}
        />
        <ConversationHUD
          agentName={activeAgent?.name || ''}
          agentRole={activeAgent?.role || ''}
          isConnected={isConnected}
          isSpeaking={isSpeaking}
          sessionStartTime={sessionStartTime}
        />

        {/* Agent switcher */}
        {world.agents.length > 1 && (
          <div className="absolute bottom-4 left-4 flex gap-px z-10">
            {world.agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleSwitchAgent(agent)}
                className="px-4 py-2 backdrop-blur-sm transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  backgroundColor: agent.id === activeAgentId ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.6)',
                  color: agent.id === activeAgentId ? 'var(--color-ink)' : 'rgba(255,255,255,0.8)',
                }}
              >
                {agent.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* End session button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleEndSession}
            disabled={evaluating}
            className="px-6 py-2 bg-white/90 backdrop-blur-sm transition-all duration-200 hover:bg-white disabled:opacity-40"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-ink)',
            }}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Transcript panel */}
      <div className="h-48 border-t border-[var(--color-fog)]" style={{ backgroundColor: 'var(--color-surface)' }}>
        <TranscriptPanel transcript={transcript} />
      </div>
    </div>
  );
}
