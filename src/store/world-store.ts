'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { World } from '@/lib/types';

interface WorldStore {
  worlds: World[];
  addWorld: (world: World) => void;
  removeWorld: (id: string) => void;
  getWorld: (id: string) => World | undefined;
}

const SEED_WORLDS: World[] = [
  {
    id: 'seed-1',
    title: 'Tech Startup Stand-up Meeting',
    description: 'Join a morning stand-up at a fast-paced tech startup. Your team is discussing a missed deadline and you need to explain your progress while handling pushback from the project lead.',
    cefrLevel: 'B2',
    domain: 'professional',
    duration: 10,
    environment: 'office',
    scenarioContext: 'You are a software developer at a tech startup in Singapore. The morning stand-up is happening and the project lead is not happy about a missed sprint deadline.',
    conversationBeats: [
      'Team greets each other and starts the stand-up',
      'Project lead asks for status updates',
      'Tension rises about the missed deadline',
      'Team discusses solutions and next steps',
      'Meeting wraps up with action items'
    ],
    agents: [
      {
        id: 'agent-1a',
        name: 'Rachel Chen',
        role: 'anchor',
        age: 34,
        nationality: 'Singaporean',
        profession: 'Project Lead',
        communicationStyle: 'formal',
        accent: 'Singaporean English',
        personality: 'Direct, results-oriented, fair but demanding. Expects clear communication and accountability.',
        opinionAnchors: ['Deadlines must be respected', 'Communication gaps cause most project failures', 'Every team member should own their deliverables'],
        relationshipToLearner: 'authority'
      },
      {
        id: 'agent-1b',
        name: 'Tom Bradley',
        role: 'challenger',
        age: 28,
        nationality: 'Australian',
        profession: 'Senior Developer',
        communicationStyle: 'casual',
        accent: 'Australian English',
        personality: 'Laid-back but technically sharp. Tends to challenge ideas with humor. Sometimes dismissive of process.',
        opinionAnchors: ['Process slows things down', 'Technical debt is the real problem', 'Stand-ups are mostly a waste of time'],
        relationshipToLearner: 'peer'
      },
      {
        id: 'agent-1c',
        name: 'Priya Sharma',
        role: 'observer',
        age: 31,
        nationality: 'Indian',
        profession: 'QA Engineer',
        communicationStyle: 'empathetic',
        accent: 'Indian English',
        personality: 'Observant, supportive, asks good clarifying questions. Bridges tensions between team members.',
        opinionAnchors: ['Quality takes time', 'Team morale matters as much as velocity', 'Testing should not be an afterthought'],
        relationshipToLearner: 'peer'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'seed-2',
    title: 'Coffee Shop Small Talk',
    description: 'Strike up a conversation with a friendly barista and a regular customer at a cozy neighborhood café. Practice casual conversation, ordering, and spontaneous social interaction.',
    cefrLevel: 'B1',
    domain: 'social',
    duration: 8,
    environment: 'cafe',
    scenarioContext: 'You just moved to a new neighborhood and decided to try the local café. The barista is chatty and a regular customer strikes up a conversation with you.',
    conversationBeats: [
      'You approach the counter and the barista greets you',
      'Small talk about the neighborhood while ordering',
      'A regular customer joins the conversation',
      'Discussion about local recommendations and your background',
      'Friendly goodbye and invitation to come back'
    ],
    agents: [
      {
        id: 'agent-2a',
        name: 'Jake Morrison',
        role: 'anchor',
        age: 26,
        nationality: 'American',
        profession: 'Barista / Art Student',
        communicationStyle: 'casual',
        accent: 'American English',
        personality: 'Warm, enthusiastic, uses lots of slang and informal expressions. Genuinely curious about people.',
        opinionAnchors: ['This neighborhood is the best in the city', 'Everyone should try the oat milk latte', 'Art is more important than corporate careers'],
        relationshipToLearner: 'stranger'
      },
      {
        id: 'agent-2b',
        name: 'Margaret Wilson',
        role: 'observer',
        age: 62,
        nationality: 'British',
        profession: 'Retired Teacher',
        communicationStyle: 'empathetic',
        accent: 'British RP',
        personality: 'Kind, slightly nosy, loves giving advice. Speaks in complete, well-formed sentences. Has lived in the neighborhood for 30 years.',
        opinionAnchors: ['The neighborhood has changed so much', 'Young people today are more adventurous', 'A good cup of tea is better than coffee'],
        relationshipToLearner: 'stranger'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'seed-3',
    title: 'Job Interview: Marketing Manager',
    description: 'Face a challenging job interview for a Marketing Manager position at a global company. Handle behavioral questions, present your experience, and negotiate expectations.',
    cefrLevel: 'B2',
    domain: 'professional',
    duration: 15,
    environment: 'interview',
    scenarioContext: 'You are interviewing for a Marketing Manager position at a global consumer goods company. The interview panel consists of the HR Director and the VP of Marketing.',
    conversationBeats: [
      'Welcome and introductions',
      'Background and experience questions',
      'Behavioral scenario questions (handling conflict, leading teams)',
      'Your questions about the role and company',
      'Closing and next steps discussion'
    ],
    agents: [
      {
        id: 'agent-3a',
        name: 'Sarah Mitchell',
        role: 'anchor',
        age: 42,
        nationality: 'American',
        profession: 'VP of Marketing',
        communicationStyle: 'formal',
        accent: 'American English',
        personality: 'Strategic thinker, asks probing questions, values data-driven answers. Warm but professional.',
        opinionAnchors: ['Marketing is about storytelling backed by data', 'Cultural sensitivity is non-negotiable in global roles', 'Leadership means making tough calls'],
        relationshipToLearner: 'authority'
      },
      {
        id: 'agent-3b',
        name: 'Daniel Okonkwo',
        role: 'challenger',
        age: 38,
        nationality: 'Nigerian',
        profession: 'HR Director',
        communicationStyle: 'formal',
        accent: 'Nigerian English',
        personality: 'Structured, methodical, focuses on behavioral competencies. Can be surprisingly blunt. Tests candidates under pressure.',
        opinionAnchors: ['Past behavior predicts future performance', 'Cultural fit matters as much as skills', 'Candidates should ask as many questions as they answer'],
        relationshipToLearner: 'authority'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'seed-4',
    title: 'Apartment Hunting with a Roommate',
    description: 'Visit a potential apartment with your future roommate. Discuss the space, negotiate with the landlord, and make a decision together about whether to take it.',
    cefrLevel: 'B1',
    domain: 'daily-life',
    duration: 10,
    environment: 'apartment',
    scenarioContext: 'You and a potential roommate are viewing an apartment together. The landlord is showing you around and you need to evaluate the space, ask questions, and decide if it works for both of you.',
    conversationBeats: [
      'Landlord welcomes you and starts the tour',
      'Questions about the apartment (rent, utilities, rules)',
      'Discussion between you and your roommate about the space',
      'Negotiation with landlord about terms',
      'Decision time — take it or keep looking?'
    ],
    agents: [
      {
        id: 'agent-4a',
        name: 'Mr. Henderson',
        role: 'anchor',
        age: 55,
        nationality: 'Canadian',
        profession: 'Property Landlord',
        communicationStyle: 'casual',
        accent: 'American English',
        personality: 'Friendly but business-minded. Quick to point out positives, deflects negatives. Has been renting for 20 years.',
        opinionAnchors: ['This is a great deal for the area', 'Good tenants are hard to find', 'Small repairs are just part of renting'],
        relationshipToLearner: 'stranger'
      },
      {
        id: 'agent-4b',
        name: 'Yuki Tanaka',
        role: 'observer',
        age: 25,
        nationality: 'Japanese',
        profession: 'Graduate Student',
        communicationStyle: 'empathetic',
        accent: 'Japanese English',
        personality: 'Polite, detail-oriented, a bit indecisive. Notices small things others miss. Wants everything to be fair and organized.',
        opinionAnchors: ['The kitchen is too small', 'We should split costs exactly equally', 'Quiet neighbors are the most important thing'],
        relationshipToLearner: 'peer'
      }
    ],
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => ({
      worlds: SEED_WORLDS,
      addWorld: (world) => set((state) => ({ worlds: [world, ...state.worlds] })),
      removeWorld: (id) => set((state) => ({ worlds: state.worlds.filter(w => w.id !== id) })),
      getWorld: (id) => get().worlds.find(w => w.id === id),
    }),
    { name: 'world-store' }
  )
);
