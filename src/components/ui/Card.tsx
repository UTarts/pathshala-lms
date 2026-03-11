'use client';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn("rounded-2xl border bg-card text-card-foreground shadow-sm p-4", className)}
    >
      {children}
    </motion.div>
  );
}