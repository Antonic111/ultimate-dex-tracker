import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useUser } from "../components/Shared/UserContext";
import { useLoading } from "../components/Shared/LoadingContext";
import { useMessage } from "../components/Shared/MessageContext";
import { LoadingSpinner } from "../components/Shared";
import { profileAPI, caughtAPI, creatorAPI } from "../utils/api";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { calculateProfileStats } from "../utils/profileUtils";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { getSpriteUrl } from "../utils/spriteUtils";
import { formatPokemonName, getFormDisplayName } from "../utils";

import ProfileHero from "../components/Profile/ProfileHero";
import ProfileTopStats from "../components/Profile/ProfileTopStats";
import ProfileInfoBox from "../components/Profile/ProfileInfoBox";
import ProfileStatsGrid from "../components/Profile/ProfileStatsGrid";
import ProfileFavorites from "../components/Profile/ProfileFavorites";
import ProfileModals from "../components/Profile/ProfileModals";

import "../css/Profile.css";
import "../css/ProfileRedesign.css";
import "flag-icons/css/flag-icons.min.css";

const FORM_TYPES_FOR_FAVORITES = [
    "alolan", "galarian", "gmax", "hisuian", "paldean", "unown", "other", "alcremie", "vivillon"
];

export default function ProfilePage() {
    const { username: routeUsername } = useParams();
    const navigate = useNavigate();
    const { username: currentUsername, email, createdAt: currentUserCreatedAt, loading: userLoading, setUser } = useUser();
    const { setLoading, isLoading } = useLoading();
    const { showMessage } = useMessage();

    const isOwner = !routeUsername || routeUsername.toLowerCase() === currentUsername?.toLowerCase();
    const targetUsername = routeUsername || currentUsername;

    const [profileData, setProfileData] = useState(null);
    const [statsData, setStatsData] = useState({ stats: null, recentAdded: [] });
    
    // UI states
    const [isEditing, setIsEditing] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [likeBurst, setLikeBurst] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    // Editing form state
    const [form, setForm] = useState({
        bio: "",
        location: "",
        gender: "",
        profileTrainer: "",
        favoriteGames: ["", "", "", "", ""],
        favoritePokemon: ["", "", "", "", ""],
        favoritePokemonShiny: [false, false, false, false, false],
        switchFriendCode: "",
        goFriendCode: "",
        youtubeUrl: "",
        twitchUrl: "",
    });
    const formBeforeEditRef = useRef(null);

    // Creator / Admin
    const [isAdmin, setIsAdmin] = useState(false);
    const [isContentCreator, setIsContentCreator] = useState(false);
    const [creatorStatus, setCreatorStatus] = useState("none");
    const [showCreatorModal, setShowCreatorModal] = useState(false);
    
    // Selection Modals
    const [showTrainerModal, setShowTrainerModal] = useState(false);
    const [showGameModal, setShowGameModal] = useState(false);
    const [gameSlotIndex, setGameSlotIndex] = useState(null);
    const [showPokemonModal, setShowPokemonModal] = useState(false);
    const [pokemonSlotIndex, setPokemonSlotIndex] = useState(null);

    // Preferences
    const [dexPreferences, setDexPreferences] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dexPreferences')) || null;
        } catch { return null; }
    });
    const [useHomeSprites, setUseHomeSprites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dexPreferences'))?.useHomeSprites || false;
        } catch { return false; }
    });
    const [profileOwnerPreferences, setProfileOwnerPreferences] = useState(null);

    // Form data calculation
    const filteredFormsData = useMemo(() => {
        const prefs = isOwner ? dexPreferences : profileOwnerPreferences;
        if (!prefs) return formsData;
        return getFilteredFormsData(formsData, prefs);
    }, [isOwner, dexPreferences, profileOwnerPreferences]);

    const POKEMON_OPTIONS = useMemo(() => {
        const base = pokemonData.map(p => ({
            name: formatPokemonName(p.name),
            value: p.name,
            image: getSpriteUrl(p, false, useHomeSprites),
            shinyImage: getSpriteUrl(p, true, useHomeSprites),
        }));
        const forms = filteredFormsData
            .filter((p) => FORM_TYPES_FOR_FAVORITES.includes(p.formType))
            .map((p) => {
                const formLabel = getFormDisplayName(p);
                const baseName = formatPokemonName(p.name);
                return {
                    name: formLabel ? `${baseName} (${formLabel})` : baseName,
                    value: p.name,
                    image: getSpriteUrl(p, false, useHomeSprites),
                    shinyImage: getSpriteUrl(p, true, useHomeSprites),
                };
            });
        return [...base, ...forms];
    }, [filteredFormsData, useHomeSprites]);

    // Redirection for unauth owners
    useEffect(() => {
        if (isOwner && !userLoading && (!currentUsername || !email)) {
            navigate("/");
        }
    }, [isOwner, userLoading, currentUsername, email, navigate]);

    // Event listeners
    useEffect(() => {
        const handlePrefsChange = () => {
            try {
                const prefs = JSON.parse(localStorage.getItem('dexPreferences'));
                if (prefs) {
                    setDexPreferences(prefs);
                    setUseHomeSprites(prefs.useHomeSprites || false);
                }
            } catch { }
        };
        window.addEventListener('dexPreferencesChanged', handlePrefsChange);
        return () => window.removeEventListener('dexPreferencesChanged', handlePrefsChange);
    }, []);

    useEffect(() => {
        if (!isEditing) return;
        const handleBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
        const handleClick = (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.origin === window.location.origin) {
                e.preventDefault(); e.stopPropagation();
                setPendingNavigation(link.getAttribute('href') || '/');
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleClick, { capture: true });
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleClick, { capture: true });
        };
    }, [isEditing]);

    useEffect(() => {
        const preventScroll = (e) => e.preventDefault();
        if (pendingNavigation) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('wheel', preventScroll, { passive: false });
            document.addEventListener('touchmove', preventScroll, { passive: false });
        } else {
            document.body.style.overflow = '';
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
        }
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('touchmove', preventScroll);
        };
    }, [pendingNavigation]);

    // Fetch Profile Data
    useEffect(() => {
        if (!targetUsername && !isOwner) return; // Wait until ready
        if (isOwner && userLoading) return;

        let ignore = false;
        setLoading('profile-data', true);

        const fetchData = async () => {
            try {
                if (isOwner) {
                    const data = await profileAPI.getProfile();
                    if (ignore) return;
                    setProfileData(data);
                    setForm(prev => ({
                        ...prev,
                        bio: data.bio && data.bio.length > 150 ? data.bio.substring(0, 150) : (data.bio ?? prev.bio),
                        location: data.location ?? prev.location,
                        gender: data.gender ?? prev.gender,
                        profileTrainer: data.profileTrainer ?? prev.profileTrainer,
                        favoriteGames: Array.isArray(data.favoriteGames) ? [...data.favoriteGames] : prev.favoriteGames,
                        favoritePokemon: Array.isArray(data.favoritePokemon) ? [...data.favoritePokemon] : prev.favoritePokemon,
                        favoritePokemonShiny: Array.isArray(data.favoritePokemonShiny) ? [...data.favoritePokemonShiny] : prev.favoritePokemonShiny,
                        switchFriendCode: data.switchFriendCode ?? prev.switchFriendCode,
                        goFriendCode: data.goFriendCode ?? prev.goFriendCode,
                        youtubeUrl: data.youtubeUrl ?? prev.youtubeUrl,
                        twitchUrl: data.twitchUrl ?? prev.twitchUrl
                    }));
                    setIsAdmin(data.isAdmin ?? false);
                    setIsContentCreator(data.isContentCreator ?? false);
                    if (!data.isContentCreator) {
                        creatorAPI.getStatus().then(res => { if (!ignore) setCreatorStatus(res.status); }).catch(() => {});
                    } else {
                        setCreatorStatus("approved");
                    }
                    setProfileOwnerPreferences(dexPreferences);
                } else {
                    const data = await profileAPI.getPublicProfile(targetUsername);
                    if (ignore) return;
                    setProfileData(data);
                    setForm(prev => ({
                        ...prev,
                        bio: data.bio, location: data.location, gender: data.gender, profileTrainer: data.profileTrainer,
                        favoriteGames: data.favoriteGames || [], favoritePokemon: data.favoritePokemon || [],
                        favoritePokemonShiny: data.favoritePokemonShiny || [], switchFriendCode: data.switchFriendCode,
                        goFriendCode: data.goFriendCode, youtubeUrl: data.youtubeUrl, twitchUrl: data.twitchUrl
                    }));
                    setIsAdmin(data.isAdmin ?? false);
                    setIsContentCreator(data.isContentCreator ?? false);
                    
                    const prefs = data.dexPreferences || {
                        showGenderForms: true, showAlolanForms: true, showGalarianForms: true, showHisuianForms: true,
                        showPaldeanForms: true, showGmaxForms: true, showUnownForms: true, showOtherForms: true,
                        showAlcremieForms: true, showVivillonForms: true, showAlphaForms: true, showAlphaOtherForms: true,
                        showMightyForms: true,
                    };
                    setProfileOwnerPreferences(prefs);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
                if (!ignore && !isOwner) {
                    setProfileOwnerPreferences({
                        showGenderForms: true, showAlolanForms: true, showGalarianForms: true, showHisuianForms: true,
                        showPaldeanForms: true, showGmaxForms: true, showUnownForms: true, showOtherForms: true,
                        showAlcremieForms: true, showVivillonForms: true, showAlphaForms: true, showAlphaOtherForms: true,
                        showMightyForms: true,
                    });
                }
            } finally {
                if (!ignore) setLoading('profile-data', false);
            }
        };
        fetchData();
        return () => { ignore = true; };
    }, [isOwner, targetUsername, userLoading, dexPreferences]); // Added dexPreferences to sync owner prefs if they change

    // Fetch Profile Stats
    const optimisticOrderRef = useRef(null);
    useEffect(() => {
        if (!targetUsername && !isOwner) return;
        if (!isOwner && !profileOwnerPreferences) return; // Wait for prefs to calculate correctly
        
        let ignore = false;
        setLoading('profile-stats', true);

        const loadStats = async () => {
            try {
                let map = {};
                if (isOwner) {
                    const serverMap = await caughtAPI.getCaughtData();
                    map = serverMap;
                    try {
                        const raw = localStorage.getItem(`caughtInfoMap:${currentUsername}`);
                        if (raw) {
                            const localCache = JSON.parse(raw);
                            if (localCache && typeof localCache === 'object') {
                                map = { ...serverMap, ...localCache };
                            }
                        }
                    } catch {}
                    if (!optimisticOrderRef.current) {
                        try {
                            const stored = JSON.parse(sessionStorage.getItem('recentCatchOrder') || '[]');
                            if (stored.length > 0) optimisticOrderRef.current = stored;
                        } catch {}
                    }
                } else {
                    const response = await profileAPI.getPublicCaughtData(targetUsername);
                    map = response?.caughtPokemon || {};
                }

                const prefsToUse = isOwner ? dexPreferences : profileOwnerPreferences;
                const result = calculateProfileStats(map, prefsToUse, optimisticOrderRef.current);
                
                if (!ignore) {
                    setStatsData(result);
                }
            } catch (err) {
                console.error("Failed to load stats:", err);
            } finally {
                if (!ignore) setLoading('profile-stats', false);
            }
        };
        loadStats();
        return () => { ignore = true; };
    }, [isOwner, targetUsername, profileOwnerPreferences, dexPreferences, refreshKey, currentUsername]);

    // Likes & Visibility logic
    useEffect(() => {
        if (!targetUsername) return;
        let ignore = false;
        const fetchLikes = async () => {
            if (document.hidden) return;
            try {
                const { hasLiked: userHasLiked, likeCount: count } = await profileAPI.getProfileLikes(targetUsername);
                if (!ignore) {
                    setLikeCount(count);
                    setHasLiked(userHasLiked);
                }
            } catch {}
        };
        fetchLikes();

        const handleFocus = () => { if (!document.hidden) fetchLikes(); };
        window.addEventListener('focus', handleFocus);
        window.addEventListener('visibilitychange', handleFocus);

        return () => {
            ignore = true;
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('visibilitychange', handleFocus);
        };
    }, [targetUsername]);

    const refreshRecentPokemon = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        const handleVisibilityChange = () => { if (!document.hidden) refreshRecentPokemon(); };
        const handleFocus = () => refreshRecentPokemon();
        
        const handleCaughtDataChanged = (e) => {
            if (!isOwner) return;
            const { pokemon, caughtInfo, wasCaught, isShiny, isNewEntry } = e?.detail || {};
            if (pokemon && caughtInfo && (!wasCaught || isNewEntry)) {
                setStatsData(prev => {
                    const newEntry = { mon: pokemon, info: { ...caughtInfo, isShiny: !!isShiny } };
                    const filtered = prev.recentAdded.filter(p => p.mon?.stableId !== pokemon.stableId || !!p.info?.isShiny !== !!isShiny);
                    const next = [newEntry, ...filtered].slice(0, 5);
                    optimisticOrderRef.current = next.map(p => ({ stableId: p.mon?.stableId, isShiny: !!p.info?.isShiny }));
                    return { ...prev, recentAdded: next };
                });
            } else if (pokemon && caughtInfo && wasCaught) {
                setStatsData(prev => {
                    const next = prev.recentAdded.map(p => {
                        if (p.mon?.stableId === pokemon.stableId && !!p.info?.isShiny === !!isShiny) {
                            return { ...p, info: { ...caughtInfo, isShiny: !!isShiny } };
                        }
                        return p;
                    });
                    return { ...prev, recentAdded: next };
                });
            } else if (pokemon && !caughtInfo) {
                setStatsData(prev => {
                    const next = prev.recentAdded.filter(p => !(p.mon?.stableId === pokemon.stableId && !!p.info?.isShiny === !!isShiny));
                    optimisticOrderRef.current = next.map(p => ({ stableId: p.mon?.stableId, isShiny: !!p.info?.isShiny }));
                    return { ...prev, recentAdded: next };
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('caughtDataChanged', handleCaughtDataChanged);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('caughtDataChanged', handleCaughtDataChanged);
        };
    }, [isOwner]);

    if ((isOwner && userLoading) || isLoading('profile-data')) {
        return <div className="profile-wrapper"><LoadingSpinner fullScreen /></div>;
    }

    if (!profileData && !isOwner) {
        return (
            <div className="profile-wrapper page-container profile-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--text)' }}>Profile not found</h2>
            </div>
        );
    }

    const createdAt = isOwner ? currentUserCreatedAt : profileData?.createdAt;

    return (
        <div data-tutorial-id="profile-overview" className="profile-wrapper page-container profile-page">
            <ProfileHero 
                username={targetUsername}
                createdAt={createdAt}
                isOwner={isOwner}
                isEditing={isEditing}
                isAdmin={isAdmin}
                isContentCreator={isContentCreator}
                form={form}
                setForm={setForm}
                likeCount={likeCount}
                hasLiked={hasLiked}
                likeLoading={likeLoading}
                likeBurst={likeBurst}
                setLikeCount={setLikeCount}
                setHasLiked={setHasLiked}
                setLikeLoading={setLikeLoading}
                setLikeBurst={setLikeBurst}
                creatorStatus={creatorStatus}
                setShowCreatorModal={setShowCreatorModal}
                setIsEditing={setIsEditing}
                formBeforeEditRef={formBeforeEditRef}
                setUser={setUser}
                currentUsername={currentUsername}
                setShowTrainerModal={setShowTrainerModal}
                isOnline={isOwner ? true : Boolean(profileData?.isOnline)}
            />

            <ProfileTopStats 
                stats={statsData.stats} 
                targetUsername={targetUsername}
                isOwner={isOwner}
                hasBingoData={isOwner ? true : Boolean(profileData?.hasBingoData)}
            />

            <div className={`profile-columns-container ${isEditing ? "editing-mode" : ""}`}>
                <div className="profile-left-col">
                    <ProfileInfoBox 
                        isOwner={isOwner}
                        isEditing={isEditing}
                        form={form}
                        setForm={setForm}
                    />
                    <ProfileFavorites 
                        isOwner={isOwner}
                        isEditing={isEditing}
                        form={form}
                        POKEMON_OPTIONS={POKEMON_OPTIONS}
                        openGameModal={(i) => { setGameSlotIndex(i); setShowGameModal(true); }}
                        openPokemonModal={(i) => { setPokemonSlotIndex(i); setShowPokemonModal(true); }}
                    />
                </div>

                <div className="profile-right-col">
                    <ProfileStatsGrid 
                        stats={statsData.stats} 
                        recentAdded={statsData.recentAdded} 
                        useHomeSprites={useHomeSprites} 
                        targetUsername={targetUsername} 
                    />
                </div>
            </div>

            <ProfileModals 
                isOwner={isOwner}
                isEditing={isEditing}
                form={form}
                setForm={setForm}
                showCreatorModal={showCreatorModal}
                setShowCreatorModal={setShowCreatorModal}
                setCreatorStatus={setCreatorStatus}
                showTrainerModal={showTrainerModal}
                setShowTrainerModal={setShowTrainerModal}
                showGameModal={showGameModal}
                setShowGameModal={setShowGameModal}
                gameSlotIndex={gameSlotIndex}
                showPokemonModal={showPokemonModal}
                setShowPokemonModal={setShowPokemonModal}
                pokemonSlotIndex={pokemonSlotIndex}
                POKEMON_OPTIONS={POKEMON_OPTIONS}
                pendingNavigation={pendingNavigation}
                setPendingNavigation={setPendingNavigation}
                setIsEditing={setIsEditing}
            />
        </div>
    );
}
