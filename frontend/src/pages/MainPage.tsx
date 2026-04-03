import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ReportCard } from '../components/ReportCard_Glass';
import { MapSection } from '../components/MapSection';
import { Footer } from '../components/Footer';
import { EmergencyButton } from '../components/EmergencyButton';
import { EmergencySheet } from '../components/EmergencySheet';
import { WaveDivider } from '../components/WaveDivider';
import { NovaGlow } from '../components/NovaGlow';
import { HealthLogModal, HealthLogResult } from '../components/map/HealthLogModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import { HealthRecordRequest } from '../types/api';
import { AnimatePresence } from 'framer-motion';

export function MainPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showHealthLog, setShowHealthLog] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleRecordClick = useCallback(() => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      openAuth('login');
      return;
    }
    setShowHealthLog(true);
  }, [isAuthenticated, openAuth]);

  const handleHealthLogComplete = async (result: HealthLogResult) => {
    try {
      const payload: HealthRecordRequest = {
        conditionTags: result.conditionTags,
        dietTags: result.foodTags,
        ...(result.bristolType !== null && { bristolScale: result.bristolType }),
        ...(result.color !== null && { color: result.color }),
      };
      await api.post('/records', payload);
      setShowHealthLog(false);
      alert('기록이 저장되었습니다!');
    } catch (e: any) {
      alert(`기록 저장 실패: ${e.message || '서버 오류'}`);
    }
  };

  return (
    <div style={{ background: '#F8FAF9' }} className="relative min-h-screen">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <HeroSection
          onCtaClick={() => navigate('/map?openNearest=true')}
          onRecordClick={handleRecordClick}
          openAuth={openAuth}
        />
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

      {/* 글로벌 건강 기록 모달 */}
      <AnimatePresence>
        {showHealthLog && (
          <HealthLogModal
            onClose={() => setShowHealthLog(false)}
            onComplete={handleHealthLogComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
