export const getTutorialSteps = (isMobile = false) => [
  {
    targetId: "progress-bars",
    title: "Progress Bars",
    description: "These progress bars are completely customizable.<br/><br/>Click the <strong>settings gear</strong> in the top right of the progress bar section to choose exactly what they track, like specific generations, Poké Balls, or marks.",
    requireAction: false,
    scrollToTop: true
  },
  {
    targetId: "search-bar",
    title: "Search Bar",
    description: "Search for Pokémon by name, generation, forms, typing, or many other filters to quickly find exactly what you're looking for.",
    requireAction: false
  },
  {
    targetId: "shiny-toggle",
    title: "Shiny Toggle",
    description: "This switches the entire tracker between regular Pokémon progress and shiny Pokémon progress.",
    requireAction: true
  },
  {
    targetId: "pokemon-card",
    title: "Pokémon Card",
    description: "Clicking a Pokémon lets you quickly mark it as caught.<br/><br/><strong>Click the highlighted Pokémon to continue.</strong>",
    requireAction: true
  },
  {
    targetId: isMobile ? "pokemon-card" : "info-button",
    title: isMobile ? "Sidebar Details" : "Detailed Info",
    description: isMobile
      ? "On mobile, you can open the detailed sidebar by holding down on any Pokémon.<br/><br/><strong>Hold down on Bulbasaur to open the sidebar.</strong>"
      : "The information button (which normally only appears when you hover over a Pokémon) opens the detailed sidebar where you can manage everything related to this Pokémon.<br/><br/><strong>Click it now.</strong>",
    requireAction: !isMobile,
    advanceOn: isMobile ? "sidebarOpened" : null
  },
  {
    targetId: "sidebar-overview",
    title: "Sidebar Overview",
    description: "The sidebar shows important information on the Pokémon and can hold saved data we will add later.",
    requireAction: false
  },
  {
    targetId: "edit-info-btn",
    title: "Edit Information",
    description: "Click Edit Info to customize your tracking information for this Pokémon.",
    requireAction: true
  },
  {
    targetId: "edit-form",
    actionTargetId: "save-entry-btn",
    title: "Editing Data",
    description: "Here you can record your own information such as what game the Pokémon was caught in, what Poké Ball was used, notes, dates, or anything else available.<br/><br/>We've pre-filled some data for you. <strong>Press Save to continue.</strong>",
    requireAction: true
  },
  {
    targetId: "sidebar-entries-overview",
    title: "Saved Data",
    description: "Your saved data is now displayed! You can add multiple entries if you catch this Pokémon more than once, or click the Edit button to make changes.<br/><br/>If you prefer not to keep a Living Dex, you can also evolve the Pokémon directly from here. All your tracking information will carry over to its evolutions (Ivysaur and Venusaur), and their catch method will automatically be set to 'Evolved'.",
    requireAction: false
  },
  {
    targetId: "info-accordion-header",
    title: "Additional Information",
    description: "There is also a lot of useful information about the Pokémon available here.<br/><br/><strong>Click Additional Info to view it.</strong>",
    requireAction: true
  },
  {
    targetId: "sidebar-info-content",
    title: "Information Overview",
    description: "Here you can see exactly which games Bulbasaur is available in, view recommended Poké Balls picked by color match, and quickly jump to its alternate forms if it has any.",
    requireAction: false
  },
  {
    targetId: "close-sidebar",
    title: "Close Sidebar",
    description: "Close the sidebar whenever you're finished viewing Pokémon details.<br/><br/><strong>Close it now.</strong>",
    requireAction: true
  },
  {
    targetId: "dex-category-tabs",
    title: "Category Tabs",
    description: "Switch between different category tabs to track your collection, including the <strong>Main Living Dex</strong>, <strong>Gender Forms</strong>, <strong>Regional Forms</strong>, <strong>Gigantamax</strong>, <strong>Alpha Forms</strong>, and more!",
    requireAction: false,
    placement: "below",
    delayScroll: 350
  },
  {
    targetId: "nav-trainers",
    title: "Trainers Page",
    description: "Browse other trainers, view public profiles, compare collections, and discover members of the community.",
    requireAction: false,
    scrollToTop: true
  },
  {
    targetId: "nav-counters",
    title: "Counters",
    description: "Counters let you record every encounter during hunts, making it easy to keep accurate shiny hunting statistics.<br/><br/>When you finish a hunt, it can be automatically saved directly to your Main Living Dex with all your tracking information intact!",
    requireAction: false
  },
  {
    targetId: "nav-mmo",
    title: "MMO Tool",
    description: "The MMO Tool helps Pokémon Legends: Arceus players efficiently track Massive Mass Outbreak hunts.",
    requireAction: false
  },
  {
    targetId: "nav-bingo",
    title: "Bingo",
    description: "Create custom Bingo cards to plan future shiny hunting goals and challenge yourself with unique objectives each year.",
    requireAction: false
  },
  {
    targetId: "nav-settings",
    title: "Settings Menu",
    description: "The dropdown menu contains links to your account pages.<br/><br/><strong>Click Settings to continue.</strong>",
    requireAction: true,
    placement: "left"
  },
  {
    targetId: "settings-overview",
    title: "Settings Page",
    description: "Nearly every aspect of the tracker can be customized here, including visuals, colors, privacy, and more.",
    requireAction: false,
    noHighlight: true
  },
  {
    targetId: "nav-profile",
    title: "Profile Menu",
    description: "Now let's check out your profile.<br/><br/><strong>Click Profile to continue.</strong>",
    requireAction: true,
    placement: "left"
  },
  {
    targetId: "profile-overview",
    title: "Profile Page",
    description: "Your profile stores your overall collection progress, trainer information, statistics, friend codes, achievements, and much more.<br/><br/>Click the edit button on your profile card to add your favorite Pokémon and games, and fill in information about yourself!",
    requireAction: false,
    noHighlight: true
  }
];

export const tutorialSteps = getTutorialSteps(typeof window !== 'undefined' && window.innerWidth <= 768);
