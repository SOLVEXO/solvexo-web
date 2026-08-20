import { motion, useReducedMotion, type Variants } from 'motion/react';

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// True masked word reveal — each word sits inside its own `overflow-hidden`
// wrapper and slides up from below the mask (y: 110% → 0%), not a clip-path
// sweep or a plain fade. `text` splits on "\n" for lines, then on spaces for
// words within each line, staggered via Motion's `staggerChildren` so the
// whole heading is one coordinated reveal instead of per-word manual delays.
export function SplitText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  as: Tag = 'span',
  animateOnMount = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
  animateOnMount?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const lines = text.split('\n');

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const word: Variants = {
    hidden: { y: '110%', opacity: 0 },
    show: { y: '0%', opacity: 1, transition: { duration: 0.9, ease: EASE_OUT } },
  };

  if (reduceMotion) {
    const Plain = Tag;
    return <Plain className={className}>{text}</Plain>;
  }

  return (
    <Tag className={className}>
      <motion.span
        className="block"
        variants={container}
        initial="hidden"
        {...(animateOnMount
          ? { animate: 'show' }
          : { whileInView: 'show', viewport: { once: true, margin: '-10%' } })}
      >
        {lines.map((line, li) => (
          <span key={li} className="block overflow-hidden pt-[0.04em] pb-[0.12em]">
            {line.split(' ').map((w, wi) => (
              <span key={wi} className="inline-block overflow-hidden align-bottom">
                <motion.span variants={word} className={wordClassName ? `inline-block ${wordClassName}` : 'inline-block'}>
                  {w}
                  {wi < line.split(' ').length - 1 ? ' ' : ''}
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
