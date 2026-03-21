import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/home/HeroSection';
import { ScenarioStrip } from '../components/home/ScenarioStrip';
import { FeatureCards } from '../components/home/FeatureCards';
import { SocialProof } from '../components/home/SocialProof';
import { FinalCTA } from '../components/home/FinalCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />
      <HeroSection />
      <ScenarioStrip />
      <FeatureCards />
      <SocialProof />
      <FinalCTA />
    </div>
  );
}
