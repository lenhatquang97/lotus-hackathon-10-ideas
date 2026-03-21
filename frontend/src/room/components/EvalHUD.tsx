interface EvalHUDProps {
  tone: number;
  content: number;
  firstVoice: number;
}

export function EvalHUD({ tone, content, firstVoice }: EvalHUDProps) {
  const dims = [
    { label: 'T', value: tone },
    { label: 'C', value: content },
    { label: 'V', value: firstVoice },
  ];

  return (
    <div className="eval-hud">
      {dims.map(d => (
        <div key={d.label} className="eval-bar-wrap">
          <div className="eval-bar-track">
            <div
              className="eval-bar-fill"
              style={{ height: `${d.value * 100}%` }}
            />
          </div>
          <span className="eval-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
