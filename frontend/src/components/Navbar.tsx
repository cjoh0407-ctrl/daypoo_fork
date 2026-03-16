import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { User, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-4 transition-all duration-300"
      style={{
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(10px)' : 'none',
        borderBottom: isScrolled ? '1px solid var(--border-light)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div 
          className="text-2xl md:text-3xl font-bold cursor-pointer"
          style={{ 
            fontFamily: 'SchoolSafetyNotification, system-ui',
            color: isScrolled ? 'var(--green-deep)' : 'var(--green-deep)',
          }}
          onClick={() => navigate('/')}
        >
          Day.Poo
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: 'var(--text-main)' }}
          >
            <Bell size={24} />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: 'var(--text-main)' }}
          >
            <User size={24} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
