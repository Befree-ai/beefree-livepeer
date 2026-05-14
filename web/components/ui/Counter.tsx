"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CounterProps {
  to: number;
  prefix?: string;
  suffix?: string;
}

export default function Counter({ to, prefix = "", suffix = "" }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 2000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionVal.set(to);
  }, [inView, motionVal, to]);

  useEffect(() => {
    spring.on("change", (v) => setDisplay(Math.round(v).toLocaleString()));
  }, [spring]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}
