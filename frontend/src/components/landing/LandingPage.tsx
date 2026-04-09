import { motion } from 'framer-motion';
import { ThreeScene } from './ThreeScene';

interface LandingPageProps {
  onStart: () => void;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut', delay },
});

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="relative w-full h-screen bg-white overflow-hidden">

      <div className="relative z-10 flex items-center justify-center h-full max-w-6xl mx-auto px-6">

        {/* Coluna esquerda — texto */}
        <div className="flex flex-col justify-center w-full lg:w-1/2 text-left">

          <motion.div className="flex items-center gap-2 mb-5" {...fadeUp(0)}>
            <span className="text-3xl" role="img" aria-label="planta">🌿</span>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">NutriBot</span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight"
            {...fadeUp(0.15)}
          >
            Seu{' '}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #00d4aa, #7c3aed)' }}>
              nutricionista
            </span>
            <br />e{' '}
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #7c3aed, #00d4aa)' }}>
              personal trainer
            </span>
            <br />inteligente
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-gray-500 mb-7 max-w-sm"
            {...fadeUp(0.3)}
          >
            Disponível 24h para orientações personalizadas de nutrição e treino.
          </motion.p>

          <motion.button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-base w-fit
                       hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            style={{ background: 'linear-gradient(90deg, #00d4aa, #7c3aed)' }}
            {...fadeUp(0.45)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Começar agora →
          </motion.button>

          <motion.div className="mt-7 pt-5 border-t border-gray-200" {...fadeUp(0.6)}>
            <p className="text-xs text-gray-400 tracking-wide">
              Orientações personalizadas&nbsp;•&nbsp;IMC&nbsp;•&nbsp;Planos alimentares e de treino
            </p>
          </motion.div>
        </div>

        {/* Coluna direita — molécula 3D */}
        <motion.div
          className="hidden lg:block w-1/2 h-full"
          aria-hidden="true"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
        >
          <ThreeScene />
        </motion.div>
      </div>

      {/* Mobile — molécula como fundo */}
      <div className="absolute inset-0 z-0 lg:hidden opacity-15" aria-hidden="true">
        <ThreeScene />
      </div>

    </div>
  );
}
