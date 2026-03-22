import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/home/HeroSection';
import { ScenarioStrip } from '../components/home/ScenarioStrip';
import { FeatureCards } from '../components/home/FeatureCards';

import { FinalCTA } from '../components/home/FinalCTA';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <ScenarioStrip />
      <FeatureCards />
      <FinalCTA />
    </div>
  );
}
