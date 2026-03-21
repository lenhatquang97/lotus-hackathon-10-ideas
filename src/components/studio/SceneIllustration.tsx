'use client';

import type { SceneType } from '@/lib/detectSceneType';

export function SceneIllustration({ type }: { type: SceneType }) {
  switch (type) {
    case 'salary-negotiation': return <SalaryNegotiationScene />;
    case 'airport-checkin': return <AirportCheckinScene />;
    case 'job-interview': return <JobInterviewScene />;
    case 'client-complaint': return <ClientComplaintScene />;
    case 'team-disagreement': return <TeamDisagreementScene />;
    default: return null;
  }
}

function SalaryNegotiationScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#F0EFED"/>
      <rect x="148" y="10" width="90" height="72" fill="#D8D8D8" stroke="#B0B0B0" strokeWidth="0.5"/>
      <line x1="193" y1="10" x2="193" y2="82" stroke="#B0B0B0" strokeWidth="0.5"/>
      <line x1="148" y1="46" x2="238" y2="46" stroke="#B0B0B0" strokeWidth="0.5"/>
      <rect x="144" y="80" width="98" height="5" fill="#B0B0B0"/>
      <rect x="0" y="90" width="260" height="42" fill="#E4E3E0"/>
      <line x1="0" y1="90" x2="260" y2="90" stroke="#B0B0B0" strokeWidth="0.5"/>
      <rect x="60" y="68" width="150" height="28" fill="#3A3A3A"/>
      <rect x="60" y="88" width="150" height="8" fill="#2A2A2A"/>
      <rect x="64" y="96" width="6" height="20" fill="#2A2A2A"/>
      <rect x="200" y="96" width="6" height="20" fill="#2A2A2A"/>
      <rect x="116" y="62" width="28" height="20" fill="#F7F6F4" stroke="#B0B0B0" strokeWidth="0.5"/>
      <line x1="120" y1="68" x2="140" y2="68" stroke="#D8D8D8" strokeWidth="0.5"/>
      <line x1="120" y1="73" x2="140" y2="73" stroke="#D8D8D8" strokeWidth="0.5"/>
      <line x1="120" y1="78" x2="134" y2="78" stroke="#D8D8D8" strokeWidth="0.5"/>
      <rect x="162" y="48" width="24" height="20" rx="1" fill="#6B6B6B"/>
      <rect x="158" y="64" width="32" height="6" fill="#5A5A5A"/>
      <circle cx="174" cy="42" r="10" fill="#3A3A3A"/>
      <rect x="162" y="52" width="24" height="18" rx="2" fill="#3A3A3A"/>
      <rect x="74" y="88" width="20" height="18" rx="1" fill="#B0B0B0"/>
      <rect x="70" y="102" width="28" height="5" fill="#9A9A9A"/>
      <circle cx="84" cy="62" r="8" fill="#6B6B6B"/>
      <rect x="74" y="70" width="20" height="18" rx="2" fill="#6B6B6B"/>
      <ellipse cx="135" cy="116" rx="70" ry="4" fill="#C8C8C8" opacity="0.5"/>
    </svg>
  );
}

function AirportCheckinScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#E8E8E8"/>
      <rect x="0" y="0" width="260" height="20" fill="#D8D8D8"/>
      <line x1="0" y1="20" x2="260" y2="20" stroke="#B0B0B0" strokeWidth="0.5"/>
      <rect x="60" y="4" width="140" height="14" fill="#2A2A2A"/>
      <line x1="80" y1="4" x2="80" y2="18" stroke="#3A3A3A" strokeWidth="0.5"/>
      <line x1="120" y1="4" x2="120" y2="18" stroke="#3A3A3A" strokeWidth="0.5"/>
      <line x1="160" y1="4" x2="160" y2="18" stroke="#3A3A3A" strokeWidth="0.5"/>
      <line x1="60" y1="11" x2="200" y2="11" stroke="#3A3A3A" strokeWidth="0.5"/>
      <line x1="65" y1="8" x2="76" y2="8" stroke="#9A9A9A" strokeWidth="1"/>
      <line x1="85" y1="8" x2="116" y2="8" stroke="#9A9A9A" strokeWidth="1"/>
      <line x1="125" y1="8" x2="156" y2="8" stroke="#9A9A9A" strokeWidth="1"/>
      <line x1="165" y1="8" x2="196" y2="8" stroke="#9A9A9A" strokeWidth="1"/>
      <rect x="0" y="96" width="260" height="36" fill="#E0DFD9"/>
      <line x1="0" y1="96" x2="260" y2="96" stroke="#C8C8C8" strokeWidth="0.5"/>
      <line x1="88" y1="96" x2="88" y2="132" stroke="#C8C8C8" strokeWidth="1" strokeDasharray="4 4"/>
      <line x1="130" y1="96" x2="130" y2="132" stroke="#C8C8C8" strokeWidth="1" strokeDasharray="4 4"/>
      <rect x="10" y="74" width="240" height="28" fill="#B0B0B0"/>
      <rect x="10" y="74" width="240" height="6" fill="#D8D8D8"/>
      <line x1="90" y1="74" x2="90" y2="102" stroke="#9A9A9A" strokeWidth="0.5"/>
      <line x1="170" y1="74" x2="170" y2="102" stroke="#9A9A9A" strokeWidth="0.5"/>
      <rect x="104" y="56" width="28" height="20" fill="#2A2A2A"/>
      <rect x="100" y="74" width="36" height="3" fill="#1A1A1A"/>
      <rect x="107" y="59" width="22" height="14" fill="#6B6B6B"/>
      <circle cx="118" cy="48" r="8" fill="#3A3A3A"/>
      <rect x="108" y="56" width="20" height="18" rx="1" fill="#3A3A3A"/>
      <circle cx="106" cy="56" r="8" fill="#6B6B6B"/>
      <rect x="96" y="64" width="20" height="20" rx="1" fill="#6B6B6B"/>
      <rect x="72" y="84" width="20" height="28" rx="1" fill="#4A4A4A"/>
      <rect x="74" y="84" width="16" height="2" fill="#3A3A3A"/>
      <path d="M78 84 Q82 78 86 84" fill="none" stroke="#3A3A3A" strokeWidth="1.5"/>
      <rect x="58" y="96" width="14" height="16" rx="1" fill="#5A5A5A"/>
      <path d="M62 96 Q65 91 68 96" fill="none" stroke="#3A3A3A" strokeWidth="1"/>
    </svg>
  );
}

function JobInterviewScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#F0EFED"/>
      <rect x="0" y="0" width="260" height="86" fill="#E8E8E8"/>
      <rect x="106" y="12" width="48" height="36" fill="#D8D8D8" stroke="#B0B0B0" strokeWidth="0.5"/>
      <rect x="110" y="16" width="40" height="28" fill="#C8C8C8" stroke="#B0B0B0" strokeWidth="0.3"/>
      <rect x="0" y="86" width="260" height="46" fill="#E4E3E0"/>
      <line x1="0" y1="86" x2="260" y2="86" stroke="#C8C8C8" strokeWidth="0.5"/>
      <rect x="54" y="64" width="152" height="32" fill="#6B6B6B"/>
      <rect x="54" y="64" width="152" height="6" fill="#8A8A8A"/>
      <rect x="54" y="90" width="152" height="6" fill="#5A5A5A"/>
      <rect x="58" y="96" width="5" height="18" fill="#5A5A5A"/>
      <rect x="197" y="96" width="5" height="18" fill="#5A5A5A"/>
      <rect x="126" y="58" width="8" height="12" rx="1" fill="#D8D8D8" stroke="#B0B0B0" strokeWidth="0.3"/>
      <rect x="72" y="58" width="24" height="16" fill="#F7F6F4" stroke="#D8D8D8" strokeWidth="0.5"/>
      <line x1="76" y1="63" x2="92" y2="63" stroke="#D8D8D8" strokeWidth="0.5"/>
      <line x1="76" y1="67" x2="92" y2="67" stroke="#D8D8D8" strokeWidth="0.5"/>
      <rect x="160" y="58" width="24" height="16" fill="#F7F6F4" stroke="#D8D8D8" strokeWidth="0.5"/>
      <line x1="164" y1="63" x2="180" y2="63" stroke="#D8D8D8" strokeWidth="0.5"/>
      <line x1="164" y1="67" x2="180" y2="67" stroke="#D8D8D8" strokeWidth="0.5"/>
      <circle cx="84" cy="44" r="9" fill="#3A3A3A"/>
      <rect x="74" y="53" width="20" height="14" rx="1" fill="#3A3A3A"/>
      <circle cx="176" cy="44" r="9" fill="#3A3A3A"/>
      <rect x="166" y="53" width="20" height="14" rx="1" fill="#3A3A3A"/>
      <rect x="118" y="96" width="24" height="16" rx="1" fill="#B0B0B0"/>
      <circle cx="130" cy="88" r="9" fill="#6B6B6B"/>
      <rect x="120" y="97" width="20" height="16" rx="1" fill="#6B6B6B"/>
      <ellipse cx="130" cy="114" rx="64" ry="3" fill="#C8C8C8" opacity="0.4"/>
    </svg>
  );
}

function ClientComplaintScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#ECEAE6"/>
      <rect x="0" y="0" width="260" height="80" fill="#E4E3E0"/>
      <rect x="16" y="14" width="44" height="28" fill="#2A2A2A"/>
      <rect x="18" y="16" width="40" height="24" fill="#1A1A1A"/>
      <line x1="22" y1="24" x2="54" y2="24" stroke="#4A4A4A" strokeWidth="2"/>
      <line x1="26" y1="30" x2="50" y2="30" stroke="#4A4A4A" strokeWidth="2"/>
      <rect x="80" y="8" width="100" height="50" rx="1" fill="none" stroke="#C8C8C8" strokeWidth="0.5"/>
      <line x1="80" y1="26" x2="180" y2="26" stroke="#C8C8C8" strokeWidth="0.5"/>
      <line x1="80" y1="42" x2="180" y2="42" stroke="#C8C8C8" strokeWidth="0.5"/>
      <rect x="86" y="16" width="10" height="10" fill="#B0B0B0"/>
      <rect x="100" y="16" width="10" height="10" fill="#9A9A9A"/>
      <rect x="114" y="14" width="8" height="12" fill="#B0B0B0"/>
      <rect x="86" y="30" width="12" height="12" fill="#9A9A9A"/>
      <rect x="104" y="31" width="10" height="11" fill="#B0B0B0"/>
      <rect x="0" y="80" width="260" height="52" fill="#DDD9D0"/>
      <line x1="0" y1="80" x2="260" y2="80" stroke="#C0BFBA" strokeWidth="0.5"/>
      <rect x="30" y="64" width="200" height="24" fill="#9A9A9A"/>
      <rect x="30" y="64" width="200" height="5" fill="#B0B0B0"/>
      <rect x="30" y="83" width="200" height="5" fill="#8A8A8A"/>
      <rect x="114" y="38" width="32" height="32" fill="rgba(200,200,200,0.25)" stroke="#B0B0B0" strokeWidth="0.5"/>
      <rect x="164" y="46" width="24" height="18" fill="#3A3A3A"/>
      <rect x="163" y="62" width="26" height="3" fill="#2A2A2A"/>
      <rect x="166" y="49" width="20" height="12" fill="#5A5A5A"/>
      <circle cx="168" cy="37" r="8" fill="#3A3A3A"/>
      <rect x="158" y="45" width="20" height="18" rx="1" fill="#3A3A3A"/>
      <circle cx="88" cy="52" r="8" fill="#6B6B6B"/>
      <rect x="78" y="60" width="20" height="18" rx="1" fill="#6B6B6B"/>
      <ellipse cx="130" cy="112" rx="80" ry="4" fill="#C0BFBA" opacity="0.4"/>
    </svg>
  );
}

function TeamDisagreementScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#EEEDEa"/>
      <rect x="0" y="0" width="260" height="82" fill="#E6E5E2"/>
      <rect x="4" y="8" width="16" height="60" fill="#D8D8D8" stroke="#C8C8C8" strokeWidth="0.5"/>
      <line x1="4" y1="38" x2="20" y2="38" stroke="#C8C8C8" strokeWidth="0.5"/>
      <rect x="22" y="8" width="16" height="60" fill="#D8D8D8" stroke="#C8C8C8" strokeWidth="0.5"/>
      <line x1="22" y1="38" x2="38" y2="38" stroke="#C8C8C8" strokeWidth="0.5"/>
      <rect x="80" y="8" width="100" height="56" fill="#F0EFED" stroke="#C8C8C8" strokeWidth="0.5"/>
      <circle cx="130" cy="30" r="8" fill="none" stroke="#D8D8D8" strokeWidth="1"/>
      <line x1="130" y1="38" x2="130" y2="52" stroke="#D8D8D8" strokeWidth="1"/>
      <line x1="130" y1="52" x2="114" y2="60" stroke="#D8D8D8" strokeWidth="1"/>
      <line x1="130" y1="52" x2="146" y2="60" stroke="#D8D8D8" strokeWidth="1"/>
      <rect x="106" y="58" width="16" height="8" fill="#D8D8D8"/>
      <rect x="138" y="58" width="16" height="8" fill="#D8D8D8"/>
      <rect x="0" y="82" width="260" height="50" fill="#E0DFDB"/>
      <line x1="0" y1="82" x2="260" y2="82" stroke="#C8C8C8" strokeWidth="0.5"/>
      <ellipse cx="130" cy="90" rx="78" ry="24" fill="#6B6B6B"/>
      <ellipse cx="130" cy="87" rx="76" ry="20" fill="#7A7A7A"/>
      <rect x="114" y="82" width="16" height="12" rx="1" fill="#F0EFED" stroke="#D8D8D8" strokeWidth="0.3"/>
      <rect x="134" y="84" width="14" height="10" rx="1" fill="#F0EFED" stroke="#D8D8D8" strokeWidth="0.3"/>
      <rect x="124" y="83" width="7" height="9" rx="1" fill="#D8D8D8"/>
      <circle cx="210" cy="88" r="9" fill="#3A3A3A"/>
      <rect x="200" y="97" width="20" height="16" rx="1" fill="#3A3A3A"/>
      <circle cx="96" cy="72" r="8" fill="#5A5A5A"/>
      <rect x="86" y="80" width="20" height="14" rx="1" fill="#5A5A5A"/>
      <circle cx="152" cy="68" r="8" fill="#5A5A5A"/>
      <rect x="142" y="76" width="20" height="14" rx="1" fill="#5A5A5A"/>
      <circle cx="80" cy="106" r="8" fill="#8A8A8A"/>
      <rect x="70" y="112" width="20" height="14" rx="1" fill="#8A8A8A"/>
      <circle cx="162" cy="108" r="8" fill="#8A8A8A"/>
      <rect x="152" y="116" width="20" height="14" rx="1" fill="#8A8A8A"/>
      <ellipse cx="130" cy="114" rx="70" ry="4" fill="#C0BFBA" opacity="0.35"/>
    </svg>
  );
}
