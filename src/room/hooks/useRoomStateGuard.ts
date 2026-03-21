import type { RoomStateEnum } from '../types/room.types';
import { useRoomStore } from '../roomStore';

const VALID_TRANSITIONS: Record<RoomStateEnum, RoomStateEnum[]> = {
  CONNECTING:       ['AMBIENT'],
  AMBIENT:          ['AGENT_SPEAKING', 'LEARNER_SPEAKING', 'SILENCE', 'ENDING'],
  AGENT_SPEAKING:   ['LEARNER_SPEAKING', 'AMBIENT', 'PROCESSING', 'ENDING'],
  LEARNER_SPEAKING: ['PROCESSING', 'ENDING'],
  PROCESSING:       ['AGENT_SPEAKING', 'AMBIENT', 'SILENCE'],
  SILENCE:          ['AMBIENT', 'AGENT_SPEAKING', 'LEARNER_SPEAKING', 'ENDING'],
  ENDING:           [],
};

export function useRoomStateGuard() {
  const roomState = useRoomStore((s) => s.roomState);
  const setRoomState = useRoomStore((s) => s.setRoomState);

  return (next: RoomStateEnum) => {
    if (!VALID_TRANSITIONS[roomState].includes(next)) {
      console.warn(`Invalid transition: ${roomState} → ${next}`);
      return;
    }
    setRoomState(next);
  };
}

/** Non-hook version for use outside React components */
export function guardedTransition(next: RoomStateEnum): boolean {
  const current = useRoomStore.getState().roomState;
  if (!VALID_TRANSITIONS[current].includes(next)) {
    console.warn(`Invalid transition: ${current} → ${next}`);
    return false;
  }
  useRoomStore.getState().setRoomState(next);
  return true;
}
