import { useParams } from "react-router-dom";
import VirtualRoom from "../components/world/VirtualRoom";

export default function WorldPage() {
  const { topicId } = useParams<{ topicId: string }>();
  return <VirtualRoom topicId={topicId} />;
}
