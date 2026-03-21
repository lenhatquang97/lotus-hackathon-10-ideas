import dynamic from "next/dynamic";

const VirtualRoom = dynamic(() => import("@/components/VirtualRoom"), {
  ssr: false,
});

export default function Home() {
  return <VirtualRoom />;
}
