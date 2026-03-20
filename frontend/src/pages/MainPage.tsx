import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ReportCard } from '../components/ReportCard';
import { MapSection } from '../components/MapSection';
import { Footer } from '../components/Footer';
import { EmergencyButton } from '../components/EmergencyButton';
import { EmergencySheet } from '../components/EmergencySheet';
import { WaveDivider } from '../components/WaveDivider';
import { NovaGlow } from '../components/NovaGlow';

export function MainPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div style={{ background: '#F8FAF9' }} className="relative min-h-screen">
      <Navbar openAuth={openAuth} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <HeroSection 
          onCtaClick={() => document.getElementById('map-scroll-target')?.scrollIntoView({ behavior: 'smooth' })} 
          openAuth={openAuth}
        />
        <WaveDivider fill="#eef5f0" />
      </div>

      {/* AI Health Report Section */}
      <div className="relative overflow-hidden">
        <ReportCard openAuth={openAuth} />
        <WaveDivider fill="#F8FAF9" />
      </div>

      {/* Map Section with Scroll Target */}
      <div id="map-scroll-target" className="relative overflow-hidden pb-32">
        <MapSection />
        <WaveDivider fill="#111e18" />
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Elements */}
      <EmergencyButton onClick={() => setSheetOpen(true)} />
      <EmergencySheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
