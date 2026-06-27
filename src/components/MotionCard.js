"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

const MotionLink = motion(Link);

export default function MotionCard({ children, className = "", style, href, ...props }) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = href ? MotionLink : motion.div;

  return (
    <MotionComponent
      href={href}
      className={className}
      style={style}
      whileHover={reduceMotion ? undefined : { y: -7, scale: 1.012 }}
      whileTap={reduceMotion ? undefined : { scale: 0.992 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
