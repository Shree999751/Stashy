import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function SplitText({
  text = '',
  className = '',
  delay = 0.15,
  duration = 0.85,
  stagger = 0.025,
  ease = 'power4.out',
  onComplete
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.split-char');

    gsap.fromTo(
      chars,
      {
        opacity: 0,
        y: 45,
        rotateX: -45,
        filter: 'blur(4px)'
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        duration,
        stagger,
        delay,
        ease,
        onComplete
      }
    );
  }, [text]);

  const words = text.split(' ');

  return (
    <h1 ref={containerRef} className={className} style={{ perspective: '1000px', display: 'inline-block' }}>
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="split-word"
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            marginRight: '0.28em'
          }}
        >
          {word.split('').map((char, charIndex) => (
            <span
              key={charIndex}
              className="split-char"
              style={{
                display: 'inline-block',
                willChange: 'transform, opacity, filter',
                transformStyle: 'preserve-3d'
              }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

