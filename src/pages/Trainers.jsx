import { useEffect, useMemo, useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import "flag-icons/css/flag-icons.min.css";
import "../css/Trainers.css";
import PremiumIcon from "../components/Shared/PremiumIcon";
import { AdminIcon, ContentCreatorIcon } from "../components/Shared/BadgeIcons";
import { COUNTRY_OPTIONS } from "../data/countries";
import { getUserAvatarUrl } from "../utils/profileUtils";
import {
  Mars,
  Venus,
  VenusAndMars,
  Search,
  Heart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  RefreshCcw,
  MoveUp,
  MoveDown,
  Check,
  X,
  Crown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video,
  Sparkles,
  Users,
  Globe,
  Flame,
  Trophy,
  ShieldCheck,
  Info,
  ArrowLeftRight
} from "lucide-react";
import { LoadingSpinner, SectionLoader, InlineLoader, Button } from "../components/Shared";
import { SearchField } from "../components/Shared/FormField";
import { profileAPI } from "../utils/api";
import { UserContext } from "../components/Shared/UserContext";
import { PokeballIcon } from "../components/Shared/SearchBar";

const PAGE_SIZE = 20;
const TOTAL_SINGLE_DEX_CAPACITY = 2121;
const TOTAL_COMBINED_DEX_CAPACITY = 4242;

const pickCountry = (loc) =>
  (COUNTRY_OPTIONS.find(c => c.name === loc || c.value === loc || c.code === loc)?.code || "")
    .toLowerCase();

const pickCountryName = (loc) =>
  COUNTRY_OPTIONS.find(c => c.name === loc || c.value === loc || c.code === loc)?.name || loc || "Worldwide";

const genderIcon = (g) => {
  if (g === "Male") return <Mars size={14} color="#4aaaff" />;
  if (g === "Female") return <Venus size={14} color="#ff6ec7" />;
  if (g) return <VenusAndMars size={14} />;
  return null;
};

export default function Trainers() {
  const [q, setQ] = useState("");
  const [allTrainers, setAllTrainers] = useState([]);
  const [sortedItems, setSortedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("random");
  const [sortDirection, setSortDirection] = useState("desc"); // "asc" or "desc"
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hideZeroCaught, setHideZeroCaught] = useState(false);
  const [refreshRotating, setRefreshRotating] = useState(false);
  const [randomSeed, setRandomSeed] = useState(0);
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);
  const [compareHovered, setCompareHovered] = useState(false);
  const [compareClicked, setCompareClicked] = useState(false);
  const sortButtonRef = useRef(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const handleCompareClick = () => {
    setCompareClicked(true);
    setTimeout(() => {
      setCompareClicked(false);
    }, 2000);
  };

  // Get current user context to filter out own profile
  const { username } = useContext(UserContext);

  // paging for "no search" mode
  const [page, setPage] = useState(1);

  const query = useMemo(() => q.trim(), [q]);

  // Compute Global Community Stats & Top Trainer Spotlight (from full community dataset)
  const globalStats = useMemo(() => {
    const countriesSet = new Set();
    let totalEntries = 0;
    let totalShinies = 0;
    let bestTrainer = null;
    let highestCaught = -1;

    allTrainers.forEach(u => {
      if (u.location) {
        const c = pickCountry(u.location);
        if (c) countriesSet.add(c);
      }
      const shinies = u.shinies || u.shinyCount || u.totalShinies || 0;
      const regular = u.regularCaught || u.regularCount || 0;
      const total = u.totalCaught || (shinies + regular) || shinies || 0;
      totalEntries += total;
      totalShinies += shinies;

      if (total > highestCaught) {
        highestCaught = total;
        bestTrainer = u;
      }
    });

    const countryCount = countriesSet.size;
    const trainersCount = allTrainers.length;
    const displayEntries = totalEntries > 1000000
      ? `${(totalEntries / 1000000).toFixed(2)}M`
      : totalEntries.toLocaleString();

    const displayShinies = totalShinies > 1000000
      ? `${(totalShinies / 1000000).toFixed(2)}M`
      : totalShinies.toLocaleString();

    // Top trainer from live data
    const top = bestTrainer || (allTrainers.length > 0 ? allTrainers[0] : null) || {
      username: "---",
      location: "",
      shinies: 0,
      totalCaught: 0,
      profileTrainer: null
    };

    const topTrainerCaught = top.totalCaught || top.shinies || 0;
    const topTrainerPct = Math.min(100, (topTrainerCaught / TOTAL_COMBINED_DEX_CAPACITY) * 100);

    return {
      trainersCount,
      countryCount,
      displayEntries,
      displayShinies,
      topTrainer: top,
      topTrainerCaught,
      topTrainerPct
    };
  }, [allTrainers]);

  // Filter dataset by search query
  const allFilteredData = useMemo(() => {
    if (!query) return allTrainers;
    const qLower = query.toLowerCase();
    return allTrainers.filter(u => u.username?.toLowerCase().includes(qLower));
  }, [allTrainers, query]);

  // Sort and filter all data based on current sort type, direction, and hide zero shinies setting
  const sortedAndFilteredData = useMemo(() => {
    if (!allFilteredData.length) return [];

    let filtered = [...allFilteredData];

    // Filter out profiles with 0 caught if toggle is enabled
    if (hideZeroCaught) {
      filtered = filtered.filter(u => {
        const shinies = u.shinies || u.shinyCount || u.totalShinies || 0;
        const regular = u.regularCaught || u.regularCount || 0;
        const totalCaught = u.totalCaught || (shinies + regular) || shinies || 0;
        return typeof totalCaught === "number" && totalCaught > 0;
      });
    }

    // Sort the filtered items
    switch (sortType) {
      case "most-shinies":
        const shiniesSorted = filtered.sort((a, b) => {
          const aShinies = a.shinies || a.shinyCount || a.totalShinies || 0;
          const aRegular = a.regularCaught || a.regularCount || 0;
          const aTotal = a.totalCaught || (aShinies + aRegular) || aShinies || 0;

          const bShinies = b.shinies || b.shinyCount || b.totalShinies || 0;
          const bRegular = b.regularCaught || b.regularCount || 0;
          const bTotal = b.totalCaught || (bShinies + bRegular) || bShinies || 0;

          return sortDirection === "desc" ? bTotal - aTotal : aTotal - bTotal;
        });
        return shiniesSorted;
      case "most-likes":
        const likesSorted = filtered.sort((a, b) => {
          const aLikes = a.likes || a.likeCount || a.totalLikes || 0;
          const bLikes = b.likes || b.likeCount || b.totalLikes || 0;
          return sortDirection === "desc" ? bLikes - aLikes : aLikes - bLikes;
        });
        return likesSorted;
      case "alphabetical":
        const alphaSorted = filtered.sort((a, b) => a.username.localeCompare(b.username));
        return sortDirection === "desc" ? alphaSorted.reverse() : alphaSorted;
      case "date-created":
        const dateSorted = filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
        });
        return dateSorted;
      case "random":
        return filtered.sort(() => Math.random() - 0.5);
      default:
        return filtered;
    }
  }, [allFilteredData, sortType, sortDirection, hideZeroCaught, randomSeed]);

  // Get current page items from sorted and filtered data
  useEffect(() => {
    if (sortedAndFilteredData.length > 0) {
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const result = sortedAndFilteredData.slice(startIndex, endIndex);
      setSortedItems(result);
    } else {
      setSortedItems([]);
    }
  }, [sortedAndFilteredData, page]);

  // Reset to first page when sorting or filtering changes
  useEffect(() => {
    setPage(1);
  }, [sortType, sortDirection, hideZeroCaught]);

  // Reset page to 1 when filtered data becomes empty to prevent pagination errors
  useEffect(() => {
    if (sortedAndFilteredData.length === 0 && page > 1) {
      setPage(1);
    }
  }, [sortedAndFilteredData.length, page]);

  // Click outside handler for sort dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortButtonRef.current && !sortButtonRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown]);

  // Initial load: fetch all verified trainers across the community
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const fetchAll = async () => {
      try {
        let allUsers = [];
        let currentPage = 1;
        const batchSize = 50;
        let totalUsers = null;
        let hasMore = true;

        while (hasMore && !ignore) {
          const data = await profileAPI.getPublicUsers('', currentPage, batchSize, false);
          const batch = data.items || [];

          if (totalUsers === null && data.total !== undefined) {
            totalUsers = data.total;
          }

          if (batch.length > 0) {
            allUsers = [...allUsers, ...batch];
            currentPage++;
            if (totalUsers !== null) {
              hasMore = allUsers.length < totalUsers;
            } else {
              hasMore = batch.length === batchSize;
            }
          } else {
            hasMore = false;
          }

          if (currentPage > 40) hasMore = false;
        }

        let filteredData = allUsers;
        if (username) {
          filteredData = filteredData.filter(trainer => trainer.username !== username);
        }

        const verifiedUsers = filteredData.filter(trainer => trainer.verified === true);
        setUsingFallback(false);

        if (!ignore) {
          setAllTrainers(verifiedUsers);
        }
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
        if (!ignore) {
          setAllTrainers([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAll();
    return () => { ignore = true; };
  }, [username]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  const getSortLabel = () => {
    switch (sortType) {
      case "most-shinies":
        return sortDirection === "desc" ? "Most Caught" : "Least Caught";
      case "most-likes":
        return sortDirection === "desc" ? "Most Likes" : "Least Likes";
      case "alphabetical":
        return sortDirection === "desc" ? "Z → A" : "A → Z";
      case "date-created":
        return sortDirection === "desc" ? "Newest" : "Oldest";
      case "random":
        return "Random";
      default:
        return "Sort";
    }
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  const handleRefreshClick = () => {
    setRefreshRotating(true);
    setRandomSeed(prev => prev + 1);
    setTimeout(() => {
      setRefreshRotating(false);
    }, 600);
  };

  return (
    <div className="trainers-page fade-in-up">
      {/* ============================================================
          PAGE TITLE
          ============================================================ */}
      <div className="trainers-title-wrap">
        <h1 className="trainers-main-heading">
          Trainers
        </h1>
      </div>

      <div className="app-divider" />

      {/* ============================================================
          HERO & GLOBAL STATS HEADER SECTION
          ============================================================ */}
      <div className="trainers-hero-section">
        {/* Left Side: 4 Stat Cards */}
        <div className="trainers-hero-left">
          {/* 4 Global Stat Cards Row */}
          <div className="trainers-stat-cards-row">
            {/* Stat 1: Total Trainers */}
            <div className="stat-pill-card stat-trainers">
              <div className="stat-pill-icon-wrap">
                <Users size={32} className="stat-pill-lucide-icon stat-icon-trainers" />
              </div>
              <div className="stat-pill-content">
                <span className="stat-pill-num">{globalStats.trainersCount ? globalStats.trainersCount.toLocaleString() : "—"}</span>
                <span className="stat-pill-title">Total Trainers</span>
              </div>
            </div>

            {/* Stat 2: Countries */}
            <div className="stat-pill-card stat-countries">
              <div className="stat-pill-icon-wrap">
                <img src="/leaderboard/earth.svg" alt="Countries" className="trainer-stat-svg-icon stat-icon-earth" />
              </div>
              <div className="stat-pill-content">
                <span className="stat-pill-num">{globalStats.countryCount || "—"}</span>
                <span className="stat-pill-title">Countries</span>
              </div>
            </div>

            {/* Stat 3: Dex Entries */}
            <div className="stat-pill-card stat-entries">
              <div className="stat-pill-icon-wrap">
                <img src="/leaderboard/pokeball.svg" alt="Dex Entries" className="trainer-stat-svg-icon stat-icon-pokeball" />
              </div>
              <div className="stat-pill-content">
                <span className="stat-pill-num">{globalStats.displayEntries || "—"}</span>
                <span className="stat-pill-title">Dex Entries</span>
              </div>
            </div>

            {/* Stat 4: Shinies Caught */}
            <div className="stat-pill-card stat-shinies">
              <div className="stat-pill-icon-wrap">
                <img src="/leaderboard/sparkle.svg" alt="Shinies" className="trainer-stat-svg-icon stat-icon-sparkle" />
              </div>
              <div className="stat-pill-content">
                <span className="stat-pill-num">{globalStats.displayShinies || "—"}</span>
                <span className="stat-pill-title">Shinies Caught</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Top Trainer Spotlight Card (Links to /leaderboard) */}
        <div className="trainers-hero-right">
          <Link to="/leaderboard" className="top-trainer-spotlight-box" title="View Full Leaderboard">
            <div className="spotlight-trophy-graphic-wrap">
              <img
                src="/leaderboard/trophy.svg"
                alt="Leaderboard Trophy"
                className="spotlight-trophy-img"
              />
            </div>

            <div className="spotlight-middle-info">
              <span className="spotlight-badge-label">Top Trainer</span>
              <span className="spotlight-trainer-name">{globalStats.topTrainer.username || "—"}</span>
              <div className="spotlight-country-row">
                {(() => {
                  const code = pickCountry(globalStats.topTrainer.location);
                  return code ? <span className={`fi fi-${code}`} /> : null;
                })()}
                <span>{pickCountryName(globalStats.topTrainer.location)}</span>
              </div>
            </div>

            <div className="spotlight-right-stats">
              <div className="spotlight-stats-text">
                <span className="spotlight-count-num">{globalStats.topTrainerCaught ? globalStats.topTrainerCaught.toLocaleString() : "—"}</span>
                <span className="spotlight-sub-label">Main Living Dex</span>
                <span className="spotlight-pct-tag">{globalStats.topTrainerPct ? `${globalStats.topTrainerPct.toFixed(1)}% Complete` : "0.0% Complete"}</span>
              </div>
              <ChevronRight size={18} className="spotlight-chevron" />
            </div>
          </Link>
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT CONTAINER (SEARCH, FILTERS, GRID, PAGINATION)
          ============================================================ */}
      <div className="trainers-main-content-card">
        {/* SEARCH AND FILTER CONTROLS ROW */}
        <div className="search-row">
          <SearchField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ('')}
            placeholder="Search username…"
            autoFocus
            aria-label="Search trainers"
            size="md"
            className="trainer-search-field"
          />

          <div className="search-controls">
            {loading && allTrainers.length > 0 && <InlineLoader className="mr-1" />}
            <div className="hide-zero-shinies-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={hideZeroCaught}
                  onChange={(e) => setHideZeroCaught(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-text">Hide 0 Caught</span>
              </label>
            </div>

            <div className={`sort-button-wrap ${showSortDropdown ? 'open' : ''}`} ref={sortButtonRef}>
              <Button
                variant="secondary"
                size="md"
                className="sort-button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                aria-label="Sort trainers"
                icon={<ArrowUpDown size={18} />}
              >
                {getSortLabel()}
              </Button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    className="sort-dropdown"
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="sort-section">
                      <div className="sort-section-title">
                        <PokeballIcon size={12} />
                        <span>Caught</span>
                      </div>
                      <Button
                        variant={sortType === "most-shinies" && sortDirection === "desc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "most-shinies" && sortDirection === "desc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("most-shinies");
                          setSortDirection("desc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Most Caught
                      </Button>
                      <Button
                        variant={sortType === "most-shinies" && sortDirection === "asc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "most-shinies" && sortDirection === "asc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("most-shinies");
                          setSortDirection("asc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Least Caught
                      </Button>
                    </div>

                    <div className="sort-section">
                      <div className="sort-section-title">
                        <Heart size={12} />
                        <span>Likes</span>
                      </div>
                      <Button
                        variant={sortType === "most-likes" && sortDirection === "desc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "most-likes" && sortDirection === "desc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("most-likes");
                          setSortDirection("desc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Most Likes
                      </Button>
                      <Button
                        variant={sortType === "most-likes" && sortDirection === "asc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "most-likes" && sortDirection === "asc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("most-likes");
                          setSortDirection("asc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Least Likes
                      </Button>
                    </div>

                    <div className="sort-section">
                      <div className="sort-section-title">
                        <Search size={12} />
                        <span>Name</span>
                      </div>
                      <Button
                        variant={sortType === "alphabetical" && sortDirection === "asc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "alphabetical" && sortDirection === "asc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("alphabetical");
                          setSortDirection("asc");
                          setShowSortDropdown(false);
                        }}
                      >
                        A → Z
                      </Button>
                      <Button
                        variant={sortType === "alphabetical" && sortDirection === "desc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "alphabetical" && sortDirection === "desc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("alphabetical");
                          setSortDirection("desc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Z → A
                      </Button>
                    </div>

                    <div className="sort-section">
                      <div className="sort-section-title">
                        <Calendar size={12} />
                        <span>Date Joined</span>
                      </div>
                      <Button
                        variant={sortType === "date-created" && sortDirection === "desc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "date-created" && sortDirection === "desc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("date-created");
                          setSortDirection("desc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Newest
                      </Button>
                      <Button
                        variant={sortType === "date-created" && sortDirection === "asc" ? "primary" : "ghost"}
                        size="sm"
                        className={`sort-option ${sortType === "date-created" && sortDirection === "asc" ? "active" : ""}`}
                        onClick={() => {
                          setSortType("date-created");
                          setSortDirection("asc");
                          setShowSortDropdown(false);
                        }}
                      >
                        Oldest
                      </Button>
                    </div>

                    <Button
                      variant={sortType === "random" ? "primary" : "ghost"}
                      size="sm"
                      className={`sort-option ${sortType === "random" ? "active" : ""}`}
                      onClick={() => {
                        setSortType("random");
                        setShowSortDropdown(false);
                      }}
                    >
                      Random
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="secondary"
              size="md"
              className="direction-toggle-button"
              onClick={sortType === "random" ? handleRefreshClick : toggleSortDirection}
              disabled={sortType === "random" && refreshRotating}
              aria-label={sortType === "random" ? "Random sort (no direction)" : "Toggle sort direction"}
              title={sortType === "random" ? "Random sort - no direction needed" : `Switch to ${sortDirection === "desc" ? "ascending" : "descending"} order`}
            >
              {sortType === "random" ? (
                <RefreshCcw size={20} className={`refresh-icon ${refreshRotating ? 'rotate' : ''}`} style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px' }} />
              ) : sortDirection === "desc" ? (
                <MoveDown size={20} style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px' }} />
              ) : (
                <MoveUp size={20} style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px' }} />
              )}
            </Button>
          </div>

          {/* Top Right: Compare Trainers Button */}
          <div className="compare-trainers-wrap">
            <Button
              variant="secondary"
              size="md"
              className={`compare-trainers-btn ${(compareHovered || compareClicked) ? 'active-coming-soon' : ''}`}
              onMouseEnter={() => setCompareHovered(true)}
              onMouseLeave={() => setCompareHovered(false)}
              onClick={handleCompareClick}
              title="Compare Trainers"
              icon={<ArrowLeftRight size={16} />}
            >
              {(compareHovered || compareClicked) ? "Coming Soon" : "Compare Trainers"}
            </Button>
          </div>
        </div>

        {/* General notice about verified accounts only */}
        <div className="verified-notice">
          <div className="verified-notice-left">
            <ShieldCheck size={16} />
            <span>Only email verified accounts are shown in this list.</span>
          </div>

          <div
            className="verified-info-wrap"
            onMouseEnter={() => setShowVerifiedInfo(true)}
            onMouseLeave={() => setShowVerifiedInfo(false)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="verified-info-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowVerifiedInfo((prev) => !prev);
              }}
              aria-label="Why only verified accounts?"
              title="Why verified accounts only?"
            >
              <Info size={16} />
            </Button>

            {showVerifiedInfo && (
              <div className="verified-info-tooltip">
                <div className="verified-info-title">Why Verified Accounts Only?</div>
                <div className="verified-info-desc">
                  To prevent spam, duplicate bots, and keep community stats accurate, only accounts with a verified email address are shown in the public trainers list.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fallback notice when filtering fails */}
        {usingFallback && (
          <div className="verified-notice" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107' }}>
            <span>⚠️ Verified filtering is temporarily disabled. The API is missing the 'verified' field. All trainers are shown until this is fixed on the backend.</span>
          </div>
        )}

        {/* Show SectionLoader when first fetching, or render items */}
        {loading && allTrainers.length === 0 ? (
          <SectionLoader minHeight="350px" message="Loading community trainers..." />
        ) : sortedItems.length ? (
          <div className="fade-in-content">
            <div className="trainer-grid">
              {sortedItems.map((u) => {
                const shinies = u.shinyCount !== undefined ? u.shinyCount : (u.shinies || u.totalShinies || 0);
                const regular = u.regularCaught !== undefined ? u.regularCaught : Math.max(0, (u.totalCaught || 0) - shinies);
                const totalCaught = u.totalCaught !== undefined ? u.totalCaught : (regular + shinies);
                const percentComplete = Math.min(100, (totalCaught / TOTAL_COMBINED_DEX_CAPACITY) * 100);
                const likes = u.likes || u.likeCount || u.totalLikes || 0;

                return (
                  <Link key={u.username} to={`/u/${u.username}`} className="trainer-card">
                    {typeof likes === "number" && likes > 0 && (
                      <div className="trainer-badge trainer-likes">
                        <Heart size={14} />
                        <span>{likes}</span>
                      </div>
                    )}

                    <div className="trainer-card-head">
                      <img
                        src={getUserAvatarUrl(u)}
                        alt=""
                        className="trainer-avatar"
                      />
                      <div className="trainer-meta">
                        <div className="trainer-name">
                          {u.nameColor1 && u.nameColor2 ? (
                            <span className="animated-gradient-username-wrapper" style={{ "--grad-c1": u.nameColor1, "--grad-c2": u.nameColor2 }}>
                              <span className="animated-gradient-username">
                                {u.username}
                              </span>
                            </span>
                          ) : (
                            u.username
                          )}
                        </div>
                        <div className="trainer-sub trainer-sub-icons">
                          {(() => {
                            const code = pickCountry(u.location);
                            const flag = code ? <span className={`fi fi-${code}`} /> : null;
                            const g = genderIcon(u.gender);
                            const hasMeta = flag || g;
                            const hasBadge = u.isPremium || u.isAdmin || u.isContentCreator;
                            return (
                              <>
                                {flag}
                                {flag && g ? <span className="dot-sep" /> : null}
                                {g}
                                {hasMeta && hasBadge ? <span className="dot-sep" /> : null}
                                {u.isPremium && (
                                  <span className="crown-wrapper">
                                    <PremiumIcon
                                      size={14}
                                      color="#f59e0b"
                                      style={{ flexShrink: 0 }}
                                    />
                                    <span className="crown-tooltip">
                                      {u.premiumMonths === 1 ? '1 month membership' : `${u.premiumMonths || 1} months membership`}
                                    </span>
                                  </span>
                                )}
                                {u.isAdmin && (
                                  <span className="crown-wrapper">
                                    <AdminIcon
                                      size={14}
                                      color="#38bdf8"
                                      style={{ flexShrink: 0 }}
                                    />
                                    <span className="crown-tooltip">Admin</span>
                                  </span>
                                )}
                                {u.isContentCreator && (
                                  <span className="crown-wrapper">
                                    <ContentCreatorIcon
                                      size={14}
                                      color="#ef4444"
                                      style={{ flexShrink: 0 }}
                                    />
                                    <span className="crown-tooltip">Content Creator</span>
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Total Caught (Regular + Shiny) Progress Section */}
                    <div className="trainer-card-progress-section">
                      <div className="trainer-progress-header">
                        <span className="trainer-progress-total">
                          <PokeballIcon size={13} />
                          <strong>{totalCaught.toLocaleString()}</strong>
                          <span className="trainer-progress-max"> / {TOTAL_COMBINED_DEX_CAPACITY.toLocaleString()}</span>
                        </span>
                        <span className="trainer-progress-percent">
                          {percentComplete.toFixed(1)}%
                        </span>
                      </div>

                      <div className="trainer-progress-bar-track">
                        <div
                          className="trainer-progress-bar-fill"
                          style={{ width: `${Math.max(totalCaught > 0 ? 3 : 0, percentComplete)}%` }}
                        />
                      </div>

                      <div className="trainer-progress-footer-stats">
                        <span className="stat-tag-regular">
                          {regular.toLocaleString()} Regular
                        </span>
                        <span className="stat-tag-shiny">
                          <Sparkles size={11} className="stat-sparkle-icon" />
                          <span>{shinies.toLocaleString()} Shiny</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination - similar to changelog style */}
            {sortedAndFilteredData.length > PAGE_SIZE && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, sortedAndFilteredData.length)} of {sortedAndFilteredData.length.toLocaleString()} trainers
                </div>

                <div className="pagination-controls">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="pagination-btn"
                    icon={<ChevronLeft size={16} />}
                  >
                    Previous
                  </Button>

                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)) }, (_, i) => {
                      const totalPages = Math.ceil(sortedAndFilteredData.length / PAGE_SIZE);
                      const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={`page-btn ${page === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)))}
                    disabled={page >= Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)}
                    className="pagination-btn"
                    iconRight={<ChevronRight size={16} />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
            {query ? `No trainers found matching "${query}"` :
              hideZeroCaught ? (
                <>
                  No trainers with caught Pokemon found.<br />
                  Try disabling the 'Hide 0 Caught' filter.
                </>
              ) :
                "No trainers found"}
          </div>
        )}
      </div>
    </div>
  );
}
