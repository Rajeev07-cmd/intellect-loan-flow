import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface AnimatedValueProps {
  value: string;
  className?: string;
}

function parseValue(value: string): { prefix: string; number: number; suffix: string; hasDecimal: boolean; decimals: number } {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value, hasDecimal: false, decimals: 0 };
  
  const prefix = match[1];
  const numStr = match[2].replace(/,/g, "");
  const suffix = match[3];
  const hasDecimal = numStr.includes(".");
  const decimals = hasDecimal ? numStr.split(".")[1].length : 0;
  const number = parseFloat(numStr);
  
  return { prefix, number, suffix, hasDecimal, decimals };
}

function formatNumber(num: number, hasDecimal: boolean, decimals: number): string {
  if (hasDecimal) {
    const parts = num.toFixed(decimals).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function AnimatedValue({ value, className }: AnimatedValueProps) {
  const { prefix, number, suffix, hasDecimal, decimals } = parseValue(value);
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current || number === 0) return;
    hasAnimated.current = true;

    const duration = 2000;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * number);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, number]);

  // For non-numeric values (like "ISO 27001"), just show as-is
  if (number === 0 && !prefix) {
    return <span ref={ref} className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{formatNumber(current, hasDecimal, decimals)}{suffix}
    </span>
  );
}
