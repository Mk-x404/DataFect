import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  reducedMotion?: boolean;
}

export function PageTransition({ children, reducedMotion = false }: PageTransitionProps) {
  if (reducedMotion) {
    return <div style={{ width: '100%' }}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.995 }}
      transition={{ 
        duration: 0.28, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}

