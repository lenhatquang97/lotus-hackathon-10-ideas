import { useParams } from "react-router-dom";
import { RoomPage } from "../room/RoomPage";

export default function WorldPage() {
  const { topicId } = useParams<{ topicId: string }>();
  return <RoomPage topicId={topicId} />;
}
