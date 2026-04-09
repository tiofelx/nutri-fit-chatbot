import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/landing/LandingPage';
import { TransitionOverlay } from './components/shared/TransitionOverlay';
import { Toast } from './components/shared/Toast';
import { ChatbotPage } from './components/chatbot/ChatbotPage';

function LandingPageRoute({ onStart }: { onStart: () => void }) {
  return <LandingPage onStart={onStart} />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate('/chat');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  };

  return (
    <>
      <TransitionOverlay isVisible={isTransitioning} />
      <Routes>
        <Route path="/" element={<LandingPageRoute onStart={handleStart} />} />
        <Route path="/chat" element={<ChatbotPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toast />
    </BrowserRouter>
  );
}
