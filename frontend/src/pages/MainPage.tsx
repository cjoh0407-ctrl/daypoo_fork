import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ReportCard } from '../components/ReportCard';
import { MapSection } from '../components/MapSection';
import { Footer } from '../components/Footer';
import { EmergencyButton } from '../components/EmergencyButton';
import { EmergencySheet } from '../components/EmergencySheet';

export function MainPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div style={{ background: '#F8FAF9' }} className="relative min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection onCtaClick={() => document.getElementById('map-scroll-target')?.scrollIntoView({ behavior: 'smooth' })} />

      {/* AI Health Report Section */}
      <ReportCard />

      {/* Map Section with Scroll Target */}
      <div id="map-scroll-target">
        <MapSection />
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Elements */}
      <EmergencyButton onClick={() => setSheetOpen(true)} />
      <EmergencySheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
