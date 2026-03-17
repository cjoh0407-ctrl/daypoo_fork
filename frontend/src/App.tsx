import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SplashPage } from './pages/SplashPage';
import { MainPage } from './pages/MainPage';
import { MapPage } from './pages/MapPage';

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#152e22] text-white">
      <h1 className="text-2xl">로그인 페이지 (/login)</h1>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/poop-map">
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
