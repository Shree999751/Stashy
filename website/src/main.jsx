import React from 'react';
import { createRoot } from 'react-dom/client';
import SplitText from './SplitText.jsx';

const mountEl = document.getElementById('hero-headline-mount');
if (mountEl) {
  const root = createRoot(mountEl);
  root.render(
    <SplitText
      text="The frictionless desktop scratchpad on your screen edge."
      className="hero-headline-title"
      delay={0.12}
      duration={0.8}
      stagger={0.02}
      ease="power3.out"
    />
  );
}

