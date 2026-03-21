export type SceneType =
  | 'salary-negotiation'
  | 'airport-checkin'
  | 'job-interview'
  | 'client-complaint'
  | 'team-disagreement';

export function detectSceneType(brief: string, template: string | null): SceneType | null {
  if (template) {
    const map: Record<string, SceneType> = {
      'Salary negotiation': 'salary-negotiation',
      'Airport check-in': 'airport-checkin',
      'Job interview': 'job-interview',
      'Client complaint': 'client-complaint',
      'Team disagreement': 'team-disagreement',
    };
    return map[template] ?? null;
  }

  const lower = brief.toLowerCase();

  if (/salary|raise|pay|compensation|hr|merit/.test(lower)) return 'salary-negotiation';
  if (/airport|check.in|flight|boarding|luggage|suitcase|passport/.test(lower)) return 'airport-checkin';
  if (/interview|interviewer|hiring|candidate|position|apply/.test(lower)) return 'job-interview';
  if (/complaint|customer|service|refund|frustrated|issue|problem/.test(lower)) return 'client-complaint';
  if (/meeting|team|disagree|pushback|colleague|project|sprint/.test(lower)) return 'team-disagreement';

  return null;
}
