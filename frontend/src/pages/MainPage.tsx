import { useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ReportCard } from '../components/ReportCard';
import { MapSection } from '../components/MapSection';
import { EmergencyButton } from '../components/EmergencyButton';
import { EmergencySheet } from '../components/EmergencySheet';

export function MainPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full" style={{ backgroundColor: 'var(--bg-light)' }}>
      {/* Global Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection onCtaClick={scrollToMap} />

      {/* AI Health Report Section */}
      <ReportCard />

      {/* Map Section */}
      <div ref={mapSectionRef}>
        <MapSection />
      </div>

      {/* Floating Elements */}
      <EmergencyButton onClick={() => setIsSheetOpen(true)} />
      
      {/* Overlays */}
      <EmergencySheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
    </div>
  );
}
