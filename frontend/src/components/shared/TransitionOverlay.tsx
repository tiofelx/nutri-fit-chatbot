import { AnimatePresence, motion } from 'framer-motion';

interface TransitionOverlayProps {
  isVisible: boolean;
}

export function TransitionOverlay({ isVisible }: TransitionOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 bg-gray-950"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </AnimatePresence>
  );
}
