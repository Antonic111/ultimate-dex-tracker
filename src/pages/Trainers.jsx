import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "flag-icons/css/flag-icons.min.css";
import "../css/Trainers.css";
import { COUNTRY_OPTIONS } from "../data/countries";
import { Mars, Venus, VenusAndMars, Sparkles, Search, Heart, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, RefreshCcw, MoveUp, MoveDown } from "lucide-react";
import { LoadingSpinner, SkeletonLoader } from "../components/Shared";
import { profileAPI } from "../utils/api";

const PAGE_SIZE = 20;

const pickCountry = (loc) =>
  (COUNTRY_OPTIONS.find(c => c.name === loc || c.value === loc || c.code === loc)?.code || "")
    .toLowerCase();

const genderIcon = (g) => {
  if (g === "Male")   return <Mars size={14} color="#4aaaff" />;
  if (g === "Female") return <Venus size={14} color="#ff6ec7" />;
  if (g)              return <VenusAndMars size={14} />;
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
  const [hideZeroShinies, setHideZeroShinies] = useState(false);
  const [refreshRotating, setRefreshRotating] = useState(false);
  const [randomSeed, setRandomSeed] = useState(0);
  const sortButtonRef = useRef(null);

  // paging for "no search" mode
  const [page, setPage] = useState(1);

  const query = useMemo(() => q.trim(), [q]);

  // Sort and filter items based on current sort type, direction, and hide zero shinies setting
  // Sort and filter all data based on current sort type, direction, and hide zero shinies setting
  const sortedAndFilteredData = useMemo(() => {
    if (!allFilteredData.length) return [];
    
    let filtered = [...allFilteredData];
    
    // Filter out profiles with 0 shinies if toggle is enabled
    if (hideZeroShinies) {
      filtered = filtered.filter(u => {
        // Handle different possible data structures from API
        const shinies = u.shinies || u.shinyCount || u.totalShinies || 0;
        return typeof shinies === "number" && shinies > 0;
      });
    }
    
    // Sort the filtered items
    switch (sortType) {
      case "most-shinies":
        const shiniesSorted = filtered.sort((a, b) => {
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
      case "random":
        return filtered.sort(() => Math.random() - 0.5);
      default:
        return filtered;
    }
  }, [allFilteredData, sortType, sortDirection, hideZeroShinies, randomSeed]);

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
  }, [sortType, sortDirection, hideZeroShinies]);

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



  // initial load + react to query changes
  useEffect(() => {
    let ignore = false;
    // reset paging whenever the query changes
    setPage(1);

    const run = async () => {
      setLoading(true);
      try {
        const data = await profileAPI.getPublicUsers(query, 1, PAGE_SIZE, false);
        
        // Use real API data
        const filteredData = data.items || [];

        if (!ignore) {
          // Store all filtered data for pagination
          setAllFilteredData(filteredData);
          // Reset to first page when query changes
          setPage(1);
          // Track if pagination is needed
        }
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
        if (!ignore) {
          // Handle error silently
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const t = setTimeout(run, 300); // debounce typing
    return () => { clearTimeout(t); ignore = true; };
  }, [query]);



  const getSortLabel = () => {
    switch (sortType) {
      case "most-shinies": 
        return sortDirection === "desc" ? "Most Shinies" : "Least Shinies";
      case "most-likes": 
        return sortDirection === "desc" ? "Most Likes" : "Least Likes";
      case "alphabetical": 
        return sortDirection === "desc" ? "Z → A" : "A → Z";
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
    <div className="container trainers-page">
      <h1 className="page-title">Trainers</h1>

      <div className="search-row">
        <div className="search-input-wrap">
          <Search className="search-icon" size={18} />
          <input
            className="trainer-search has-icon"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search username…"
            autoFocus
            aria-label="Search trainers"
          />
        </div>
        
        <div className="hide-zero-shinies-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={hideZeroShinies}
              onChange={(e) => setHideZeroShinies(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">Hide 0 Shinies</span>
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
                  <Sparkles size={12} />
                  <span>Shinies</span>
                </div>
                <button
                  className={`sort-option ${sortType === "most-shinies" && sortDirection === "desc" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("most-shinies");
                    setSortDirection("desc");
                    setShowSortDropdown(false);
                  }}
                >
                  Most Shinies
                </button>
                <button
                  className={`sort-option ${sortType === "most-shinies" && sortDirection === "asc" ? "active" : ""}`}
                  onClick={() => {
                    setSortType("most-shinies");
                    setSortDirection("asc");
                    setShowSortDropdown(false);
                  }}
                >
                  Least Shinies
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
            <RefreshCcw size={20} className={`refresh-icon ${refreshRotating ? 'rotate' : ''}`} style={{width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px'}} />
          ) : sortDirection === "desc" ? (
            <MoveDown size={20} style={{width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px'}} />
          ) : (
            <MoveUp size={20} style={{width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px'}} />
          )}
        </button>
      </div>

      <div className="app-divider" />

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
                  const shinies = u.shinies || u.shinyCount || u.totalShinies || 0;
                  return typeof shinies === "number" ? (
                    <div className="trainer-badge">
                      <Sparkles size={14} />
                      <span>{shinies}</span>
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
                    <div className="trainer-name">{u.username}</div>
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

          {/* Pagination */}
          {!query && sortedAndFilteredData.length > PAGE_SIZE && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, sortedAndFilteredData.length)} of {sortedAndFilteredData.length} trainers
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn prev-btn" 
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                  }}
                  disabled={page === 1}
                >
                  Previous
                </button>
                
                <div className="page-numbers">
                  {(() => {
                    const totalPages = Math.ceil(sortedAndFilteredData.length / PAGE_SIZE);
                    const currentPage = page;
                    const pages = [];
                    
                    // Always show first page
                    pages.push(
                      <button 
                        key={1} 
                        className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
                        onClick={() => {
                          setPage(1);
                        }}
                      >
                        1
                      </button>
                    );
                    
                    // Show ellipsis if there's a gap
                    if (currentPage > 3) {
                      pages.push(<span key="ellipsis1" className="page-ellipsis">...</span>);
                    }
                    
                    // Show current page and surrounding pages
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                      if (i !== 1 && i !== totalPages) {
                        pages.push(
                          <button 
                            key={i} 
                            className={`page-btn ${i === currentPage ? 'active' : ''}`}
                            onClick={() => {
                              setPage(i);
                            }}
                          >
                            {i}
                          </button>
                        );
                      }
                    }
                    
                    // Show ellipsis if there's a gap
                    if (currentPage < totalPages - 2) {
                      pages.push(<span key="ellipsis2" className="page-ellipsis">...</span>);
                    }
                    
                    // Always show last page
                    pages.push(
                      <button 
                        key={totalPages} 
                        className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                        onClick={() => {
                          setPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </button>
                    );
                    
                    return pages;
                  })()}
                </div>
                
                <button 
                  className="pagination-btn next-btn" 
                  onClick={() => {
                    const newPage = Math.min(Math.ceil(sortedAndFilteredData.length / PAGE_SIZE), page + 1);
                    setPage(newPage);
                  }}
                  disabled={page >= Math.ceil(sortedAndFilteredData.length / PAGE_SIZE)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          {query ? `No trainers found matching "${query}"` : 
           hideZeroShinies ? (
             <>
               No trainers with shinies found.<br />
               Try disabling the 'Hide 0 Shinies' filter.
             </>
           ) : 
           "No trainers found"}
        </div>
      )}
    </div>
  );
}
