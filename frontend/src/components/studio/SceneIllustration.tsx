import type { SceneType } from '../../lib/detectSceneType';

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
      <rect x="0" y="0" width="260" height="132" fill="#1A1628"/>
      <rect x="148" y="10" width="90" height="72" fill="#3A3448" stroke="#504A60" strokeWidth="0.5"/>
      <line x1="193" y1="10" x2="193" y2="82" stroke="#504A60" strokeWidth="0.5"/>
      <line x1="148" y1="46" x2="238" y2="46" stroke="#504A60" strokeWidth="0.5"/>
      <rect x="144" y="80" width="98" height="5" fill="#504A60"/>
      <rect x="0" y="90" width="260" height="42" fill="#201C30"/>
      <line x1="0" y1="90" x2="260" y2="90" stroke="#504A60" strokeWidth="0.5"/>
      <rect x="60" y="68" width="150" height="28" fill="#A09AB0"/>
      <rect x="60" y="88" width="150" height="8" fill="#B0AABC"/>
      <rect x="64" y="96" width="6" height="20" fill="#B0AABC"/>
      <rect x="200" y="96" width="6" height="20" fill="#B0AABC"/>
      <rect x="116" y="62" width="28" height="20" fill="#1A1628" stroke="#504A60" strokeWidth="0.5"/>
      <line x1="120" y1="68" x2="140" y2="68" stroke="#3A3448" strokeWidth="0.5"/>
      <line x1="120" y1="73" x2="140" y2="73" stroke="#3A3448" strokeWidth="0.5"/>
      <line x1="120" y1="78" x2="134" y2="78" stroke="#3A3448" strokeWidth="0.5"/>
      <rect x="162" y="48" width="24" height="20" rx="1" fill="#807898"/>
      <rect x="158" y="64" width="32" height="6" fill="#605A70"/>
      <circle cx="174" cy="42" r="10" fill="#A09AB0"/>
      <rect x="162" y="52" width="24" height="18" rx="2" fill="#A09AB0"/>
      <rect x="74" y="88" width="20" height="18" rx="1" fill="#504A60"/>
      <rect x="70" y="102" width="28" height="5" fill="#605A70"/>
      <circle cx="84" cy="62" r="8" fill="#807898"/>
      <rect x="74" y="70" width="20" height="18" rx="2" fill="#807898"/>
      <ellipse cx="135" cy="116" rx="70" ry="4" fill="#403858" opacity="0.5"/>
    </svg>
  );
}

function AirportCheckinScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#2A2438"/>
      <rect x="0" y="0" width="260" height="20" fill="#3A3448"/>
      <line x1="0" y1="20" x2="260" y2="20" stroke="#504A60" strokeWidth="0.5"/>
      <rect x="60" y="4" width="140" height="14" fill="#B0AABC"/>
      <line x1="80" y1="4" x2="80" y2="18" stroke="#A09AB0" strokeWidth="0.5"/>
      <line x1="120" y1="4" x2="120" y2="18" stroke="#A09AB0" strokeWidth="0.5"/>
      <line x1="160" y1="4" x2="160" y2="18" stroke="#A09AB0" strokeWidth="0.5"/>
      <line x1="60" y1="11" x2="200" y2="11" stroke="#A09AB0" strokeWidth="0.5"/>
      <line x1="65" y1="8" x2="76" y2="8" stroke="#605A70" strokeWidth="1"/>
      <line x1="85" y1="8" x2="116" y2="8" stroke="#605A70" strokeWidth="1"/>
      <line x1="125" y1="8" x2="156" y2="8" stroke="#605A70" strokeWidth="1"/>
      <line x1="165" y1="8" x2="196" y2="8" stroke="#605A70" strokeWidth="1"/>
      <rect x="0" y="96" width="260" height="36" fill="#1E1A2C"/>
      <line x1="0" y1="96" x2="260" y2="96" stroke="#403858" strokeWidth="0.5"/>
      <line x1="88" y1="96" x2="88" y2="132" stroke="#403858" strokeWidth="1" strokeDasharray="4 4"/>
      <line x1="130" y1="96" x2="130" y2="132" stroke="#403858" strokeWidth="1" strokeDasharray="4 4"/>
      <rect x="10" y="74" width="240" height="28" fill="#504A60"/>
      <rect x="10" y="74" width="240" height="6" fill="#3A3448"/>
      <line x1="90" y1="74" x2="90" y2="102" stroke="#605A70" strokeWidth="0.5"/>
      <line x1="170" y1="74" x2="170" y2="102" stroke="#605A70" strokeWidth="0.5"/>
      <rect x="104" y="56" width="28" height="20" fill="#B0AABC"/>
      <rect x="100" y="74" width="36" height="3" fill="#B0AABC"/>
      <rect x="107" y="59" width="22" height="14" fill="#807898"/>
      <circle cx="118" cy="48" r="8" fill="#A09AB0"/>
      <rect x="108" y="56" width="20" height="18" rx="1" fill="#A09AB0"/>
      <circle cx="106" cy="56" r="8" fill="#807898"/>
      <rect x="96" y="64" width="20" height="20" rx="1" fill="#807898"/>
      <rect x="72" y="84" width="20" height="28" rx="1" fill="#605A70"/>
      <rect x="74" y="84" width="16" height="2" fill="#A09AB0"/>
      <path d="M78 84 Q82 78 86 84" fill="none" stroke="#A09AB0" strokeWidth="1.5"/>
      <rect x="58" y="96" width="14" height="16" rx="1" fill="#605A70"/>
      <path d="M62 96 Q65 91 68 96" fill="none" stroke="#A09AB0" strokeWidth="1"/>
    </svg>
  );
}

function JobInterviewScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#1A1628"/>
      <rect x="0" y="0" width="260" height="86" fill="#2A2438"/>
      <rect x="106" y="12" width="48" height="36" fill="#3A3448" stroke="#504A60" strokeWidth="0.5"/>
      <rect x="110" y="16" width="40" height="28" fill="#403858" stroke="#504A60" strokeWidth="0.3"/>
      <rect x="0" y="86" width="260" height="46" fill="#201C30"/>
      <line x1="0" y1="86" x2="260" y2="86" stroke="#403858" strokeWidth="0.5"/>
      <rect x="54" y="64" width="152" height="32" fill="#807898"/>
      <rect x="54" y="64" width="152" height="6" fill="#605A70"/>
      <rect x="54" y="90" width="152" height="6" fill="#605A70"/>
      <rect x="58" y="96" width="5" height="18" fill="#605A70"/>
      <rect x="197" y="96" width="5" height="18" fill="#605A70"/>
      <rect x="126" y="58" width="8" height="12" rx="1" fill="#3A3448" stroke="#504A60" strokeWidth="0.3"/>
      <rect x="72" y="58" width="24" height="16" fill="#1A1628" stroke="#3A3448" strokeWidth="0.5"/>
      <line x1="76" y1="63" x2="92" y2="63" stroke="#3A3448" strokeWidth="0.5"/>
      <line x1="76" y1="67" x2="92" y2="67" stroke="#3A3448" strokeWidth="0.5"/>
      <rect x="160" y="58" width="24" height="16" fill="#1A1628" stroke="#3A3448" strokeWidth="0.5"/>
      <line x1="164" y1="63" x2="180" y2="63" stroke="#3A3448" strokeWidth="0.5"/>
      <line x1="164" y1="67" x2="180" y2="67" stroke="#3A3448" strokeWidth="0.5"/>
      <circle cx="84" cy="44" r="9" fill="#A09AB0"/>
      <rect x="74" y="53" width="20" height="14" rx="1" fill="#A09AB0"/>
      <circle cx="176" cy="44" r="9" fill="#A09AB0"/>
      <rect x="166" y="53" width="20" height="14" rx="1" fill="#A09AB0"/>
      <rect x="118" y="96" width="24" height="16" rx="1" fill="#504A60"/>
      <circle cx="130" cy="88" r="9" fill="#807898"/>
      <rect x="120" y="97" width="20" height="16" rx="1" fill="#807898"/>
      <ellipse cx="130" cy="114" rx="64" ry="3" fill="#403858" opacity="0.4"/>
    </svg>
  );
}

function ClientComplaintScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#1E1A2C"/>
      <rect x="0" y="0" width="260" height="80" fill="#201C30"/>
      <rect x="16" y="14" width="44" height="28" fill="#B0AABC"/>
      <rect x="18" y="16" width="40" height="24" fill="#B0AABC"/>
      <line x1="22" y1="24" x2="54" y2="24" stroke="#605A70" strokeWidth="2"/>
      <line x1="26" y1="30" x2="50" y2="30" stroke="#605A70" strokeWidth="2"/>
      <rect x="80" y="8" width="100" height="50" rx="1" fill="none" stroke="#403858" strokeWidth="0.5"/>
      <line x1="80" y1="26" x2="180" y2="26" stroke="#403858" strokeWidth="0.5"/>
      <line x1="80" y1="42" x2="180" y2="42" stroke="#403858" strokeWidth="0.5"/>
      <rect x="86" y="16" width="10" height="10" fill="#504A60"/>
      <rect x="100" y="16" width="10" height="10" fill="#605A70"/>
      <rect x="114" y="14" width="8" height="12" fill="#504A60"/>
      <rect x="86" y="30" width="12" height="12" fill="#605A70"/>
      <rect x="104" y="31" width="10" height="11" fill="#504A60"/>
      <rect x="0" y="80" width="260" height="52" fill="#1A1628"/>
      <line x1="0" y1="80" x2="260" y2="80" stroke="#403858" strokeWidth="0.5"/>
      <rect x="30" y="64" width="200" height="24" fill="#605A70"/>
      <rect x="30" y="64" width="200" height="5" fill="#504A60"/>
      <rect x="30" y="83" width="200" height="5" fill="#504868"/>
      <rect x="114" y="38" width="32" height="32" fill="rgba(64,56,88,0.25)" stroke="#504A60" strokeWidth="0.5"/>
      <rect x="164" y="46" width="24" height="18" fill="#A09AB0"/>
      <rect x="163" y="62" width="26" height="3" fill="#B0AABC"/>
      <rect x="166" y="49" width="20" height="12" fill="#605A70"/>
      <circle cx="168" cy="37" r="8" fill="#A09AB0"/>
      <rect x="158" y="45" width="20" height="18" rx="1" fill="#A09AB0"/>
      <circle cx="88" cy="52" r="8" fill="#807898"/>
      <rect x="78" y="60" width="20" height="18" rx="1" fill="#807898"/>
      <ellipse cx="130" cy="112" rx="80" ry="4" fill="#403858" opacity="0.4"/>
    </svg>
  );
}

function TeamDisagreementScene() {
  return (
    <svg width="100%" viewBox="0 0 260 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="scene-svg">
      <rect x="0" y="0" width="260" height="132" fill="#1E1A2C"/>
      <rect x="0" y="0" width="260" height="82" fill="#201C30"/>
      <rect x="4" y="8" width="16" height="60" fill="#3A3448" stroke="#403858" strokeWidth="0.5"/>
      <line x1="4" y1="38" x2="20" y2="38" stroke="#403858" strokeWidth="0.5"/>
      <rect x="22" y="8" width="16" height="60" fill="#3A3448" stroke="#403858" strokeWidth="0.5"/>
      <line x1="22" y1="38" x2="38" y2="38" stroke="#403858" strokeWidth="0.5"/>
      <rect x="80" y="8" width="100" height="56" fill="#1A1628" stroke="#403858" strokeWidth="0.5"/>
      <circle cx="130" cy="30" r="8" fill="none" stroke="#3A3448" strokeWidth="1"/>
      <line x1="130" y1="38" x2="130" y2="52" stroke="#3A3448" strokeWidth="1"/>
      <line x1="130" y1="52" x2="114" y2="60" stroke="#3A3448" strokeWidth="1"/>
      <line x1="130" y1="52" x2="146" y2="60" stroke="#3A3448" strokeWidth="1"/>
      <rect x="106" y="58" width="16" height="8" fill="#3A3448"/>
      <rect x="138" y="58" width="16" height="8" fill="#3A3448"/>
      <rect x="0" y="82" width="260" height="50" fill="#1A1628"/>
      <line x1="0" y1="82" x2="260" y2="82" stroke="#403858" strokeWidth="0.5"/>
      <ellipse cx="130" cy="90" rx="78" ry="24" fill="#807898"/>
      <ellipse cx="130" cy="87" rx="76" ry="20" fill="#605A70"/>
      <rect x="114" y="82" width="16" height="12" rx="1" fill="#1A1628" stroke="#3A3448" strokeWidth="0.3"/>
      <rect x="134" y="84" width="14" height="10" rx="1" fill="#1A1628" stroke="#3A3448" strokeWidth="0.3"/>
      <rect x="124" y="83" width="7" height="9" rx="1" fill="#3A3448"/>
      <circle cx="210" cy="88" r="9" fill="#A09AB0"/>
      <rect x="200" y="97" width="20" height="16" rx="1" fill="#A09AB0"/>
      <circle cx="96" cy="72" r="8" fill="#605A70"/>
      <rect x="86" y="80" width="20" height="14" rx="1" fill="#605A70"/>
      <circle cx="152" cy="68" r="8" fill="#605A70"/>
      <rect x="142" y="76" width="20" height="14" rx="1" fill="#605A70"/>
      <circle cx="80" cy="106" r="8" fill="#504868"/>
      <rect x="70" y="112" width="20" height="14" rx="1" fill="#504868"/>
      <circle cx="162" cy="108" r="8" fill="#504868"/>
      <rect x="152" y="116" width="20" height="14" rx="1" fill="#504868"/>
      <ellipse cx="130" cy="114" rx="70" ry="4" fill="#403858" opacity="0.35"/>
    </svg>
  );
}
