interface AgentNameplateProps {
  name: string;
  role: string;
  visible: boolean;
}

export function AgentNameplate({ name, role, visible }: AgentNameplateProps) {
  if (!visible) return null;

  return (
    <div className="agent-nameplate">
      <span className="agent-name">{name}</span>
      <span className="agent-role-badge">{role}</span>
    </div>
  );
}
