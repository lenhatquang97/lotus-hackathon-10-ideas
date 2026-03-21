import type { BriefPreview, KnowledgeItem } from './types';

const TOPIC_KEYWORDS: Record<string, string> = {
  salary: 'salary negotiation', raise: 'salary negotiation', negotiate: 'negotiation',
  airport: 'travel & transport', hotel: 'travel & transport', 'check-in': 'travel & transport',
  interview: 'job interview', hiring: 'job interview',
  client: 'client relations', customer: 'client relations',
  complaint: 'conflict resolution', meeting: 'workplace communication',
  standup: 'workplace communication', 'stand-up': 'workplace communication',
  cafe: 'social conversation', restaurant: 'social conversation',
  landlord: 'daily life', apartment: 'daily life', rent: 'daily life',
  university: 'academic', exam: 'academic', study: 'academic',
  doctor: 'healthcare', hospital: 'healthcare',
};

const AGENT_NAME_POOLS: Record<string, string[]> = {
  'salary negotiation': ['Emma Chen', 'David Park'],
  'negotiation': ['Sarah Mitchell', 'James Wong'],
  'travel & transport': ['Officer Martinez', 'Agent Williams'],
  'job interview': ['Dr. Sarah Chen', 'Oliver Brooks'],
  'client relations': ['Alex Turner', 'Priya Sharma'],
  'conflict resolution': ['Karen Phillips', 'Mark Stevens'],
  'workplace communication': ['Rachel Kim', 'Tom Bradley', 'Priya Sharma'],
  'social conversation': ['Jake Morrison', 'Margaret Wilson'],
  'daily life': ['Mr. Henderson', 'Yuki Tanaka'],
  'academic': ['Prof. Davies', 'Mia Thompson'],
  'healthcare': ['Dr. Patel', 'Nurse Williams'],
};

function extractSetting(brief: string): string {
  const l = brief.toLowerCase();
  if (l.includes('office') || l.includes('meeting room')) return 'Office';
  if (l.includes('cafe') || l.includes('coffee')) return 'Cafe';
  if (l.includes('airport')) return 'Airport terminal';
  if (l.includes('hotel')) return 'Hotel lobby';
  if (l.includes('interview')) return 'Interview room';
  if (l.includes('apartment') || l.includes('flat')) return 'Residential';
  if (l.includes('restaurant')) return 'Restaurant';
  if (l.includes('hospital') || l.includes('clinic')) return 'Medical facility';
  if (l.includes('service') || l.includes('counter') || l.includes('desk')) return 'Service desk';
  return '';
}

function extractVocabulary(brief: string): string[] {
  const l = brief.toLowerCase();
  const hints: string[] = [];
  const m: Record<string, string> = {
    salary: 'compensation package', interview: 'qualifications', meeting: 'agenda items',
    complaint: 'resolution options', hotel: 'reservation details', airport: 'boarding pass',
    negotiate: 'counter-offer', manager: 'reporting structure', budget: 'fiscal constraints',
    deadline: 'timeline management',
  };
  for (const [k, v] of Object.entries(m)) if (l.includes(k)) hints.push(v);
  return hints.slice(0, 5);
}

function countCharacters(brief: string): number {
  const l = brief.toLowerCase();
  const roles = ['manager', 'director', 'interviewer', 'barista', 'customer', 'agent', 'landlord', 'colleague', 'boss', 'receptionist', 'doctor', 'nurse', 'teacher', 'professor', 'waiter', 'client', 'partner'];
  const found = roles.filter(w => l.includes(w));
  if (l.includes('two') || l.includes('both')) return 2;
  if (found.length >= 3) return 3;
  if (found.length >= 1) return found.length + 1;
  return 2;
}

function buildScenarioSummary(brief: string): string {
  if (!brief.trim()) return '';
  const first = brief.split(/[.!?\n]/)[0].trim();
  if (first.toLowerCase().startsWith('you')) return first;
  return 'You enter a scenario: ' + (first.charAt(0).toLowerCase() + first.slice(1));
}

function suggestAgentNames(topics: string[], count: number): string[] {
  for (const topic of topics) {
    const pool = AGENT_NAME_POOLS[topic];
    if (pool) return pool.slice(0, count);
  }
  return ['Character 1', 'Character 2'].slice(0, count);
}

export function computeConfidence(brief: string, items: KnowledgeItem[]): number {
  let score = 0;
  if (brief.length > 20) score += 15;
  if (brief.length > 80) score += 15;
  if (brief.length > 200) score += 10;
  if (brief.length > 400) score += 10;
  if (/setting|location|office|airport|room/.test(brief.toLowerCase())) score += 10;
  if (/character|manager|colleague|agent|interviewer/.test(brief.toLowerCase())) score += 10;
  if (/goal|want|ask|discuss|negotiate/.test(brief.toLowerCase())) score += 10;
  score += Math.min(items.length * 10, 20);
  return Math.min(score, 100);
}

export function analyzeBrief(brief: string, items: KnowledgeItem[]): BriefPreview {
  if (!brief.trim() && items.length === 0) {
    return {
      status: 'empty', suggestedTitle: '', setting: '', scenario: '',
      detectedTopics: [], suggestedCharacterCount: 0, suggestedDifficulty: '',
      vocabularyHints: [], scenarioSummary: '', suggestedAgentNames: [],
      estimatedDurationMin: 0, confidence: 0,
    };
  }

  const lower = brief.toLowerCase();
  const detectedTopics = [...new Set(
    Object.entries(TOPIC_KEYWORDS).filter(([k]) => lower.includes(k)).map(([, v]) => v)
  )];

  const firstSentence = brief.split(/[.!?\n]/)[0].trim();
  const suggestedTitle = firstSentence.length > 50 ? firstSentence.slice(0, 50) + '...' : firstSentence || 'Untitled World';
  const charCount = countCharacters(brief);
  const topics = detectedTopics.length ? detectedTopics : ['conversation practice'];

  return {
    status: brief.length > 30 ? 'ready' : 'partial',
    suggestedTitle,
    setting: extractSetting(brief),
    scenario: brief.length > 120 ? brief.slice(0, 120) + '...' : brief,
    detectedTopics: topics,
    suggestedCharacterCount: charCount,
    suggestedDifficulty: 'intermediate',
    vocabularyHints: extractVocabulary(brief),
    scenarioSummary: buildScenarioSummary(brief),
    suggestedAgentNames: suggestAgentNames(topics, charCount),
    estimatedDurationMin: brief.length > 200 ? 12 : brief.length > 80 ? 10 : 8,
    confidence: computeConfidence(brief, items),
  };
}
