const THEMES = [
  {
    id: "ambientWave",
    name: "Ambient Wave",
    preview: "previews/ambient-wave-preview.svg",
    description: "Soft ambient edge waves for minimal desktop motion."
  },
  {
    id: "reactiveBorder",
    name: "Reactive Border",
    preview: "previews/reactive-border-preview.svg",
    description: "Full-border audio-reactive glow with stronger presence."
  },
  {
    id: "flowBorder",
    name: "Flow Border",
    preview: "previews/flow-border-preview.svg",
    description: "Directional light motion traveling around the screen perimeter."
  },
  {
    id: "sideBars",
    name: "Side Bars",
    preview: "previews/side-bars-preview.svg",
    description: "Left-right edge bars with centered musical emphasis."
  },
  {
    id: "flatRipples",
    name: "Pulse Lines",
    preview: "previews/pulse-lines-preview.svg",
    description: "Center-origin pulse motion locked to the screen edges."
  },
  {
    id: "dotParticles",
    name: "Dot Particles",
    preview: "previews/dot-particles-preview.svg",
    description: "Glowing particles orbiting the border with beat-reactive energy."
  },
  {
    id: "rippleFlow",
    name: "Ripple Flow",
    preview: "previews/ripple-flow-preview.svg",
    description: "Symmetric edge wavefronts expanding outward from center."
  },
  {
    id: "snowBubbleParticles",
    name: "Snow Particles",
    preview: "previews/snow-particles-preview.svg",
    description: "Cool particles drifting along the frame for ambient winter-like feel."
  },
  {
    id: "edgeCrystals",
    name: "Edge Crystals",
    preview: "previews/edge-crystals-preview.svg",
    description: "Sharp geometric crystal strokes that flutter along screen edges."
  },
  {
    id: "sideBraids",
    name: "Side Braids",
    preview: "previews/side-braids-preview.svg",
    description: "Intertwined neon strands braiding vertically along the edges."
  },
  {
    id: "auroraDrift",
    name: "Aurora Drift",
    preview: "previews/aurora-drift-preview.svg",
    description: "Cinematic aurora curtains rising from the bottom with layered shimmer."
  },
  {
    id: "crimsonDusk",
    name: "Crimson Dusk",
    preview: "previews/crimson-dusk-preview.svg",
    description: "Warm ember and crimson glow along screen edges, inspired by desert sunsets."
  }
];

const FADE_OUT_MS = 450;
let isClosing = false;

function renderThemeGrid() {
  const grid = document.getElementById("theme-grid");
  if (!grid) {
    return;
  }

  grid.textContent = THEMES.map((theme) => `
    <article class="theme-card">
      <img class="theme-preview" src="${theme.preview}" alt="${theme.name} preview" loading="lazy" />
      <div class="theme-info">
        <span class="theme-name">${theme.name}</span>
        <span class="theme-desc">${theme.description}</span>
      </div>
    </article>
  `).join("");
}

function dismissOnboarding() {
  if (isClosing) {
    return;
  }

  isClosing = true;
  const root = document.getElementById("onboarding-root");
  const dontShowAgain = document.getElementById("dont-show-again");
  const neverShowAgain = dontShowAgain ? dontShowAgain.checked : false;

  if (root) {
    root.classList.remove("is-visible");
    root.classList.add("is-closing");
  }

  window.setTimeout(() => {
    if (window.paralineOnboarding && typeof window.paralineOnboarding.dismiss === "function") {
      window.paralineOnboarding.dismiss(neverShowAgain);
    }
  }, FADE_OUT_MS);
}

function initOnboarding() {
  renderThemeGrid();

  const root = document.getElementById("onboarding-root");
  const getStartedBtn = document.getElementById("btn-get-started");

  requestAnimationFrame(() => {
    if (root) {
      root.classList.add("is-visible");
    }
  });

  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", dismissOnboarding);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dismissOnboarding();
    }
  });
}

document.addEventListener("DOMContentLoaded", initOnboarding);
