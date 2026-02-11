import { useEffect, useMemo, useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import "flag-icons/css/flag-icons.min.css";
import "../css/Trainers.css";
import { COUNTRY_OPTIONS } from "../data/countries";
import { Mars, Venus, VenusAndMars, Search, Heart, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, RefreshCcw, MoveUp, MoveDown, Check, X, Crown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import { profileAPI } from "../utils/api";
import { UserContext } from "../components/Shared/UserContext";
import { PokeballIcon } from "../components/Shared/SearchBar";

const PAGE_SIZE = 20;

const pickCountry = (loc) =>
  (COUNTRY_OPTIONS.find(c => c.name === loc || c.value === loc || c.code === loc)?.code || "")
    .toLowerCase();

const genderIcon = (g) => {
  if (g === "Male") return <Mars size={14} color="#4aaaff" />;
  if (g === "Female") return <Venus size={14} color="#ff6ec7" />;
  if (g) return <VenusAndMars size={14} />;
  return null;
};

export default function Trainers() {
  const [q, setQ] = useState("");
  const [allFilteredData, setAllFilteredData] = useState([]);
  const [sortedItems, setSortedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("random");
  const [sortDirection, setSortDirection] = useState("desc"); // "asc" or "desc"
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hideZeroCaught, setHideZeroCaught] = useState(false);
  const [refreshRotating, setRefreshRotating] = useState(false);
  const [randomSeed, setRandomSeed] = useState(0);
  const sortButtonRef = useRef(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const isMakingApiCall = useRef(false);

  // Get current user context to filter out own profile
  const { username } = useContext(UserContext);

  // paging for "no search" mode
  const [page, setPage] = useState(1);

  const query = useMemo(() => q.trim(), [q]);

  // Sort and filter items based on current sort type, direction, and hide zero shinies setting
  // Sort and filter all data based on current sort type, direction, and hide zero shinies setting
  const sortedAndFilteredData = useMemo(() => {
    if (!allFilteredData.length) return [];

    let filtered = [...allFilteredData];

    // Filter out profiles with 0 caught if toggle is enabled
    if (hideZeroCaught) {
      filtered = filtered.filter(u => {
        // Handle different possible data structures from API
        // TODO: Update this when API provides total caught count (shiny + regular)
        const totalCaught = u.shinies || u.shinyCount || u.totalShinies || 0;
        return typeof totalCaught === "number" && totalCaught > 0;
      });
    }

    // Sort the filtered items
    switch (sortType) {
      case "most-shinies":
        const shiniesSorted = filtered.sort((a, b) => {
          // TODO: Update this when API provides total caught count (shiny + regular)
          // For now, using shiny count as placeholder
          const aShinies = a.shinies || a.shinyCount || a.totalShinies || 0;
          const bShinies = b.shinies || b.shinyCount || b.totalShinies || 0;
          return sortDirection === "desc" ? bShinies - aShinies : aShinies - bShinies;
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
      // Clear sorted items when no data
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

  // Handle initial load when username becomes available (including null for non-logged-in users)
  useEffect(() => {
    if (username !== undefined) {
      // Trigger the main data fetch when username is available (including null for non-logged-in users)
      setPage(1);
    }
  }, [username]);

  // Cleanup effect to reset API call ref
  useEffect(() => {
    return () => {
      isMakingApiCall.current = false;
    };
  }, []);

  // initial load + react to query changes
  useEffect(() => {
    let ignore = false;
    // reset paging whenever the query changes
    setPage(1);

    const run = async () => {
      // Prevent running if we're already making an API call
      if (isMakingApiCall.current) {
        return;
      }

      isMakingApiCall.current = true;
      setLoading(true);
      try {
        let allUsers = [];

        if (query) {
          // For search queries, fetch the first page (search results are typically smaller)
          const data = await profileAPI.getPublicUsers(query, 1, 50, false);
          allUsers = data.items || [];
        } else {
          // For no search query, fetch ALL users by fetching in batches
          // API max pageSize is 50, so we'll fetch 50 at a time
          let currentPage = 1;
          const batchSize = 50; // API max is 50
          let totalUsers = null;
          let hasMore = true;

          while (hasMore && !ignore) {
            const data = await profileAPI.getPublicUsers('', currentPage, batchSize, false);
            const batch = data.items || [];

            // Get total from first response - API now returns accurate total count
            if (totalUsers === null && data.total !== undefined) {
              totalUsers = data.total;
            }

            if (batch.length > 0) {
              allUsers = [...allUsers, ...batch];
              currentPage++;

              // Check if we've fetched all users
              if (totalUsers !== null) {
                // Use the total count from API to know when we're done
                hasMore = allUsers.length < totalUsers;
              } else {
                // Fallback: if we got fewer items than requested, we've reached the end
                hasMore = batch.length === batchSize;
              }
            } else {
              hasMore = false;
            }

            // Safety limit: don't fetch more than 2000 users (40 batches)
            if (currentPage > 40) {
              hasMore = false;
            }
          }
        }

        // Filter out current user's profile if logged in
        let filteredData = allUsers;
        if (username) {
          filteredData = filteredData.filter(trainer => trainer.username !== username);
        }

        // Filter verified accounts only
        const verifiedUsers = filteredData.filter(trainer => {
          return trainer.verified === true;
        });

        filteredData = verifiedUsers;
        setUsingFallback(false);

        if (!ignore) {
          // Store all filtered data for pagination
          setAllFilteredData(filteredData);
          // Reset to first page when query changes
          setPage(1);
          // Debug: log how many users we fetched
          console.log(`Fetched ${allUsers.length} total users, ${filteredData.length} verified users after filtering`);
        }
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
        if (!ignore) {
          setAllFilteredData([]);
        }
      } finally {
        if (!ignore) setLoading(false);
        isMakingApiCall.current = false;
      }
    };

    const t = setTimeout(run, 300); // debounce typing
    return () => { clearTimeout(t); ignore = true; };
  }, [query, username]);



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
    // Force re-randomization by incrementing the seed
    setRandomSeed(prev => prev + 1);
    setTimeout(() => {
      setRefreshRotating(false);
    }, 600); // Match animation duration
  };

  return (
    <div className="container page-container trainers-page">
      <h1 className="page-title">Trainers</h1>

      <div className="search-row">
        <div className="search-input-wrap">
          <Search className="search-icon" size={18} />
          <div className="relative flex-1">
            <input
              className="trainer-search has-icon"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search username…"
              autoFocus
              aria-label="Search trainers"
              style={{ width: '100%' }}
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors"
                style={{ color: 'var(--accent)' }}
                onMouseEnter={(e) => {
                  e.target.style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'var(--accent)';
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="search-controls">
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
            <button
              className="sort-button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              aria-label="Sort trainers"
            >
              <ArrowUpDown size={18} />
              <span>{getSortLabel()}</span>
            </button>

            {showSortDropdown && (
              <div className="sort-dropdown">
                <div className="sort-section">
                  <div className="sort-section-title">
                    <PokeballIcon size={12} />
                    <span>Caught</span>
                  </div>
                  <button
                    className={`sort-option ${sortType === "most-shinies" && sortDirection === "desc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("most-shinies");
                      setSortDirection("desc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Most Caught
                  </button>
                  <button
                    className={`sort-option ${sortType === "most-shinies" && sortDirection === "asc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("most-shinies");
                      setSortDirection("asc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Least Caught
                  </button>
                </div>

                <div className="sort-section">
                  <div className="sort-section-title">
                    <Heart size={12} />
                    <span>Likes</span>
                  </div>
                  <button
                    className={`sort-option ${sortType === "most-likes" && sortDirection === "desc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("most-likes");
                      setSortDirection("desc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Most Likes
                  </button>
                  <button
                    className={`sort-option ${sortType === "most-likes" && sortDirection === "asc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("most-likes");
                      setSortDirection("asc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Least Likes
                  </button>
                </div>

                <div className="sort-section">
                  <div className="sort-section-title">
                    <Search size={12} />
                    <span>Name</span>
                  </div>
                  <button
                    className={`sort-option ${sortType === "alphabetical" && sortDirection === "asc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("alphabetical");
                      setSortDirection("asc");
                      setShowSortDropdown(false);
                    }}
                  >
                    A → Z
                  </button>
                  <button
                    className={`sort-option ${sortType === "alphabetical" && sortDirection === "desc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("alphabetical");
                      setSortDirection("desc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Z → A
                  </button>
                </div>

                <div className="sort-section">
                  <div className="sort-section-title">
                    <Calendar size={12} />
                    <span>Date Joined</span>
                  </div>
                  <button
                    className={`sort-option ${sortType === "date-created" && sortDirection === "desc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("date-created");
                      setSortDirection("desc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Newest
                  </button>
                  <button
                    className={`sort-option ${sortType === "date-created" && sortDirection === "asc" ? "active" : ""}`}
                    onClick={() => {
                      setSortType("date-created");
                      setSortDirection("asc");
                      setShowSortDropdown(false);
                    }}
                  >
                    Oldest
                  </button>
                </div>

                <button
                  className={`sort-option ${sortType === "random" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("random");
                    setShowSortDropdown(false);
                  }}
                >
                  Random
                </button>
              </div>
            )}
          </div>

          <button
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
          </button>
        </div>
      </div>

      <div className="app-divider" />

      {/* General notice about verified accounts only */}
      <div className="verified-notice">
        <Check size={16} />
        <span>Only email verified accounts are shown in this list.</span>
      </div>

      {/* Fallback notice when filtering fails */}
      {usingFallback && (
        <div className="verified-notice" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: '#ffc107' }}>
          <span>⚠️ Verified filtering is temporarily disabled. The API is missing the 'verified' field. All trainers are shown until this is fixed on the backend.</span>
        </div>
      )}

      {/* Show loading when actually loading, regardless of login status */}
      {loading ? (
        <div className="trainer-grid">
          {Array.from({ length: 20 }).map((_, i) => (
            <div className="trainer-card skeleton-card" key={i}>
              <div className="skeleton-card-head">
                <div className="skeleton-avatar" />
                <div className="skeleton-meta-content">
                  <div className="skeleton-name" />
                  <div className="skeleton-meta" />
                </div>
              </div>
              <div className="skeleton-bio" />
            </div>
          ))}
        </div>
      ) : sortedItems.length ? (
        <>
          <div className="trainer-grid">
            {sortedItems.map((u) => (
              <Link key={u.username} to={`/u/${u.username}`} className="trainer-card">
                {(() => {
                  // TODO: Update this when API provides total caught count (shiny + regular)
                  // For now, using shiny count as placeholder
                  const totalCaught = u.shinies || u.shinyCount || u.totalShinies || 0;
                  return typeof totalCaught === "number" ? (
                    <div className="trainer-badge">
                      <PokeballIcon size={14} />
                      <span>{totalCaught}</span>
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const likes = u.likes || u.likeCount || u.totalLikes || 0;
                  return typeof likes === "number" && likes > 0 ? (
                    <div className="trainer-badge trainer-likes">
                      <Heart size={14} />
                      <span>{likes}</span>
                    </div>
                  ) : null;
                })()}

                <div className="trainer-card-head">
                  <img
                    src={u.profileTrainer ? `/data/trainer_sprites/${u.profileTrainer}` : "/avatar.png"}
                    alt=""
                    className="trainer-avatar"
                  />
                  <div className="trainer-meta">
                    <div className="trainer-name">
                      {u.username}
                      {u.isAdmin && (
                        <span className="crown-wrapper">
                          <Crown
                            size={16}
                            strokeWidth={2.5}
                            style={{
                              color: "#fbbf24",
                              flexShrink: 0,
                              marginLeft: "6px"
                            }}
                          />
                          <span className="crown-tooltip">Admin</span>
                        </span>
                      )}
                    </div>
                    <div className="trainer-sub trainer-sub-icons">
                      {(() => {
                        const code = pickCountry(u.location);
                        const flag = code ? <span className={`fi fi-${code}`} /> : null;
                        const g = genderIcon(u.gender);
                        return (
                          <>
                            {flag}
                            {flag && g ? <span className="dot-sep" /> : null}
                            {g}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {u.bio ? (
                  <div className="trainer-bio">
                    {u.bio.length > 90 ? `${u.bio.slice(0, 90)}…` : u.bio}
                  </div>
                ) : (
                  <div className="trainer-bio muted">No bio yet</div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination - similar to changelog style */}
          {sortedAndFilteredData.length > PAGE_SIZE && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, sortedAndFilteredData.length)} of {sortedAndFilteredData.length} trainers
              </div>

              <div className="pagination-controls">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)) }, (_, i) => {
                    const totalPages = Math.ceil(sortedAndFilteredData.length / PAGE_SIZE);
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`page-btn ${page === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)))}
                  disabled={page >= Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)}
                  className="pagination-btn"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
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
  );
}
