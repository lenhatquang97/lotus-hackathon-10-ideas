import { Link } from 'react-router-dom';
import { SceneIllustration } from '../studio/SceneIllustration';
import type { SceneType } from '../../lib/detectSceneType';
import { useRef } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

interface WorldEntry {
  id: string;
  location: string;
  title: string;
  agents: number;
  level: string;
  characters: string;
  scene: SceneType;
}

const FEATURED_WORLDS: WorldEntry[] = [
  {
    id: 'salary-negotiation',
    location: 'Office',
    title: 'Salary Negotiation',
    agents: 3,
    level: 'Intermediate',
    characters: 'Emma \u00b7 Oliver \u00b7 Priya',
    scene: 'salary-negotiation',
  },
  {
    id: 'airport-checkin',
    location: 'Airport',
    title: 'Check-in Under Pressure',
    agents: 2,
    level: 'Beginner',
    characters: 'Sarah \u00b7 Marcus',
    scene: 'airport-checkin',
  },
  {
    id: 'job-interview',
    location: 'Meeting Room',
    title: 'Job Interview',
    agents: 2,
    level: 'Advanced',
    characters: 'James \u00b7 Rachel',
    scene: 'job-interview',
  },
];

function ScenarioCard({ world }: { world: WorldEntry }) {
  return (
    <Link to={`/topics`} className="scenario-card">
      <div className="sc-stripe" />
      <div className="sc-scene">
        <SceneIllustration type={world.scene} />
        <div className="sc-location">{world.location}</div>
      </div>
      <div className="sc-body">
        <h3 className="sc-title">{world.title}</h3>
        <div className="sc-meta">
          <span>{world.agents} agents</span>
          <span className="sc-dot">&middot;</span>
          <span>{world.level}</span>
        </div>
        <p className="sc-characters">{world.characters}</p>
      </div>
    </Link>
  );
}

export function ScenarioStrip() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);

  return (
    <section className="scenario-strip" ref={ref}>
      <div className="page-container">
        <div className="strip-header">
          <div className="strip-header-left">
            <span className="section-eyebrow">Worlds</span>
            <h2 className="strip-title">Real scenarios. Named characters.</h2>
          </div>
          <Link to="/topics" className="strip-see-all">See all 12 worlds &rarr;</Link>
        </div>
        <div className="scenario-grid">
          {FEATURED_WORLDS.map((world) => (
            <ScenarioCard key={world.id} world={world} />
          ))}
        </div>
      </div>
    </section>
  );
}
