import { useEffect, useMemo, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import "flag-icons/css/flag-icons.min.css";
import "../css/Leaderboard.css";
import { COUNTRY_OPTIONS } from "../data/countries";
import {
  Trophy,
  Sparkles,
  Heart,
  Crown,
  Medal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  ArrowLeft,
  Flame,
  Globe,
  ExternalLink,
  X,
  User
} from "lucide-react";
import { LoadingSpinner, SectionLoader, InlineLoader } from "../components/Shared";
import { Button } from "../components/Shared/Button";
import { SearchField, SelectField } from "../components/Shared/FormField";
import { profileAPI } from "../utils/api";
import { UserContext } from "../components/Shared/UserContext";
import { PokeballIcon } from "../components/Shared/SearchBar";
import { getUserAvatarUrl } from "../utils/profileUtils";

const TOTAL_DEX_ENTRIES = 4242;
const TOTAL_SHINY_DEX_ENTRIES = 2121;

const pickCountry = (loc) => {
  if (!loc || !loc.trim()) return "";
  const trimmed = loc.trim().toLowerCase();
  return (COUNTRY_OPTIONS.find(c =>
    c.name?.toLowerCase() === trimmed ||
    c.value?.toLowerCase() === trimmed ||
    c.code?.toLowerCase() === trimmed
  )?.code || "").toLowerCase();
};

const pickCountryName = (loc) => {
  if (!loc || !loc.trim()) return "N/A";
  const trimmed = loc.trim().toLowerCase();
  return COUNTRY_OPTIONS.find(c =>
    c.name?.toLowerCase() === trimmed ||
    c.value?.toLowerCase() === trimmed ||
    c.code?.toLowerCase() === trimmed
  )?.name || loc || "N/A";
};

export default function Leaderboard() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("total"); // "total", "shinies", "likes"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { username: currentUsername } = useContext(UserContext);

  useEffect(() => {
    let ignore = false;

    const fetchAllTrainers = async () => {
      setLoading(true);
      try {
        let allUsers = [];
        let currentPage = 1;
        const batchSize = 50;
        let totalUsers = null;
        let hasMore = true;

        while (hasMore && !ignore) {
          const data = await profileAPI.getPublicUsers("", currentPage, batchSize, false, "leaderboard");
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

        const validTrainers = allUsers.filter(
          u => u.verified !== false && u.isLeaderboardPublic !== false
        );

        if (!ignore) {
          setTrainers(validTrainers);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard trainers:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAllTrainers();

    return () => {
      ignore = true;
    };
  }, []);

  // Sorted and filtered list based on activeTab, searchQuery, and selectedRegion
  const allRankedTrainers = useMemo(() => {
    // Filter out users who disabled leaderboards
    let list = trainers.filter(
      u => u.isLeaderboardPublic !== false
    );

    // Compute metrics
    list = list.map(u => {
      const shinies = u.shinyCount !== undefined ? u.shinyCount : (u.shinies || u.totalShinies || 0);
      const regular = u.regularCaught !== undefined ? u.regularCaught : Math.max(0, (u.totalCaught || 0) - shinies);
      const total = u.totalCaught !== undefined ? u.totalCaught : (regular + shinies);
      const likes = u.likes || u.likeCount || u.totalLikes || 0;
      const completionPct = Math.min(100, (total / TOTAL_DEX_ENTRIES) * 100);
      const shinyPct = Math.min(100, (shinies / TOTAL_SHINY_DEX_ENTRIES) * 100);

      return {
        ...u,
        _total: total,
        _shinies: shinies,
        _regular: regular,
        _likes: likes,
        _pct: completionPct,
        _shinyPct: shinyPct
      };
    });

    // Exclude accounts with 0 in the active category
    if (activeTab === "shinies") {
      list = list.filter(u => (u._shinies || 0) > 0);
      list.sort((a, b) => b._shinies - a._shinies || b._total - a._total);
    } else if (activeTab === "likes") {
      list = list.filter(u => (u._likes || 0) > 0);
      list.sort((a, b) => b._likes - a._likes || b._total - a._total);
    } else {
      // Default: total caught
      list = list.filter(u => (u._total || 0) > 0);
      list.sort((a, b) => b._total - a._total || b._shinies - a._shinies);
    }

    // Filter by Region if specified
    if (selectedRegion !== "all") {
      list = list.filter(u => {
        const cCode = pickCountry(u.location);
        return cCode === selectedRegion;
      });
    }

    // Assign true rank in this category/region
    list = list.map((u, i) => ({
      ...u,
      rank: i + 1
    }));

    // Filter by Search Query (preserves true rank)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(u => u.username?.toLowerCase().includes(q));
    }

    return list;
  }, [trainers, activeTab, searchQuery, selectedRegion]);

  // Top 3 Podium (from the full filtered list)
  const topThree = useMemo(() => {
    return allRankedTrainers.slice(0, 3);
  }, [allRankedTrainers]);

  const hasPodium = !searchQuery && allRankedTrainers.length > 0;

  // Pagination calculations - page 1 includes podium (top 3) towards the pageSize count
  const totalPages = Math.max(1, Math.ceil(allRankedTrainers.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedTrainers = useMemo(() => {
    if (hasPodium) {
      if (currentPage === 1) {
        return allRankedTrainers.slice(3, pageSize);
      } else {
        const start = (currentPage - 1) * pageSize;
        return allRankedTrainers.slice(start, start + pageSize);
      }
    } else {
      const start = (currentPage - 1) * pageSize;
      return allRankedTrainers.slice(start, start + pageSize);
    }
  }, [allRankedTrainers, hasPodium, currentPage, pageSize]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedRegion, pageSize]);

  // Available unique regions in the dataset with active data (at least 1 caught Pokemon)
  const availableRegions = useMemo(() => {
    const regionMap = new Map();
    trainers.forEach(u => {
      // Must be public, non-private
      if (u.isProfilePublic !== false && !u.isPrivate && !u.private) {
        const shinies = u.shinyCount !== undefined ? u.shinyCount : (u.shinies || u.totalShinies || 0);
        const regular = u.regularCaught !== undefined ? u.regularCaught : Math.max(0, (u.totalCaught || 0) - shinies);
        const total = u.totalCaught !== undefined ? u.totalCaught : (regular + shinies);

        // Account must have caught at least 1 pokemon
        if (total > 0 && u.location && u.location.trim()) {
          const code = pickCountry(u.location);
          const name = pickCountryName(u.location);
          if (code && name && name !== "N/A" && !regionMap.has(code)) {
            regionMap.set(code, name);
          }
        }
      }
    });
    return Array.from(regionMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [trainers]);

  // Options list for Universal SelectField
  const regionOptions = useMemo(() => [
    { value: "all", label: `All Regions (${availableRegions.length})` },
    ...availableRegions.map(([code, name]) => ({
      value: code,
      label: name,
      icon: <span className={`fi fi-${code}`} />
    }))
  ], [availableRegions]);

  // Reset selected region if it is no longer available in the dataset
  useEffect(() => {
    if (selectedRegion !== "all" && !availableRegions.some(r => r[0] === selectedRegion)) {
      setSelectedRegion("all");
    }
  }, [availableRegions, selectedRegion]);

  return (
    <div className="leaderboard-page fade-in-up">
      {/* Header Title Section */}
      <div className="leaderboard-header-section">
        <div className="leaderboard-title-row">
          <h1 className="leaderboard-main-title">
            Leaderboard
          </h1>
          <Button
            as={Link}
            to="/trainers"
            variant="secondary"
            size="sm"
            className="btn-back-to-trainers"
            icon={<ArrowLeft size={16} />}
          >
            Back to Trainers
          </Button>
        </div>

        <div className="app-divider" />

        {/* Tab Controls & Filter Search Row */}
        <div className="leaderboard-controls-row">
          <div className="leaderboard-tabs-wrap">
            <Button
              variant={activeTab === "total" ? "primary" : "secondary"}
              size="sm"
              className={`leaderboard-tab ${activeTab === "total" ? "active" : ""}`}
              onClick={() => setActiveTab("total")}
              icon={<PokeballIcon size={16} />}
            >
              Living Dex Completion
            </Button>
            <Button
              variant={activeTab === "shinies" ? "primary" : "secondary"}
              size="sm"
              className={`leaderboard-tab ${activeTab === "shinies" ? "active" : ""}`}
              onClick={() => setActiveTab("shinies")}
              icon={<Sparkles size={16} />}
            >
              Most Shinies
            </Button>
            <Button
              variant={activeTab === "likes" ? "primary" : "secondary"}
              size="sm"
              className={`leaderboard-tab ${activeTab === "likes" ? "active" : ""}`}
              onClick={() => setActiveTab("likes")}
              icon={<Heart size={16} />}
            >
              Most Liked
            </Button>
          </div>

          <div className="leaderboard-filters-right">
            {/* Search Input */}
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              placeholder="Search leaderboard..."
              size="md"
              className="leaderboard-search-field"
            />

            {/* Region Filter Dropdown */}
            <SelectField
              value={selectedRegion}
              onChange={(val) => setSelectedRegion(val || "all")}
              options={regionOptions}
              searchable={availableRegions.length > 6}
              searchPlaceholder="Filter regions..."
              startIcon={<Globe size={16} />}
              size="md"
              className="leaderboard-region-select"
            />
            {loading && allRankedTrainers.length > 0 && <InlineLoader className="ml-2" />}
          </div>
        </div>
      </div>

      {loading && allRankedTrainers.length === 0 ? (
        <SectionLoader minHeight="400px" message="Loading leaderboard rankings..." />
      ) : allRankedTrainers.length === 0 ? (
        <div className="leaderboard-empty-state">
          <Trophy size={48} opacity={0.3} />
          <h3>No Trainers Found</h3>
          <p>No trainers match your current search and region filters.</p>
        </div>
      ) : (
        <div className="fade-in-content">
          {/* Top 3 Podium Cards */}
          {hasPodium && (
            <div className="leaderboard-podium-section">
              {/* #2 Silver (Left) */}
              {topThree[1] ? (
                <Link
                  to={`/u/${topThree[1].username}`}
                  className="podium-card rank-2"
                >
                  {/* Rank Hanging Badge */}
                  <div className="podium-badge-hanger rank-2">
                    <Medal size={14} />
                    <span>2</span>
                  </div>

                  {/* Background Laurel & Sparkles */}
                  <div className="podium-bg-decor">
                    <div className="podium-laurel-mask rank-2" />
                    <div className="podium-single-sparkle rank-2 sp-1" />
                    <div className="podium-single-sparkle rank-2 sp-2" />
                    <div className="podium-single-sparkle rank-2 sp-3" />
                    <div className="podium-single-sparkle rank-2 sp-4" />
                    <div className="podium-single-sparkle rank-2 sp-5" />
                    <div className="podium-single-sparkle rank-2 sp-6" />
                    <div className="podium-single-sparkle rank-2 sp-7" />
                    <div className="podium-single-sparkle rank-2 sp-8" />
                  </div>

                  <div className="podium-avatar-wrap rank-2">
                    <img
                      src={getUserAvatarUrl(topThree[1])}
                      alt=""
                      className="podium-avatar"
                    />
                  </div>

                  <h3 className="podium-username">
                    {(() => {
                      const c1 = topThree[1].nameColor1 || topThree[1].nameGradientColor1;
                      const c2 = topThree[1].nameColor2 || topThree[1].nameGradientColor2;
                      return c1 && c2 && topThree[1].isPremium ? (
                        <span className="animated-gradient-username-wrapper" style={{ "--grad-c1": c1, "--grad-c2": c2 }}>
                          <span className="animated-gradient-username">{topThree[1].username}</span>
                        </span>
                      ) : (
                        topThree[1].username
                      );
                    })()}
                  </h3>

                  <div className="podium-country">
                    {(() => {
                      const code = pickCountry(topThree[1].location);
                      return code ? <span className={`fi fi-${code}`} /> : null;
                    })()}
                    <span>{pickCountryName(topThree[1].location)}</span>
                  </div>

                  <div className="podium-score-wrap">
                    <span className="podium-score-num">
                      {activeTab === "shinies"
                        ? `${topThree[1]._shinies.toLocaleString()} Shinies`
                        : activeTab === "likes"
                        ? `${topThree[1]._likes.toLocaleString()} Likes`
                        : `${topThree[1]._total.toLocaleString()} Caught`}
                    </span>
                    <span
                      className="podium-score-sub"
                      style={{ visibility: activeTab === "likes" ? "hidden" : "visible" }}
                    >
                      {activeTab === "shinies"
                        ? `${topThree[1]._shinyPct.toFixed(1)}% Complete`
                        : `${topThree[1]._pct.toFixed(1)}% Complete`}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="podium-card rank-2 vacant-card">
                  <div className="podium-badge-hanger rank-2">
                    <Medal size={14} />
                    <span>2</span>
                  </div>
                  <div className="podium-bg-decor">
                    <div className="podium-laurel-mask rank-2" />
                  </div>
                  <div className="podium-avatar-wrap rank-2 vacant-avatar">
                    <User size={30} className="vacant-icon" />
                  </div>
                  <h3 className="podium-username vacant-text">Vacant</h3>
                  <div className="podium-country vacant-sub">
                    <span>Unclaimed</span>
                  </div>
                  <div className="podium-score-wrap">
                    <span className="podium-score-num vacant-score">—</span>
                    <span className="podium-score-sub" style={{ visibility: "hidden" }}>
                      0.0% Complete
                    </span>
                  </div>
                </div>
              )}

              {/* #1 Gold (Center) */}
              {topThree[0] ? (
                <Link
                  to={`/u/${topThree[0].username}`}
                  className="podium-card rank-1"
                >
                  {/* Rank Hanging Badge */}
                  <div className="podium-badge-hanger rank-1">
                    <Crown size={15} />
                    <span>1</span>
                  </div>

                  {/* Background Laurel & Sparkles */}
                  <div className="podium-bg-decor">
                    <div className="podium-laurel-mask rank-1" />
                    <div className="podium-single-sparkle rank-1 sp-1" />
                    <div className="podium-single-sparkle rank-1 sp-2" />
                    <div className="podium-single-sparkle rank-1 sp-3" />
                    <div className="podium-single-sparkle rank-1 sp-4" />
                    <div className="podium-single-sparkle rank-1 sp-5" />
                    <div className="podium-single-sparkle rank-1 sp-6" />
                    <div className="podium-single-sparkle rank-1 sp-7" />
                    <div className="podium-single-sparkle rank-1 sp-8" />
                    <div className="podium-single-sparkle rank-1 sp-9" />
                    <div className="podium-single-sparkle rank-1 sp-10" />
                  </div>

                  <div className="podium-avatar-wrap rank-1">
                    <img
                      src={getUserAvatarUrl(topThree[0])}
                      alt=""
                      className="podium-avatar"
                    />
                  </div>

                  <h3 className="podium-username">
                    {(() => {
                      const c1 = topThree[0].nameColor1 || topThree[0].nameGradientColor1;
                      const c2 = topThree[0].nameColor2 || topThree[0].nameGradientColor2;
                      return c1 && c2 && topThree[0].isPremium ? (
                        <span className="animated-gradient-username-wrapper" style={{ "--grad-c1": c1, "--grad-c2": c2 }}>
                          <span className="animated-gradient-username">{topThree[0].username}</span>
                        </span>
                      ) : (
                        topThree[0].username
                      );
                    })()}
                  </h3>

                  <div className="podium-country">
                    {(() => {
                      const code = pickCountry(topThree[0].location);
                      return code ? <span className={`fi fi-${code}`} /> : null;
                    })()}
                    <span>{pickCountryName(topThree[0].location)}</span>
                  </div>

                  <div className="podium-score-wrap">
                    <span className="podium-score-num">
                      {activeTab === "shinies"
                        ? `${topThree[0]._shinies.toLocaleString()} Shinies`
                        : activeTab === "likes"
                        ? `${topThree[0]._likes.toLocaleString()} Likes`
                        : `${topThree[0]._total.toLocaleString()} Caught`}
                    </span>
                    <span
                      className="podium-score-sub"
                      style={{ visibility: activeTab === "likes" ? "hidden" : "visible" }}
                    >
                      {activeTab === "shinies"
                        ? `${topThree[0]._shinyPct.toFixed(1)}% Complete`
                        : `${topThree[0]._pct.toFixed(1)}% Complete`}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="podium-card rank-1 vacant-card">
                  <div className="podium-badge-hanger rank-1">
                    <Crown size={15} />
                    <span>1</span>
                  </div>
                  <div className="podium-bg-decor">
                    <div className="podium-laurel-mask rank-1" />
                  </div>
                  <div className="podium-avatar-wrap rank-1 vacant-avatar">
                    <User size={34} className="vacant-icon" />
                  </div>
                  <h3 className="podium-username vacant-text">Vacant</h3>
                  <div className="podium-country vacant-sub">
                    <span>Unclaimed</span>
                  </div>
                  <div className="podium-score-wrap">
                    <span className="podium-score-num vacant-score">—</span>
                    <span className="podium-score-sub" style={{ visibility: "hidden" }}>
                      0.0% Complete
                    </span>
                  </div>
                </div>
              )}

              {/* #3 Bronze (Right) */}
              {topThree[2] ? (
                <Link
                  to={`/u/${topThree[2].username}`}
                  className="podium-card rank-3"
                >
                  {/* Rank Hanging Badge */}
                  <div className="podium-badge-hanger rank-3">
                    <Medal size={14} />
                    <span>3</span>
                  </div>

                  {/* Background Laurel & Sparkles */}
                  <div className="podium-bg-decor">
                    <div className="podium-laurel-mask rank-3" />
                    <div className="podium-single-sparkle rank-3 sp-1" />
                    <div className="podium-single-sparkle rank-3 sp-2" />
                    <div className="podium-single-sparkle rank-3 sp-3" />
                    <div className="podium-single-sparkle rank-3 sp-4" />
                    <div className="podium-single-sparkle rank-3 sp-5" />
                    <div className="podium-single-sparkle rank-3 sp-6" />
                    <div className="podium-single-sparkle rank-3 sp-7" />
                    <div className="podium-single-sparkle rank-3 sp-8" />
                  </div>

                  <div className="podium-avatar-wrap rank-3">
                    <img
                      src={getUserAvatarUrl(topThree[2])}
                      alt=""
                      className="podium-avatar"
                    />
                  </div>

                  <h3 className="podium-username">
                    {(() => {
                      const c1 = topThree[2].nameColor1 || topThree[2].nameGradientColor1;
                      const c2 = topThree[2].nameColor2 || topThree[2].nameGradientColor2;
                      return c1 && c2 && topThree[2].isPremium ? (
                        <span className="animated-gradient-username-wrapper" style={{ "--grad-c1": c1, "--grad-c2": c2 }}>
                          <span className="animated-gradient-username">{topThree[2].username}</span>
                        </span>
                      ) : (
                        topThree[2].username
                      );
                    })()}
                  </h3>

                  <div className="podium-country">
                    {(() => {
                      const code = pickCountry(topThree[2].location);
                      return code ? <span className={`fi fi-${code}`} /> : null;
                    })()}
                    <span>{pickCountryName(topThree[2].location)}</span>
                  </div>

                  <div className="podium-score-wrap">
                    <span className="podium-score-num">
                      {activeTab === "shinies"
                        ? `${topThree[2]._shinies.toLocaleString()} Shinies`
                        : activeTab === "likes"
                        ? `${topThree[2]._likes.toLocaleString()} Likes`
                        : `${topThree[2]._total.toLocaleString()} Caught`}
                    </span>
                    <span
                      className="podium-score-sub"
                      style={{ visibility: activeTab === "likes" ? "hidden" : "visible" }}
                    >
                      {activeTab === "shinies"
                        ? `${topThree[2]._shinyPct.toFixed(1)}% Complete`
                        : `${topThree[2]._pct.toFixed(1)}% Complete`}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="podium-card rank-3 vacant-card">
                  <div className="podium-badge-hanger rank-3">
                    <Medal size={14} />
                    <span>3</span>
                  </div>
                  <div className="podium-bg-decor">
                    <div className="podium-laurel-mask rank-3" />
                  </div>
                  <div className="podium-avatar-wrap rank-3 vacant-avatar">
                    <User size={30} className="vacant-icon" />
                  </div>
                  <h3 className="podium-username vacant-text">Vacant</h3>
                  <div className="podium-country vacant-sub">
                    <span>Unclaimed</span>
                  </div>
                  <div className="podium-score-wrap">
                    <span className="podium-score-num vacant-score">—</span>
                    <span className="podium-score-sub" style={{ visibility: "hidden" }}>
                      0.0% Complete
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Rankings Table Card */}
          <div className={`leaderboard-table-card ${activeTab !== "total" ? "has-metric-col" : "no-metric-col"}`}>
            <div className="leaderboard-table-head">
              <span className="col-rank">RANK</span>
              <span className="col-trainer">TRAINER</span>
              <span className="col-country">REGION</span>
              <span className="col-progress">LIVING DEX PROGRESS</span>
              {activeTab !== "total" && (
                <span className="col-metric">
                  {activeTab === "shinies" ? "TOTAL SHINIES" : "TOTAL LIKES"}
                </span>
              )}
              <span className="col-action">VIEW</span>
            </div>

            <div className="leaderboard-table-body">
              {paginatedTrainers.map((trainer) => {
                const overallRank = trainer.rank;
                const isCurrentUser = currentUsername && trainer.username === currentUsername;
                const code = pickCountry(trainer.location);

                return (
                  <Link
                    key={trainer.username}
                    to={`/u/${trainer.username}`}
                    className={`leaderboard-row ${isCurrentUser ? "is-current-user" : ""} ${overallRank <= 3 ? `top-row rank-${overallRank}` : ""}`}
                  >
                    {/* Rank Badge */}
                    <div className="col-rank">
                      <span className={`rank-pill rank-${overallRank <= 3 ? overallRank : "standard"}`}>
                        {overallRank === 1 ? (
                          <>
                            <Crown size={14} className="rank-crown-icon" />
                            <span>1</span>
                          </>
                        ) : overallRank === 2 ? (
                          <>
                            <Medal size={14} className="rank-medal-icon" />
                            <span>2</span>
                          </>
                        ) : overallRank === 3 ? (
                          <>
                            <Medal size={14} className="rank-medal-icon" />
                            <span>3</span>
                          </>
                        ) : (
                          <span>{overallRank}</span>
                        )}
                      </span>
                    </div>

                    {/* Trainer Info */}
                    <div className="col-trainer">
                      <img
                        src={getUserAvatarUrl(trainer)}
                        alt=""
                        className="table-trainer-avatar"
                      />
                      <div className="table-trainer-info">
                        <div className="table-trainer-name-row">
                          {(() => {
                            const c1 = trainer.nameColor1 || trainer.nameGradientColor1;
                            const c2 = trainer.nameColor2 || trainer.nameGradientColor2;
                            return c1 && c2 && trainer.isPremium ? (
                              <span className="animated-gradient-username-wrapper" style={{ "--grad-c1": c1, "--grad-c2": c2 }}>
                                <span className="animated-gradient-username table-trainer-name">{trainer.username}</span>
                              </span>
                            ) : (
                              <span className="table-trainer-name">{trainer.username}</span>
                            );
                          })()}
                          {isCurrentUser && <span className="you-badge">YOU</span>}
                        </div>
                      </div>
                    </div>

                    {/* Region */}
                    <div className="col-country">
                      {code ? <span className={`fi fi-${code}`} /> : null}
                      <span className="country-name-label">{pickCountryName(trainer.location)}</span>
                    </div>

                    {/* Living Dex Progress Bar */}
                    <div className="col-progress">
                      <div className="table-progress-bar-wrap">
                        <div className="table-progress-bar-track">
                          <div
                            className="table-progress-bar-fill"
                            style={{ width: `${Math.max(2, trainer._pct)}%` }}
                          />
                        </div>
                        <span className="table-progress-label">
                          {trainer._pct.toFixed(1)}% ({trainer._total.toLocaleString()} / {TOTAL_DEX_ENTRIES.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    {/* Metric Column for Shinies / Likes */}
                    {activeTab !== "total" && (
                      <div className="col-metric">
                        <span className="metric-badge">
                          {activeTab === "shinies" ? (
                            <>
                              <Sparkles size={14} className="text-amber-400" />
                              <span>{trainer._shinies.toLocaleString()}</span>
                            </>
                          ) : (
                            <>
                              <Heart size={14} className="text-rose-500" />
                              <span>{trainer._likes.toLocaleString()}</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Action */}
                    <div className="col-action">
                      <Button
                        as="span"
                        variant="secondary"
                        size="sm"
                        iconRight={<ExternalLink size={12} />}
                        className="btn-table-view"
                      >
                        Profile
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="leaderboard-pagination-footer">
              <div className="pagination-count-info">
                {allRankedTrainers.length === 0
                  ? `Showing 0 of 0 trainers`
                  : `Showing ${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, allRankedTrainers.length)} of ${allRankedTrainers.length.toLocaleString()} trainers`}
              </div>

              <div className="pagination-buttons-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  className="pagination-btn"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  icon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "secondary"}
                        size="sm"
                        className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="pagination-btn"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  iconRight={<ChevronRight size={16} />}
                >
                  Next
                </Button>
              </div>

              <SelectField
                value={pageSize}
                onChange={(val) => setPageSize(Number(val))}
                options={[
                  { value: 10, label: "10 per page" },
                  { value: 25, label: "25 per page" },
                  { value: 50, label: "50 per page" },
                  { value: 100, label: "100 per page" },
                ]}
                size="sm"
                placement="top"
                className="leaderboard-pagesize-select"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

