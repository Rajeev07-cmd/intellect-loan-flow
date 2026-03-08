import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ArchitectureDiagram } from "@/components/landing/ArchitectureDiagram";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import { RiskEngineSection } from "@/components/landing/RiskEngineSection";
import { CAMSection } from "@/components/landing/CAMSection";
import { AIAssistantSection } from "@/components/landing/AIAssistantSection";
import { DevelopersSection } from "@/components/landing/DevelopersSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <SocialProofSection />
      <ArchitectureDiagram />
      <FeatureHighlights />
      <RiskEngineSection />
      <CAMSection />
      <AIAssistantSection />
      <DevelopersSection />
      <Footer />
    </div>
  );
}
