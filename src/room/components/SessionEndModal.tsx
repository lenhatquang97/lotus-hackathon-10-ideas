'use client';

interface SessionEndModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionEndModal({ onConfirm, onCancel }: SessionEndModalProps) {
  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <p className="modal-title">End this session?</p>
        <p className="modal-body">
          Your progress will be saved and you will receive a full debrief.
        </p>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>
            Keep going
          </button>
          <button className="modal-btn-confirm" onClick={onConfirm}>
            End session
          </button>
        </div>
      </div>
    </div>
  );
}
