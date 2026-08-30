import { Link } from "react-router-dom";
import {
  Sparkles,
  Users,
  SquarePen,
  ArrowRight,
  Globe,
  ChevronLeft,
  ChevronRight,
  Check,
  BarChart3,
  Star,
  Crosshair,
  Layers,
  Pause,
  Plus,
  Shield,
  Clock,
  Compass,
  Zap,
  Flame,
  Search,
  Settings,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Hash,
  Award,
  CirclePlus,
  Crown,
  Grid2x2Check,
  Grid3x3,
  ListChecks,
  ListCollapse,
  Ribbon,
  CreditCard,
  Download,
  LayoutList
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import genderForms from "../data/forms/gender.json";
import alolanForms from "../data/forms/alolan.json";
import galarianForms from "../data/forms/galarian.json";
import hisuianForms from "../data/forms/hisuian.json";
import paldeanForms from "../data/forms/paldean.json";
import gmaxForms from "../data/forms/gmax.json";
import unownForms from "../data/forms/unown.json";
import otherForms from "../data/forms/other.json";
import alcremieForms from "../data/forms/alcremie.json";
import vivillonForms from "../data/forms/vivillon.json";
import alphaForms from "../data/forms/alpha.json";

import Footer from "../components/Shared/Footer";
import { formatPokemonName } from "../utils";
import { getSpriteUrl } from "../utils/spriteUtils";
import { getCaughtKey } from "../caughtStorage";
import { buildApiUrl } from "../config/api";
import { Button } from "../components/Shared/Button";
import { BullseyeIcon } from "../components/Shared/SearchBar";
import "../css/PublicHome.css";

// Animated sprite collections for Hero spots
const TOP_RIGHT_SPRITES = [
  "/landing_page/animated_sprites/top_right/celebi.gif",
  "/landing_page/animated_sprites/top_right/darkrai.gif",
  "/landing_page/animated_sprites/top_right/diancie.gif",
  "/landing_page/animated_sprites/top_right/hoopa.gif",
  "/landing_page/animated_sprites/top_right/jirachi.gif",
  "/landing_page/animated_sprites/top_right/manaphy.gif",
  "/landing_page/animated_sprites/top_right/meloetta.gif",
  "/landing_page/animated_sprites/top_right/mew.gif"
];

const BOTTOM_LEFT_SPRITES = [
  "/landing_page/animated_sprites/bottom_left/bulbasaur.gif",
  "/landing_page/animated_sprites/bottom_left/charmander.gif",
  "/landing_page/animated_sprites/bottom_left/chikorita.gif",
  "/landing_page/animated_sprites/bottom_left/chimchar.gif",
  "/landing_page/animated_sprites/bottom_left/cyndaquil.gif",
  "/landing_page/animated_sprites/bottom_left/ditto.gif",
  "/landing_page/animated_sprites/bottom_left/eevee.gif",
  "/landing_page/animated_sprites/bottom_left/fennekin.gif",
  "/landing_page/animated_sprites/bottom_left/froakie.gif",
  "/landing_page/animated_sprites/bottom_left/grookey.gif",
  "/landing_page/animated_sprites/bottom_left/litten.gif",
  "/landing_page/animated_sprites/bottom_left/mudkip.gif",
  "/landing_page/animated_sprites/bottom_left/oshawott.gif",
  "/landing_page/animated_sprites/bottom_left/pikachu.gif",
  "/landing_page/animated_sprites/bottom_left/piplup.gif",
  "/landing_page/animated_sprites/bottom_left/popplio.gif",
  "/landing_page/animated_sprites/bottom_left/rowlet.gif",
  "/landing_page/animated_sprites/bottom_left/scorbunny.gif",
  "/landing_page/animated_sprites/bottom_left/snivy.gif",
  "/landing_page/animated_sprites/bottom_left/sobble.gif",
  "/landing_page/animated_sprites/bottom_left/squirtle.gif",
  "/landing_page/animated_sprites/bottom_left/tepig.gif",
  "/landing_page/animated_sprites/bottom_left/torchic.gif",
  "/landing_page/animated_sprites/bottom_left/totodile.gif",
  "/landing_page/animated_sprites/bottom_left/treecko.gif",
  "/landing_page/animated_sprites/bottom_left/turtwig.gif"
];

const BOTTOM_RIGHT_SPRITES = [
  "/landing_page/animated_sprites/bottom_right/absol.gif",
  "/landing_page/animated_sprites/bottom_right/aggron.gif",
  "/landing_page/animated_sprites/bottom_right/altaria.gif",
  "/landing_page/animated_sprites/bottom_right/arcanine.gif",
  "/landing_page/animated_sprites/bottom_right/corviknight.gif",
  "/landing_page/animated_sprites/bottom_right/donphan.gif",
  "/landing_page/animated_sprites/bottom_right/dragapult.gif",
  "/landing_page/animated_sprites/bottom_right/dragonite.gif",
  "/landing_page/animated_sprites/bottom_right/electivire.gif",
  "/landing_page/animated_sprites/bottom_right/flygon.gif",
  "/landing_page/animated_sprites/bottom_right/garchomp.gif",
  "/landing_page/animated_sprites/bottom_right/gardevoir.gif",
  "/landing_page/animated_sprites/bottom_right/gengar.gif",
  "/landing_page/animated_sprites/bottom_right/goodra.gif",
  "/landing_page/animated_sprites/bottom_right/gyarados.gif",
  "/landing_page/animated_sprites/bottom_right/hydreigon.gif",
  "/landing_page/animated_sprites/bottom_right/kommoo.gif",
  "/landing_page/animated_sprites/bottom_right/krookodile.gif",
  "/landing_page/animated_sprites/bottom_right/lapras.gif",
  "/landing_page/animated_sprites/bottom_right/lucario.gif",
  "/landing_page/animated_sprites/bottom_right/luxray.gif",
  "/landing_page/animated_sprites/bottom_right/metagross.gif",
  "/landing_page/animated_sprites/bottom_right/nidoking.gif",
  "/landing_page/animated_sprites/bottom_right/nidoqueen.gif",
  "/landing_page/animated_sprites/bottom_right/ninetales.gif",
  "/landing_page/animated_sprites/bottom_right/pangoro.gif",
  "/landing_page/animated_sprites/bottom_right/salamence.gif",
  "/landing_page/animated_sprites/bottom_right/scizor.gif",
  "/landing_page/animated_sprites/bottom_right/snorlax.gif",
  "/landing_page/animated_sprites/bottom_right/staraptor.gif",
  "/landing_page/animated_sprites/bottom_right/toxtricity.gif",
  "/landing_page/animated_sprites/bottom_right/trevenant.gif",
  "/landing_page/animated_sprites/bottom_right/tyranitar.gif",
  "/landing_page/animated_sprites/bottom_right/zoroark.gif"
];

const FINAL_EVO_STARTERS = [
  { name: "Blastoise", src: "/landing_page/animated_sprites/final_evo_starters/blastoise.gif", fallback: 9 },
  { name: "Blaziken", src: "/landing_page/animated_sprites/final_evo_starters/blaziken.gif", fallback: 257 },
  { name: "Charizard", src: "/landing_page/animated_sprites/final_evo_starters/charizard.gif", fallback: 6 },
  { name: "Emboar", src: "/landing_page/animated_sprites/final_evo_starters/emboar.gif", fallback: 500 },
  { name: "Empoleon", src: "/landing_page/animated_sprites/final_evo_starters/empoleon.gif", fallback: 395 },
  { name: "Feraligatr", src: "/landing_page/animated_sprites/final_evo_starters/feraligatr.gif", fallback: 160 },
  { name: "Greninja", src: "/landing_page/animated_sprites/final_evo_starters/greninja.gif", fallback: 658 },
  { name: "Incineroar", src: "/landing_page/animated_sprites/final_evo_starters/incineroar.gif", fallback: 727 },
  { name: "Infernape", src: "/landing_page/animated_sprites/final_evo_starters/infernape.gif", fallback: 392 },
  { name: "Meganium", src: "/landing_page/animated_sprites/final_evo_starters/meganium.gif", fallback: 154 },
  { name: "Primarina", src: "/landing_page/animated_sprites/final_evo_starters/primarina.gif", fallback: 730 },
  { name: "Samurott", src: "/landing_page/animated_sprites/final_evo_starters/samurott.gif", fallback: 503 },
  { name: "Sceptile", src: "/landing_page/animated_sprites/final_evo_starters/sceptile.gif", fallback: 254 },
  { name: "Serperior", src: "/landing_page/animated_sprites/final_evo_starters/serperior.gif", fallback: 497 },
  { name: "Swampert", src: "/landing_page/animated_sprites/final_evo_starters/swampert.gif", fallback: 260 },
  { name: "Torterra", src: "/landing_page/animated_sprites/final_evo_starters/torterra.gif", fallback: 389 },
  { name: "Typhlosion", src: "/landing_page/animated_sprites/final_evo_starters/typhlosion.gif", fallback: 157 },
  { name: "Venusaur", src: "/landing_page/animated_sprites/final_evo_starters/venusaur.gif", fallback: 3 }
];

// Poké Ball SVG Icon matching actual SearchBar
function PokeballIcon({ style = {}, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1.2em"
      height="1.2em"
      style={{ display: "block", ...style }}
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="none" />
      <path d="M2 12h20" />
      <circle cx="12" cy="12" r="3" fill="none" />
      <circle cx="12" cy="12" r="1" fill="none" />
    </svg>
  );
}

// Category mappings with live data sources
const CATEGORY_MAP = {
  "Main Living Dex": {
    title: "Main Living Dex",
    data: pokemonData,
    boxName: (idx) => (idx === 0 ? "0001 - 0030" : "0031 - 0060")
  },
  "Gender": {
    title: "Gender Differences",
    data: genderForms,
    boxName: (idx) => `Gender Forms Box ${idx + 1}`
  },
  "Alola": {
    title: "Alolan Forms",
    data: alolanForms,
    boxName: (idx) => `Alolan Forms Box ${idx + 1}`
  },
  "Galar": {
    title: "Galarian Forms",
    data: galarianForms,
    boxName: (idx) => `Galarian Forms Box ${idx + 1}`
  },
  "Gmax": {
    title: "Gigantamax Forms",
    data: gmaxForms,
    boxName: (idx) => `Gmax Forms Box ${idx + 1}`
  },
  "Hisui": {
    title: "Hisuian Forms",
    data: hisuianForms,
    boxName: (idx) => `Hisuian Forms Box ${idx + 1}`
  },
  "Paldea": {
    title: "Paldean Forms",
    data: paldeanForms,
    boxName: (idx) => `Paldean Forms Box ${idx + 1}`
  },
  "Unown": {
    title: "Unown Forms",
    data: unownForms,
    boxName: (idx) => `Unown's Box ${idx + 1}`
  },
  "Other Forms": {
    title: "Other Forms",
    data: otherForms,
    boxName: (idx) => `Other Forms Box ${idx + 1}`
  },
  "Alcremie": {
    title: "Alcremie Forms",
    data: alcremieForms,
    boxName: (idx) => `Alcremie's Box ${idx + 1}`
  },
  "Vivillon": {
    title: "Vivillon Forms",
    data: vivillonForms,
    boxName: (idx) => `Vivillon's Box ${idx + 1}`
  },
  "Alpha": {
    title: "Alpha Forms",
    data: alphaForms,
    boxName: (idx) => `Alpha Forms Box ${idx + 1}`
  }
};

export default function PublicHome() {
  const [totalCaught, setTotalCaught] = useState(null);
  const [displayCount, setDisplayCount] = useState(22560);
  const [activeSection, setActiveSection] = useState(0);
  const [isHeroShiny, setIsHeroShiny] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next"); // "next" | "prev"
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const transitionTimeoutRef = useRef(null);
  const touchStartXRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Main Living Dex");
  const heroTiltRef = useRef(null);

  // Randomize hero sprites on each page land
  const [heroSprites] = useState(() => ({
    topRight: TOP_RIGHT_SPRITES[Math.floor(Math.random() * TOP_RIGHT_SPRITES.length)],
    bottomLeft: BOTTOM_LEFT_SPRITES[Math.floor(Math.random() * BOTTOM_LEFT_SPRITES.length)],
    bottomRight: BOTTOM_RIGHT_SPRITES[Math.floor(Math.random() * BOTTOM_RIGHT_SPRITES.length)]
  }));

  // Randomize final evolution starter sprites for CTA banner
  const [randomStarters] = useState(() => {
    const idx1 = Math.floor(Math.random() * FINAL_EVO_STARTERS.length);
    let idx2 = Math.floor(Math.random() * (FINAL_EVO_STARTERS.length - 1));
    if (idx2 >= idx1) idx2++;
    return {
      left: FINAL_EVO_STARTERS[idx1],
      right: FINAL_EVO_STARTERS[idx2]
    };
  });

  // Global 3D Tilt effect: hooks onto mouse when interacting, and plays smooth floating animation when unhooked
  useEffect(() => {
    let rafId = null;
    let isHooked = false;
    let idleTimer = null;
    let mouseOffsetX = 0;
    let mouseOffsetY = 0;

    const baseTiltX = 5.2;  // Tilted up
    const baseTiltY = -5.0; // Tilted to the left
    let currentX = baseTiltX;
    let currentY = baseTiltY;
    let currentTranslateY = 0;

    const handleMouseMove = (e) => {
      const width = window.innerWidth;
      if (width <= 900) return;

      const card = heroTiltRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      // Distance from mouse to card center
      const dx = e.clientX - cardCenterX;
      const dy = e.clientY - cardCenterY;

      // Hook when mouse is over or near the hero section
      const maxDistanceX = Math.max(window.innerWidth * 0.45, 450);
      const maxDistanceY = Math.max(window.innerHeight * 0.55, 380);

      if (Math.abs(dx) < maxDistanceX && Math.abs(dy) < maxDistanceY) {
        isHooked = true;
        const maxRotate = 4.8;
        const normalizedY = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
        const normalizedX = Math.max(-1, Math.min(1, dx / (rect.width / 2)));

        mouseOffsetY = -normalizedY * maxRotate;
        mouseOffsetX = normalizedX * maxRotate;

        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          isHooked = false; // Unhook when idle
        }, 1600);
      } else {
        isHooked = false; // Unhook when mouse leaves hero area
      }
    };

    const handleMouseLeave = () => {
      isHooked = false;
      if (idleTimer) clearTimeout(idleTimer);
    };

    const animateTilt = (now) => {
      if (window.innerWidth <= 900) {
        if (heroTiltRef.current) {
          heroTiltRef.current.style.transform = "none";
        }
        rafId = requestAnimationFrame(animateTilt);
        return;
      }

      // Soft harmonic floating breathing that plays when unhooked
      const time = (now || performance.now()) * 0.00075;
      const idleTiltX = baseTiltX + Math.sin(time * 1.1) * 0.8;
      const idleTiltY = baseTiltY + Math.cos(time * 0.9) * 0.9;
      const idleFloatY = Math.sin(time * 1.1) * 4.0;

      let targetX = baseTiltX;
      let targetY = baseTiltY;
      let targetTranslateY = 0;

      if (isHooked) {
        targetX = baseTiltX + mouseOffsetY;
        targetY = baseTiltY + mouseOffsetX;
        targetTranslateY = mouseOffsetY * 0.8;
      } else {
        // Play floating animation when unhooked
        targetX = idleTiltX;
        targetY = idleTiltY;
        targetTranslateY = idleFloatY;
      }

      // Smooth liquid transition between hooked and unhooked states
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;
      currentTranslateY += (targetTranslateY - currentTranslateY) * 0.045;

      if (heroTiltRef.current) {
        heroTiltRef.current.style.transform = `perspective(1200px) translateY(${currentTranslateY.toFixed(2)}px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`;
      }
      rafId = requestAnimationFrame(animateTilt);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    rafId = requestAnimationFrame(animateTilt);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (idleTimer) clearTimeout(idleTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Interactive caught state across all categories (persisting by unique caught key)
  // Start empty — the interactive demo should show 0 caught by default
  const [caughtPokemonMap, setCaughtPokemonMap] = useState(() => new Set());

  // Mobile search & filters collapse state (collapsed by default on mobile matching actual app)
  const [mobileSearchCollapsed, setMobileSearchCollapsed] = useState(true);

  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Total dex forms calculation
  // When shiny mode is on, exclude mighty forms (54 entries) as they cannot be shiny
  const mightyFormsCount = useMemo(() => formsData.filter(f => f.formType === 'mighty').length, []);
  const totalDexCount = useMemo(
    () => isHeroShiny
      ? pokemonData.length + formsData.length - mightyFormsCount
      : pokemonData.length + formsData.length,
    [isHeroShiny, mightyFormsCount]
  );

  // Active Category Data & Boxes
  const currentCategory = CATEGORY_MAP[activeTab] || CATEGORY_MAP["Main Living Dex"];
  const currentList = useMemo(() => currentCategory.data || [], [currentCategory]);

  const box1List = useMemo(() => currentList.slice(0, 30), [currentList]);
  const box2List = useMemo(() => currentList.slice(30, 60), [currentList]);

  // Box Titles
  const box1Title = useMemo(() => {
    if (!box1List.length) return "Box 1";
    if (activeTab === "Main Living Dex") {
      return `${String(box1List[0]?.id || 1).padStart(4, "0")} - ${String(box1List[box1List.length - 1]?.id || 30).padStart(4, "0")}`;
    }
    return currentCategory.boxName(0);
  }, [box1List, activeTab, currentCategory]);

  const box2Title = useMemo(() => {
    if (!box2List.length) return null;
    if (activeTab === "Main Living Dex") {
      return `${String(box2List[0]?.id || 31).padStart(4, "0")} - ${String(box2List[box2List.length - 1]?.id || 60).padStart(4, "0")}`;
    }
    return currentCategory.boxName(1);
  }, [box2List, activeTab, currentCategory]);

  // Total Caught Count for Progress Bar
  const caughtCount = useMemo(() => caughtPokemonMap.size, [caughtPokemonMap]);

  const togglePokemonCaught = (poke) => {
    const key = getCaughtKey(poke, null, false);
    setCaughtPokemonMap((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleToggleBox = (pokemonList) => {
    setCaughtPokemonMap((prev) => {
      const next = new Set(prev);
      const allCaught = pokemonList.every((p) => next.has(getCaughtKey(p, null, false)));
      if (allCaught) {
        pokemonList.forEach((p) => next.delete(getCaughtKey(p, null, false)));
      } else {
        pokemonList.forEach((p) => next.add(getCaughtKey(p, null, false)));
      }
      return next;
    });
  };

  // Fetch live caught stats if available
  useEffect(() => {
    fetch(buildApiUrl('/profiles/stats/total-caught'))
      .then(r => r.json())
      .then(data => {
        if (typeof data.total === 'number' && data.total > 0) {
          setTotalCaught(data.total);
        }
      })
      .catch(() => {/* silently fail */});
  }, []);

  // Animated count-up for live caught stat
  useEffect(() => {
    if (totalCaught === null) return;
    const duration = 1500;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayCount(Math.floor(easeOut(progress) * totalCaught));
      if (progress < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [totalCaught]);

  // Handle scroll snap tracking for indicator dots
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const sectionIndex = Math.round(scrollTop / height);
    if (sectionIndex !== activeSection) {
      setActiveSection(sectionIndex);
    }
  };

  const scrollToSection = (index) => {
    if (!containerRef.current) return;
    const sections = containerRef.current.querySelectorAll(".snap-section");
    if (sections[index]) {
      sections[index].scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } else {
      const height = containerRef.current.clientHeight;
      containerRef.current.scrollTo({
        top: index * height,
        behavior: "smooth"
      });
    }
    setActiveSection(index);
  };

  // Categories list matching site
  const categories = [
    "Main Living Dex",
    "Gender",
    "Alola",
    "Galar",
    "Gmax",
    "Hisui",
    "Paldea",
    "Unown",
    "Other Forms",
    "Alcremie",
    "Vivillon",
    "Alpha"
  ];

  // Carousel Slides for Section 3
  const showcaseSlides = [
    {
      id: "detailed-tracking",
      badge: "DETAILED POKEMON LOGS",
      title: "Detailed Pokemon Logs",
      description: "Save extensive details for every caught Pokémon in your Living Dex.",
      image: "/landing_page/images/sidebar-and-grid.png",
      imageAlt: "Detailed Pokémon Sidebar & Living Dex Grid Preview",
      bullets: [
        "Log caught games & Poké Balls",
        "Track marks & ribbon completion",
        "Record custom notes & caught dates",
        "Save encounter checks & hunt data",
        "Filter and search by custom criteria"
      ],
      ctaText: "Start Tracking",
      ctaLink: "/dex"
    },
    {
      id: "hunt-tracker",
      badge: "TRACK EVERY HUNT",
      title: "Powerful Hunt Tracker",
      description: "Keep track of every shiny hunt with our advanced counter tools.",
      image: "/landing_page/images/counter.png",
      imageAlt: "Shiny Hunt Tracker Interface Preview",
      bullets: [
        "Encounter counter with hotkeys",
        "Timer with pause & resume",
        "Odds calculation in real-time",
        "Phase tracking",
        "Multiple hunts at once"
      ],
      ctaText: "Try Hunt Tracker",
      ctaLink: "/counters"
    },
    {
      id: "mmo-tracker",
      badge: "LEGENDS ARCEUS TOOL",
      title: "MMO Tracker",
      description: "Optimize your Hisui shiny hunts with our custom permutation tracker.",
      image: "/landing_page/images/mmo.png",
      imageAlt: "Massive Mass Outbreak Permutation Tracker Preview",
      bullets: [
        "Permutation path calculation",
        "Interactive permutation charts",
        "Ghost spawn & bonus wave support",
        "Step-by-step despawn routing",
        "Live sync with your hunts"
      ],
      ctaText: "Open MMO Tool",
      ctaLink: "/mmo"
    },
    {
      id: "collection-statistics",
      badge: "DETAILED STATISTICS",
      title: "Detailed Stats",
      description: "Beautiful charts and statistics to visualize your progress.",
      image: "/landing_page/images/stats.png",
      imageAlt: "Collection Statistics Dashboard Preview",
      bullets: [
        "Collection breakdowns",
        "Shiny progress tracking",
        "Game & ball statistics",
        "Mark & ribbon completion",
        "Hunt history and analytics"
      ],
      ctaText: "Explore Stats",
      ctaLink: "/trainers"
    },
    {
      id: "connect-trainers",
      badge: "SHARE & COMPARE",
      title: "Connect With Trainers",
      description: "Create your public profile and compare your collection with others.",
      image: "/landing_page/images/share.png",
      imageAlt: "Trainer Profile Sharing Preview",
      bullets: [
        "Public trainer profiles",
        "Share your collections",
        "Compare progress",
        "Global leaderboards",
        "Community driven"
      ],
      ctaText: "Explore Trainers",
      ctaLink: "/trainers"
    },
    {
      id: "global-leaderboards",
      badge: "COMPETITIVE RANKS",
      title: "Detailed Leaderboards",
      description: "Compete with collectors worldwide and climb the shiny dex rankings.",
      image: "/landing_page/images/leaderboard.png",
      imageAlt: "Community Leaderboard Standings Preview",
      bullets: [
        "Overall shiny dex rankings",
        "Category & regional leaderboards",
        "Track top hunt streaks",
        "Real-time leaderboard updates",
        "Supporter & trainer badges"
      ],
      ctaText: "View Leaderboard",
      ctaLink: "/leaderboard"
    }
  ];

  const goToSlide = (newIndex, direction) => {
    if (isTransitioning || newIndex === activeSlide) return;
    setIsTransitioning(true);
    setSlideDirection(direction);
    setActiveSlide(newIndex);
    setSparkleKey((prev) => prev + 1);

    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 460);
  };

  const handleNextSlide = () => {
    const nextIndex = (activeSlide + 1) % showcaseSlides.length;
    goToSlide(nextIndex, "next");
  };

  const handlePrevSlide = () => {
    const prevIndex = (activeSlide - 1 + showcaseSlides.length) % showcaseSlides.length;
    goToSlide(prevIndex, "prev");
  };

  const handleDotClick = (index) => {
    if (index === activeSlide || isTransitioning) return;
    goToSlide(index, index > activeSlide ? "next" : "prev");
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) handleNextSlide();
      else handlePrevSlide();
    }
    touchStartXRef.current = null;
  };

  // Add landing-page-active class to body while mounted to hide custom site scrollbars
  useEffect(() => {
    document.body.classList.add("landing-page-active");
    return () => {
      document.body.classList.remove("landing-page-active");
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // Intercept scroll wheel on landing page — desktop only
  // On mobile, the page is free-scrolling (no snap pages)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Skip on mobile — let it scroll naturally
    if (window.innerWidth <= 900) return;

    let isWheeling = false;
    let wheelTimer = null;

    const handleWheel = (e) => {
      const delta = e.deltaY;
      if (Math.abs(delta) < 14) return;

      e.preventDefault();

      if (isWheeling) return;
      isWheeling = true;

      const sections = container.querySelectorAll(".snap-section");
      if (!sections.length) return;

      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const currentIdx = Math.round(scrollTop / height);

      let targetIdx = currentIdx;
      if (delta > 0 && currentIdx < sections.length - 1) {
        targetIdx = currentIdx + 1;
      } else if (delta < 0 && currentIdx > 0) {
        targetIdx = currentIdx - 1;
      }

      if (targetIdx !== currentIdx && sections[targetIdx]) {
        sections[targetIdx].scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        setActiveSection(targetIdx);
      }

      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        isWheeling = false;
      }, 650);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, []);

  return (
    <div className="public-home-snap-container" ref={containerRef} onScroll={handleScroll}>
      {/* Dynamic Animated Ambient Background Layer with Floating SVGs */}
      <div className="landing-ambient-bg-layer" aria-hidden="true">
        {/* Floating Pokéball 1 (Top Right) */}
        <div className="ambient-float-item ambient-pokeball item-1" />

        {/* Floating Pikachu Silhouette (Bottom Left) */}
        <div className="ambient-float-item ambient-pikachu item-2" />

        {/* Floating Sparkle 1 (Mid Right) */}
        <div className="ambient-float-item ambient-sparkle1 item-3" />

        {/* Floating Pokéball 3 (Top Left) */}
        <div className="ambient-float-item ambient-pokeball item-4" />

        {/* Floating Pokéball 2 (Lower Right) */}
        <div className="ambient-float-item ambient-pokeball item-5" />

        {/* Floating Sparkle 3 (Lower Center) */}
        <div className="ambient-float-item ambient-sparkle3 item-6" />

        {/* Floating Sparkle 2 (Mid Left) */}
        <div className="ambient-float-item ambient-sparkle2 item-7" />

        {/* Floating Sparkle 3 (Upper Center / Right) */}
        <div className="ambient-float-item ambient-sparkle3 item-8" />
      </div>

      {/* Floating Side Section Indicator Dots */}
      <nav className="section-nav-indicators" aria-label="Page Sections">
        <button
          className={`section-indicator-dot ${activeSection === 0 ? "active" : ""}`}
          onClick={() => scrollToSection(0)}
          aria-label="Go to Hero section"
        >
          <span className="indicator-tooltip">Welcome</span>
        </button>
        <button
          className={`section-indicator-dot ${activeSection === 1 ? "active" : ""}`}
          onClick={() => scrollToSection(1)}
          aria-label="Go to Features section"
        >
          <span className="indicator-tooltip">Master Collection</span>
        </button>
        <button
          className={`section-indicator-dot ${activeSection === 2 ? "active" : ""}`}
          onClick={() => scrollToSection(2)}
          aria-label="Go to Showcase section"
        >
          <span className="indicator-tooltip">Tools & Start</span>
        </button>
      </nav>

      {/* =========================================================================
          SECTION 1: HERO SECTION (Exact 100% Accurate Replica of Live Site Dex)
          ========================================================================= */}
      <section className="snap-section hero-snap-section">
        {/* Subtle background glow */}
        <div className="hero-bg-watermark" />

        <div className="hero-snap-inner">
          {/* Left Column */}
          <div className="hero-snap-left">
            <div className="hero-platform-badge">
              <Sparkles size={14} className="sparkle-badge" />
              <span>THE ULTIMATE POKÉMON COLLECTION PLATFORM</span>
            </div>

            <h1 className="hero-main-title">
              Welcome to<br />
              <span className="hero-gradient-text">Ultimate<br />Dex Tracker!</span>
            </h1>

            <p className="hero-main-desc">
              The most powerful all-in-one tracker for your Pokémon collection and shiny hunting journey.
            </p>

            {/* Metric Stat Counters */}
            <div className="hero-stats-row">
              <div className="hero-stat-pill">
                <div className="stat-pill-icon globe-icon-wrap"><Globe size={30} /></div>
                <div className="stat-pill-text">
                  <span className="stat-pill-num">{displayCount.toLocaleString()}+</span>
                  <span className="stat-pill-desc">Pokémon tracked worldwide</span>
                </div>
              </div>

              <div className="hero-stat-pill">
                <div className="stat-pill-icon pikachu-icon-wrap">
                  <span
                    className="stat-pill-pikachu-img"
                    aria-label="Pokémon Forms &amp; Variants"
                  />
                </div>
                <div className="stat-pill-text">
                  <span className="stat-pill-num">{((pokemonData.length + formsData.length) * 2).toLocaleString()}</span>
                  <span className="stat-pill-desc">Pokémon Forms &amp; Variants</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hero-action-buttons">
              <Button
                as={Link}
                to="/register"
                variant="primary"
                size="lg"
                icon={<SquarePen size={18} />}
              >
                Get Started Free
              </Button>
              <Button
                as={Link}
                to="/trainers"
                variant="secondary"
                size="lg"
                icon={<Users size={18} />}
              >
                Explore Trainers
              </Button>
            </div>

            <div className="hero-account-link">
              <span>Already have an account? </span>
              <Link to="/login" className="login-link">Log in</Link>
            </div>
          </div>

          {/* Right Column: 100% Pixel-Accurate Interactive Living Dex Frame with 3D Mouse Tilt */}
          <div className="hero-snap-right">
            <div
              ref={heroTiltRef}
              className="hero-dex-interactive-port-wrapper"
            >
              {/* Surrounding Floating Pokémon Sprites (Randomized per spot on page land) */}
              <div className="floating-sprite sprite-mew sprite-top-right">
                <img
                  src={heroSprites.topRight}
                  alt="Mythical Pokémon"
                  className="floating-pokemon-img"
                  onError={(e) => { e.target.src = "/landing_page/animated_sprites/top_right/mew.gif"; }}
                />
              </div>

              <div className="floating-sprite sprite-gyarados sprite-bottom-right">
                <img
                  src={heroSprites.bottomRight}
                  alt="Epic Pokémon"
                  className="floating-pokemon-img"
                  onError={(e) => { e.target.src = "/landing_page/animated_sprites/bottom_right/gyarados.gif"; }}
                />
              </div>

              <div className="floating-sprite sprite-pikachu sprite-bottom-left">
                <img
                  src={heroSprites.bottomLeft}
                  alt="Starter Pokémon"
                  className="floating-pokemon-img"
                  onError={(e) => { e.target.src = "/landing_page/animated_sprites/bottom_left/pikachu.gif"; }}
                />
              </div>

              {/* Exact Live Website Dex Card Frame */}
              <div className="real-site-dex-container">
                {/* 1. Progress Bars Container */}
                <div className="real-progress-box">
                  <div className="real-progress-top-row">
                    <span className="real-progress-heading">Progress Bars</span>
                    <button className="real-progress-settings-btn" title="Progress Bar Settings">
                      <Settings size={17} style={{ color: "var(--accent)" }} />
                    </button>
                  </div>

                  <div className="real-progress-inner-card">
                    <div className="real-progress-meta-line">
                      <span className="real-meta-title">All Pokémon</span>
                      <span className="real-meta-stats">
                        {caughtCount} / {totalDexCount} • {((caughtCount / totalDexCount) * 100).toFixed(0)}% done! • {totalDexCount - caughtCount} to go!
                      </span>
                    </div>
                    <div className="real-progress-track">
                      <div
                        className="real-progress-bar-fill"
                        style={{ width: `${Math.max(0.5, (caughtCount / totalDexCount) * 100)}%`, opacity: caughtCount === 0 ? 0.25 : 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. SearchBar and Dropdowns Container */}
                <div className="real-searchbar-container">
                  {/* Mobile-only Header — toggle button is display-only, no action on demo */}
                  <div className="real-searchbar-mobile-header">
                    <h3 className="real-searchbar-mobile-title">Search &amp; Filters</h3>
                    <button
                      type="button"
                      className="real-searchbar-toggle-btn"
                      aria-label="Expand search options"
                    >
                      <ListCollapse size={20} strokeWidth={3} style={{ color: "var(--accent)" }} />
                    </button>
                  </div>

                  <div className="real-searchbar-grid">
                    {/* Name/Dex Input (Always visible on PC and Mobile) */}
                    <div className="real-search-field">
                      <Search size={16} className="real-search-icon" style={{ color: "var(--accent)" }} />
                      <input
                        type="text"
                        placeholder="Name or Dex #"
                        className="real-search-input"
                        readOnly
                      />
                    </div>

                    {/* Filter Dropdown Options (Collapsible on mobile only, always visible on PC) */}
                    <div className={`real-search-collapsible-group ${mobileSearchCollapsed ? "mobile-collapsed" : "mobile-expanded"}`}>
                      {/* Filter Dropdown 1: Game Caught */}
                      <div className="real-dropdown-field">
                        <Gamepad2 size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Game Caught</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 2: Game Obtainable In */}
                      <div className="real-dropdown-field">
                        <Gamepad2 size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Game Obtainable In</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 3: Ball Caught */}
                      <div className="real-dropdown-field">
                        <PokeballIcon />
                        <span className="real-dropdown-label">Ball Caught</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 4: Type */}
                      <div className="real-dropdown-field">
                        <Flame size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Type</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 5: Generation */}
                      <div className="real-dropdown-field">
                        <Hash size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Generation</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 6: Mark/Ribbon */}
                      <div className="real-dropdown-field">
                        <Award size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Mark/Ribbon</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 7: Hunt Method */}
                      <div className="real-dropdown-field">
                        <BullseyeIcon size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Hunt Method</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 8: Category */}
                      <div className="real-dropdown-field">
                        <Crown size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Category</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Filter Dropdown 9: Caught/Uncaught */}
                      <div className="real-dropdown-field">
                        <Star size={16} style={{ color: "var(--accent)" }} />
                        <span className="real-dropdown-label">Caught/Uncaught</span>
                        <ChevronDown size={14} className="real-dropdown-caret" style={{ color: "var(--accent)" }} />
                      </div>
                    </div>
                  </div>

                  {/* Shiny Switch and Charm Bar */}
                  <div className="real-searchbar-bottom-row">
                    <button className="real-shiny-charm-btn" title="Manage Shiny Charm">
                      <img
                        src="/Charm.png"
                        alt="Shiny Charm"
                        className="real-shiny-charm-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </button>

                    <div className="dex-shiny-segmented-control" role="group" aria-label="Demo Pokemon sprite display mode">
                      <button
                        type="button"
                        className={`dex-shiny-segmented-btn ${!isHeroShiny ? 'active is-regular' : ''}`}
                        onClick={() => setIsHeroShiny(false)}
                        title="Show regular Pokémon sprites"
                      >
                        <span className="dex-segmented-dot" />
                        <span>Regular</span>
                      </button>
                      <button
                        type="button"
                        className={`dex-shiny-segmented-btn ${isHeroShiny ? 'active is-shiny' : ''}`}
                        onClick={() => setIsHeroShiny(true)}
                        title="Show shiny Pokémon sprites"
                      >
                        <Sparkles size={16} className={`dex-segmented-sparkles ${isHeroShiny ? 'active' : ''}`} />
                        <span>Shiny</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Category Tabs Bar */}
                <div className="real-dex-tabs-bar">
                  {categories.map((cat, idx) => (
                    <div key={cat} className="real-tab-item-wrap">
                      <button
                        className={`real-dex-tab-btn ${activeTab === cat ? "active" : ""}`}
                        onClick={() => setActiveTab(cat)}
                      >
                        {cat}
                      </button>
                      {idx < categories.length - 1 && <span className="real-tab-divider" />}
                    </div>
                  ))}
                </div>

                {/* 4. Section Title & Divider */}
                <div className="real-dex-section-header">
                  <h2 className="real-dex-title">{currentCategory.title}</h2>
                  <div className="real-dex-subtitle">{`Showing ${currentList.length} Pokémon`}</div>
                  <div className="real-dex-divider-glow" />
                </div>

                {/* 5. First 2 Boxes Grid for the Selected Category */}
                <div className={`real-dex-boxes-row ${!box2List.length ? "single-box" : ""}`}>
                  {/* Box 1 */}
                  {box1List.length > 0 && (
                    <div className="real-dex-box-container">
                      <div className="real-box-header">
                        <span className="real-box-title">{box1Title}</span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleToggleBox(box1List)}
                        >
                          {box1List.every((p) => caughtPokemonMap.has(getCaughtKey(p, null, false))) ? "Unmark All" : "Mark All"}
                        </Button>
                      </div>

                      <div className="real-pokemon-grid">
                        {Array.from({ length: 30 }).map((_, pIdx) => {
                          const poke = box1List[pIdx];
                          if (!poke) {
                            return (
                              <div
                                key={`b1_empty_${pIdx}`}
                                className="real-pokemon-slot empty"
                                style={{ visibility: "hidden", pointerEvents: "none" }}
                                aria-hidden="true"
                              />
                            );
                          }
                          const key = getCaughtKey(poke, null, false);
                          const isCaught = caughtPokemonMap.has(key);
                          const sprite = getSpriteUrl(poke, isHeroShiny, false);
                          const displayName = formatPokemonName(poke.name);
                          const dexNum = poke.id ? `#${String(poke.id).padStart(4, "0")}` : "????";

                          return (
                            <div
                              key={`${key}_${pIdx}`}
                              className={`real-pokemon-slot ${isCaught ? "caught" : ""}`}
                              onClick={() => togglePokemonCaught(poke)}
                              title={`Click to toggle ${displayName} caught`}
                            >
                              <span className="real-slot-name">{displayName}</span>
                              <img
                                src={sprite}
                                alt={displayName}
                                className="real-slot-sprite"
                                loading="eager"
                                onError={(e) => {
                                  e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id || 1}.png`;
                                }}
                              />
                              <span className="real-slot-num">{dexNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Box 2 (if available in this category) */}
                  {box2List.length > 0 && (
                    <div className="real-dex-box-container">
                      <div className="real-box-header">
                        <span className="real-box-title">{box2Title}</span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleToggleBox(box2List)}
                        >
                          {box2List.every((p) => caughtPokemonMap.has(getCaughtKey(p, null, false))) ? "Unmark All" : "Mark All"}
                        </Button>
                      </div>

                      <div className="real-pokemon-grid">
                        {Array.from({ length: 30 }).map((_, pIdx) => {
                          const poke = box2List[pIdx];
                          if (!poke) {
                            return (
                              <div
                                key={`b2_empty_${pIdx}`}
                                className="real-pokemon-slot empty"
                                style={{ visibility: "hidden", pointerEvents: "none" }}
                                aria-hidden="true"
                              />
                            );
                          }
                          const key = getCaughtKey(poke, null, false);
                          const isCaught = caughtPokemonMap.has(key);
                          const sprite = getSpriteUrl(poke, isHeroShiny, false);
                          const displayName = formatPokemonName(poke.name);
                          const dexNum = poke.id ? `#${String(poke.id).padStart(4, "0")}` : "????";

                          return (
                            <div
                              key={`${key}_${pIdx}`}
                              className={`real-pokemon-slot ${isCaught ? "caught" : ""}`}
                              onClick={() => togglePokemonCaught(poke)}
                              title={`Click to toggle ${displayName} caught`}
                            >
                              <span className="real-slot-name">{displayName}</span>
                              <img
                                src={sprite}
                                alt={displayName}
                                className="real-slot-sprite"
                                loading="eager"
                                onError={(e) => {
                                  e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id || 1}.png`;
                                }}
                              />
                              <span className="real-slot-num">{dexNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Switch Arrow Button for Page 1 (Down to Page 2) */}
        <button
          className="scroll-hint-arrow scroll-hint-arrow-down"
          onClick={() => scrollToSection(1)}
          aria-label="Scroll down to master collection section"
        >
          <ChevronDown size={22} />
        </button>
      </section>

      {/* =========================================================================
          SECTION 2: MASTER YOUR COLLECTION (Image 2)
          ========================================================================= */}
      <section className="snap-section features-snap-section">
        {/* Page Switch Arrow Button for Page 2 (Up to Page 1) */}
        <button
          className="scroll-hint-arrow scroll-hint-arrow-top"
          onClick={() => scrollToSection(0)}
          aria-label="Scroll up to welcome section"
        >
          <ChevronUp size={22} />
        </button>

        <div className="section-header-wrap">
          <h2 className="section-title-large">Everything you need to master your collection</h2>
          <p className="section-subtitle">Powerful tools designed for every type of Pokémon trainer.</p>
        </div>

        <div className="master-features-grid">
          {/* Card 1 */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper accent-glow">
              <Grid2x2Check size={46} className="feature-lucide-icon accent" />
            </div>
            <h3 className="master-card-title">Living Dex Tracking</h3>
            <p className="master-card-desc">
              Track every Pokémon, form, variant, and regional difference.
            </p>
          </div>

          {/* Card 2 */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper red-glow">
              <Crosshair size={46} className="feature-lucide-icon red" />
            </div>
            <h3 className="master-card-title">Shiny Hunting Counters</h3>
            <p className="master-card-desc">
              Count encounters, track time, odds, and hunting methods.
            </p>
          </div>

          {/* Card 3 */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper blue-glow">
              <BarChart3 size={46} className="feature-lucide-icon blue" />
            </div>
            <h3 className="master-card-title">Detailed Statistics</h3>
            <p className="master-card-desc">
              In-depth stats for games, types, balls, marks and more.
            </p>
          </div>

          {/* Card 4 */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper gold-glow">
              <Ribbon size={46} className="feature-lucide-icon gold" />
            </div>
            <h3 className="master-card-title">Marks & Ribbons</h3>
            <p className="master-card-desc">
              Track every mark and ribbon in your collection.
            </p>
          </div>

          {/* Card 5 */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper white-glow">
              <div className="icon-pokeball-graphic" />
            </div>
            <h3 className="master-card-title">Poké Ball Vault</h3>
            <p className="master-card-desc">
              See all obtainable balls and track your collection.
            </p>
          </div>

          {/* Card 6 */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper purple-glow">
              <Users size={46} className="feature-lucide-icon purple" />
            </div>
            <h3 className="master-card-title">Trainer Profiles</h3>
            <p className="master-card-desc">
              Share your collection and compare with other trainers.
            </p>
          </div>

          {/* Card 7: MMO Tool */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper orange-glow">
              <ListChecks size={46} className="feature-lucide-icon orange" />
            </div>
            <h3 className="master-card-title">MMO Outbreak Tool</h3>
            <p className="master-card-desc">
              Find active massive mass outbreaks, locations, and spawn odds.
            </p>
          </div>

          {/* Card 8: BINGO */}
          <div className="master-feature-card">
            <div className="feature-icon-wrapper emerald-glow">
              <Grid3x3 size={46} className="feature-lucide-icon emerald" />
            </div>
            <h3 className="master-card-title">Shiny Bingo</h3>
            <p className="master-card-desc">
              Generate custom shiny bingo boards to hunt with friends or solo.
            </p>
          </div>
        </div>

        {/* Page Switch Arrow Button for Page 2 (Down to Page 3) */}
        <button
          className="scroll-hint-arrow scroll-hint-arrow-down"
          onClick={() => scrollToSection(2)}
          aria-label="Scroll down to tools and showcase section"
        >
          <ChevronDown size={22} />
        </button>
      </section>

      {/* =========================================================================
          SECTION 3: FEATURE DEEP-DIVES CAROUSEL, CTA BANNER & SITE FOOTER
          ========================================================================= */}
      <section className="snap-section showcase-snap-section">
        {/* Page Switch Arrow Button for Page 3 (Up to Page 2) */}
        <button
          className="scroll-hint-arrow scroll-hint-arrow-top"
          onClick={() => scrollToSection(1)}
          aria-label="Scroll up to master collection section"
        >
          <ChevronUp size={22} />
        </button>

        <div className="showcase-snap-inner">
          <div
            className="showcase-carousel-wrapper"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left Arrow Button */}
            <button
              className="carousel-nav-arrow arrow-left"
              onClick={handlePrevSlide}
              disabled={isTransitioning}
              aria-label="Previous showcase feature"
            >
              <ChevronLeft size={26} />
            </button>

            {/* Carousel Viewport & Sliding Track */}
            <div className="showcase-carousel-viewport">
              <div
              className={`showcase-slides-track dir-${slideDirection}`}
              style={{ transform: 'none' }}
              >
                {showcaseSlides.map((slide, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <div
                      key={slide.id}
                      className={`showcase-slide-card ${isActive ? "is-active" : "is-inactive"} dir-${slideDirection}`}
                      aria-hidden={!isActive}
                    >
                      {/* Left Info Column */}
                      <div className="showcase-info-column">
                        <div className="showcase-badge">
                          <span>{slide.badge}</span>
                        </div>

                        <h2 className="showcase-title">{slide.title}</h2>

                        {/* Accent Divider Line with Traveling Sparkle Streak */}
                        <div className="showcase-accent-line-wrap" aria-hidden="true">
                          <div className="showcase-accent-line" />
                          {isActive && (
                            <div key={sparkleKey} className={`showcase-accent-sparkle ${slideDirection}`} />
                          )}
                        </div>

                        <p className="showcase-desc">{slide.description}</p>

                        <ul className="showcase-bullet-list">
                          {slide.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="showcase-bullet-item">
                              <div className="bullet-check-icon">
                                <Check size={14} />
                              </div>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right Display Image Column */}
                      <div className="showcase-mock-column">
                        <div className="showcase-image-wrapper">
                          <img
                            src={slide.image}
                            alt={slide.imageAlt}
                            className="showcase-preview-img"
                            loading={isActive ? "eager" : "lazy"}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow Button */}
            <button
              className="carousel-nav-arrow arrow-right"
              onClick={handleNextSlide}
              disabled={isTransitioning}
              aria-label="Next showcase feature"
            >
              <ChevronRight size={26} />
            </button>
          </div>

          {/* Slide Indicator Dots */}
          <div className="showcase-dots-row">
            {showcaseSlides.map((slide, idx) => (
              <button
                key={slide.id}
                className={`showcase-dot-btn ${idx === activeSlide ? "active" : ""}`}
                onClick={() => handleDotClick(idx)}
                disabled={isTransitioning}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Bottom CTA Banner (Image 4) */}
          <div className="bottom-cta-banner">
            <div className="cta-banner-content">
              {/* Left Pokemon (Random Starter) from landing_page/animated_sprites/final_evo_starters */}
              <div className="banner-pokemon-left">
                <img
                  src={randomStarters.left.src}
                  alt={randomStarters.left.name}
                  className="banner-sprite"
                  onError={(e) => { e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomStarters.left.fallback}.png`; }}
                />
              </div>

              {/* Center Copy & Button */}
              <div className="banner-center-text">
                <div className="banner-title-row">
                  <span className="banner-sparkle-svg sparkle1" aria-hidden="true" />
                  <h3 className="banner-title">Ready to start your journey?</h3>
                  <span className="banner-sparkle-svg sparkle2" aria-hidden="true" />
                </div>
                <p className="banner-subtitle">
                  Join thousands of trainers and start building your ultimate collection today!
                </p>

                <div className="banner-button-row">
                  <Button
                    as={Link}
                    to="/register"
                    variant="primary"
                    size="lg"
                    icon={<SquarePen size={18} />}
                  >
                    Get Started Free
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="banner-perks-row">
                  <span className="perk-item">
                    <span className="perk-svg-icon free-icon" aria-hidden="true" />
                    <span>100% Free</span>
                  </span>
                  <span className="perk-dot">•</span>
                  <span className="perk-item">
                    <CreditCard size={15} className="perk-icon" />
                    <span>No Credit Card</span>
                  </span>
                  <span className="perk-dot">•</span>
                  <span className="perk-item">
                    <Download size={15} className="perk-icon" />
                    <span>No Download Needed</span>
                  </span>
                  <span className="perk-dot">•</span>
                  <span className="perk-item">
                    <LayoutList size={15} className="perk-icon" />
                    <span>Start Tracking Now</span>
                  </span>
                </div>
              </div>

              {/* Right Pokemon (Random Starter) from landing_page/animated_sprites/final_evo_starters */}
              <div className="banner-pokemon-right">
                <img
                  src={randomStarters.right.src}
                  alt={randomStarters.right.name}
                  className="banner-sprite"
                  onError={(e) => { e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomStarters.right.fallback}.png`; }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Site Footer */}
        <Footer />
      </section>
    </div>
  );
}
