import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, UserX } from "lucide-react";
import { useUser, useLoading, useMessage, SectionLoader } from "../components/Shared";
import { profileAPI, caughtAPI } from "../utils/api";
import { getFilteredFormsData } from "../utils/dexPreferences";
import { calculateProfileStats, extractYoutubeHandle, extractTwitchHandle } from "../utils/profileUtils";
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
import EditProfileModal from "../components/Profile/EditProfileModal";

import "../css/Profile.css";
import "../css/ProfileRedesign.css";
import "flag-icons/css/flag-icons.min.css";

const FORM_TYPES_FOR_FAVORITES = [
    "alpha", "alphaother", "alpha_other", "gender", "alolan", "galarian", "hisuian", "paldean", "gmax", "unown", "other", "alcremie", "vivillon", "mighty"
];

export default function ProfilePage() {
    const { username: routeUsername } = useParams();
    const navigate = useNavigate();
    const { username: currentUsername, email, createdAt: currentUserCreatedAt, loading: userLoading, setUser, isAdmin: currentUserIsAdmin, user: currentUserObj } = useUser();
    const isViewerAdmin = Boolean(currentUserIsAdmin || currentUserObj?.isAdmin);
    const { setLoading, isLoading } = useLoading();
    const { showMessage } = useMessage();

    const isOwner = !routeUsername || routeUsername.toLowerCase() === currentUsername?.toLowerCase();
    const targetUsername = routeUsername || currentUsername;

    const [profileData, setProfileData] = useState(null);
    const [statsData, setStatsData] = useState({ stats: null, recentAdded: [] });

    // UI states
    const [showEditModal, setShowEditModal] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [likeBurst, setLikeBurst] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    // Profile form state (read display only — editing happens in modal)
    const [form, setForm] = useState({
        bio: "",
        location: "",
        gender: "",
        birthday: null,
        profileTrainer: "",
        avatar: null,
        pendingAvatarFile: null,
        pendingAvatarRemoved: false,
        nameColor1: null,
        nameColor2: null,
        favoriteGames: ["", "", "", "", ""],
        favoritePokemon: ["", "", "", "", ""],
        favoritePokemonShiny: [false, false, false, false, false],
        favoriteBalls: ["", "", "", "", ""],
        favoriteTrainers: ["", "", "", "", ""],
        favoriteCategoryOrder: ["pokemon", "games"],
        switchFriendCode: "",
        goFriendCode: "",
        youtubeUrl: "",
        twitchUrl: "",
    });

    // Creator / Admin / Premium
    const [isAdmin, setIsAdmin] = useState(false);
    const [isContentCreator, setIsContentCreator] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumMonths, setPremiumMonths] = useState(0);
    const [creatorStatus, setCreatorStatus] = useState("none");
    const [showCreatorModal, setShowCreatorModal] = useState(false);

    // Selection Modals (used by ProfileModals for non-edit context & by EditProfileModal)
    const [showTrainerModal, setShowTrainerModal] = useState(false);
    const [showGameModal, setShowGameModal] = useState(false);
    const [gameSlotIndex, setGameSlotIndex] = useState(null);
    const [showPokemonModal, setShowPokemonModal] = useState(false);
    const [pokemonSlotIndex, setPokemonSlotIndex] = useState(null);
    const [showBallModal, setShowBallModal] = useState(false);
    const [showFavoriteTrainerModal, setShowFavoriteTrainerModal] = useState(false);

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
            id: p.id,
            gen: p.gen,
            formType: null,
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
                    id: p.id,
                    gen: p.gen,
                    formType: p.formType,
                    formLabel: formLabel || p.formType,
                    name: formLabel ? `${baseName} (${formLabel})` : baseName,
                    value: p.stableId || p.name,
                    baseName: p.name,
                    stableId: p.stableId,
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

    // Fetch Profile Data
    useEffect(() => {
        if (!targetUsername && !isOwner) return;
        if (isOwner && userLoading) return;

        let ignore = false;
        if (!profileData) {
            setLoading('profile-data', true);
        }

        const fetchData = async () => {
            try {
                if (isOwner) {
                    const data = await profileAPI.getProfile();
                    if (ignore) return;
                    setProfileData(data);
                    setForm(prev => ({
                        ...prev,
                        bio: data.bio && data.bio.length > 250 ? data.bio.substring(0, 250) : (data.bio ?? prev.bio),
                        location: data.location ?? prev.location,
                        gender: data.gender ?? prev.gender,
                        birthday: data.birthday ?? prev.birthday ?? null,
                        profileTrainer: data.profileTrainer ?? prev.profileTrainer,
                        avatar: data.avatar ?? prev.avatar,
                        nameColor1: data.nameColor1 ?? data.nameGradientColor1 ?? prev.nameColor1,
                        nameColor2: data.nameColor2 ?? data.nameGradientColor2 ?? prev.nameColor2,
                        favoriteGames: data.favoriteGames?.length ? data.favoriteGames : prev.favoriteGames,
                        favoritePokemon: data.favoritePokemon?.length ? data.favoritePokemon : prev.favoritePokemon,
                        favoritePokemonShiny: data.favoritePokemonShiny?.length ? data.favoritePokemonShiny : prev.favoritePokemonShiny,
                        favoriteBalls: data.favoriteBalls?.length ? data.favoriteBalls : prev.favoriteBalls,
                        favoriteTrainers: data.favoriteTrainers?.length ? data.favoriteTrainers : prev.favoriteTrainers,
                        favoriteCategoryOrder: Array.isArray(data.favoriteCategoryOrder) ? data.favoriteCategoryOrder : prev.favoriteCategoryOrder,
                        switchFriendCode: data.switchFriendCode ?? prev.switchFriendCode,
                        goFriendCode: data.goFriendCode ?? prev.goFriendCode,
                        youtubeUrl: data.youtubeUrl ? extractYoutubeHandle(data.youtubeUrl) : prev.youtubeUrl,
                        twitchUrl: data.twitchUrl ? extractTwitchHandle(data.twitchUrl) : prev.twitchUrl,
                    }));
                    setIsAdmin(Boolean(data.isAdmin));
                    setIsContentCreator(Boolean(data.isContentCreator));
                    setIsPremium(Boolean(data.isPremium));
                    setPremiumMonths(data.premiumMonths || 0);
                    setCreatorStatus(data.creatorStatus || "none");
                    setLikeCount(data.likeCount || 0);
                    setHasLiked(Boolean(data.hasLiked));
                } else {
                    const data = await profileAPI.getPublicProfile(targetUsername);
                    if (ignore) return;
                    setProfileData(data);
                    setForm(prev => ({
                        ...prev,
                        bio: data.bio ?? prev.bio,
                        location: data.location ?? prev.location,
                        gender: data.gender ?? prev.gender,
                        birthday: data.birthday !== undefined ? data.birthday : prev.birthday,
                        profileTrainer: data.profileTrainer ?? prev.profileTrainer,
                        avatar: data.avatar ?? prev.avatar,
                        nameColor1: data.nameColor1 ?? data.nameGradientColor1 ?? prev.nameColor1,
                        nameColor2: data.nameColor2 ?? data.nameGradientColor2 ?? prev.nameColor2,
                        favoriteGames: data.favoriteGames?.length ? data.favoriteGames : prev.favoriteGames,
                        favoritePokemon: data.favoritePokemon?.length ? data.favoritePokemon : prev.favoritePokemon,
                        favoritePokemonShiny: data.favoritePokemonShiny?.length ? data.favoritePokemonShiny : prev.favoritePokemonShiny,
                        favoriteBalls: data.favoriteBalls?.length ? data.favoriteBalls : prev.favoriteBalls,
                        favoriteTrainers: data.favoriteTrainers?.length ? data.favoriteTrainers : prev.favoriteTrainers,
                        favoriteCategoryOrder: Array.isArray(data.favoriteCategoryOrder) ? data.favoriteCategoryOrder : prev.favoriteCategoryOrder,
                        switchFriendCode: data.switchFriendCode ?? prev.switchFriendCode,
                        goFriendCode: data.goFriendCode ?? prev.goFriendCode,
                        youtubeUrl: data.youtubeUrl ? extractYoutubeHandle(data.youtubeUrl) : prev.youtubeUrl,
                        twitchUrl: data.twitchUrl ? extractTwitchHandle(data.twitchUrl) : prev.twitchUrl,
                    }));
                    setIsAdmin(Boolean(data.isAdmin));
                    setIsContentCreator(Boolean(data.isContentCreator));
                    setIsPremium(Boolean(data.isPremium));
                    setPremiumMonths(data.premiumMonths || 0);
                    setLikeCount(data.likeCount || 0);
                    setHasLiked(Boolean(data.hasLiked));
                    if (data.dexPreferences) setProfileOwnerPreferences(data.dexPreferences);
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                if (!ignore) setLoading('profile-data', false);
            }
        };

        fetchData();
        return () => { ignore = true; };
    }, [targetUsername, isOwner, userLoading, refreshKey]);

    // Sync likes when user context settles or tab regains focus
    useEffect(() => {
        if (!targetUsername || userLoading) return;
        let ignore = false;

        const syncLikes = async () => {
            if (document.hidden) return;
            try {
                const res = await profileAPI.getProfileLikes(targetUsername);
                if (!ignore && res) {
                    if (typeof res.likeCount === 'number') setLikeCount(res.likeCount);
                    if (typeof res.hasLiked === 'boolean') setHasLiked(res.hasLiked);
                }
            } catch (err) {
                // Silently ignore sync failures
            }
        };

        syncLikes();

        const handleFocus = () => syncLikes();
        window.addEventListener('focus', handleFocus);
        window.addEventListener('visibilitychange', handleFocus);

        return () => {
            ignore = true;
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('visibilitychange', handleFocus);
        };
    }, [targetUsername, currentUsername, userLoading]);

    // Fetch stats
    useEffect(() => {
        if (!targetUsername) return;
        let ignore = false;

        const fetchStats = async () => {
            try {
                let map = {};
                if (isOwner) {
                    try {
                        const serverMap = await caughtAPI.getCaughtData();
                        map = serverMap || {};
                        const raw = localStorage.getItem(`caughtInfoMap:${currentUsername}`);
                        if (raw) {
                            const localCache = JSON.parse(raw);
                            if (localCache && typeof localCache === 'object') {
                                map = { ...map, ...localCache };
                            }
                        }
                    } catch (e) {
                        console.error("Failed to load owner caught data:", e);
                    }
                } else {
                    const response = await profileAPI.getPublicCaughtData(targetUsername);
                    map = response?.caughtPokemon || response || {};
                }

                if (ignore) return;
                const prefs = isOwner ? dexPreferences : profileOwnerPreferences;
                const { stats, recentAdded } = calculateProfileStats(map, prefs);
                setStatsData({ stats, recentAdded });
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };

        fetchStats();
        return () => { ignore = true; };
    }, [targetUsername, isOwner, currentUsername, dexPreferences, profileOwnerPreferences, refreshKey]);

    // Loading / error states
    if (isLoading('profile-data') && !profileData) {
        return (
            <div className="profile-page">
                <SectionLoader text="Loading trainer profile..." />
            </div>
        );
    }

    if (!isOwner && !profileData) {
        return (
            <div className="profile-page">
                <div className="profile-not-found">
                    <UserX size={48} className="text-gray-500 mb-4" />
                    <h2>Trainer Not Found</h2>
                    <p>This profile doesn't exist or has been set to private.</p>
                    <Link to="/" className="btn-primary mt-4">Go Home</Link>
                </div>
            </div>
        );
    }

    if (!isOwner && profileData?.isProfilePublic === false && !isViewerAdmin) {
        return (
            <div className="profile-page">
                <div className="profile-private">
                    <Lock size={48} className="text-gray-500 mb-4" />
                    <h2>Private Profile</h2>
                    <p>This trainer's profile is set to private.</p>
                    <Link to="/" className="btn-primary mt-4">Go Home</Link>
                </div>
            </div>
        );
    }

    const createdAt = isOwner ? currentUserCreatedAt : profileData?.createdAt;

    return (
        <div data-tutorial-id="profile-overview" className="profile-page fade-in-content">
            {(!isOwner && (isViewerAdmin || profileData?.isPrivateAdminView) && (profileData?.isProfilePublic === false || profileData?.isPrivate)) && (
                <div className="admin-private-profile-notice flex items-center justify-between gap-3 px-4 py-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <Lock size={15} className="text-amber-400 shrink-0" />
                        <span><strong>Admin Preview:</strong> This profile is set to <strong>Private</strong>. Standard trainers cannot view this page.</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] uppercase tracking-wider font-extrabold shrink-0">
                        Admin Access
                    </span>
                </div>
            )}

            <ProfileHero
                username={targetUsername}
                createdAt={createdAt}
                isOwner={isOwner}
                isAdmin={isAdmin}
                isContentCreator={isContentCreator}
                isPremium={isPremium}
                premiumMonths={premiumMonths}
                form={form}
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
                currentUsername={currentUsername}
                onOpenEditModal={() => setShowEditModal(true)}
                isOnline={isOwner ? true : Boolean(profileData?.isOnline)}
            />

            <ProfileTopStats
                stats={statsData.stats}
                targetUsername={targetUsername}
                isOwner={isOwner}
                hasBingoData={isOwner ? true : Boolean(profileData?.hasBingoData)}
            />

            <div className="profile-columns-container">
                <div className="profile-left-col">
                    <ProfileInfoBox
                        isOwner={isOwner}
                        isEditing={false}
                        form={form}
                        setForm={setForm}
                        isContentCreator={isContentCreator}
                        isAdmin={isAdmin}
                    />
                    <ProfileFavorites
                        isOwner={isOwner}
                        isEditing={false}
                        form={form}
                        isPremium={isPremium}
                        useHomeSprites={useHomeSprites}
                        POKEMON_OPTIONS={POKEMON_OPTIONS}
                        openGameModal={(i) => { setGameSlotIndex(i); setShowGameModal(true); }}
                        openPokemonModal={(i) => { setPokemonSlotIndex(i); setShowPokemonModal(true); }}
                        openBallModal={() => setShowBallModal(true)}
                        openTrainerModal={() => setShowFavoriteTrainerModal(true)}
                    />
                </div>

                <div className="profile-right-col">
                    <ProfileStatsGrid
                        stats={statsData.stats}
                        recentAdded={statsData.recentAdded}
                        useHomeSprites={useHomeSprites}
                        targetUsername={targetUsername}
                        isStatsPublic={profileData?.isStatsPublic}
                        isOwner={isOwner}
                    />
                </div>
            </div>

            {/* Edit Profile Modal — replaces inline editing entirely */}
            {isOwner && (
                <EditProfileModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    username={targetUsername || currentUsername}
                    form={form}
                    setForm={setForm}
                    setUser={setUser}
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                    isContentCreator={isContentCreator}
                    creatorStatus={creatorStatus}
                    onRequestCreator={() => setShowCreatorModal(true)}
                    POKEMON_OPTIONS={POKEMON_OPTIONS}
                    onSaved={() => setRefreshKey(k => k + 1)}
                />
            )}

            <ProfileModals
                isOwner={isOwner}
                isEditing={false}
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
                showBallModal={showBallModal}
                setShowBallModal={setShowBallModal}
                showFavoriteTrainerModal={showFavoriteTrainerModal}
                setShowFavoriteTrainerModal={setShowFavoriteTrainerModal}
                POKEMON_OPTIONS={POKEMON_OPTIONS}
                pendingNavigation={null}
                setPendingNavigation={() => {}}
                setIsEditing={() => {}}
            />
        </div>
    );
}
