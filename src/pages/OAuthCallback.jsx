import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessage } from "../components/Shared/MessageContext";
import { authAPI, progressAPI, profileAPI } from "../utils/api";
import { LoadingSpinner } from "../components/Shared";

export default function OAuthCallback({ onLogin }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const success = searchParams.get("success");
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      window.dispatchEvent(new CustomEvent("resetOAuthLoading"));
      showMessage(decodeURIComponent(error), "error");
      navigate("/login", { replace: true });
      return;
    }

    if (success && token) {
      localStorage.setItem("authToken", token);

      (async () => {
        try {
          // Fetch authenticated user profile
          const currentUser = await authAPI.getCurrentUser();

          if (!currentUser || !currentUser.username) {
            throw new Error("Failed to retrieve user profile after login.");
          }

          let progressBars = currentUser.progressBars || [];
          if (!progressBars.length) {
            try {
              const progressResponse = await progressAPI.getProgressBars();
              progressBars = progressResponse || [];
            } catch (pErr) {
              try {
                const profRes = await profileAPI.getProfile();
                progressBars = profRes?.progressBars || [];
              } catch (_) {
                progressBars = [];
              }
            }
          }

          if (typeof onLogin === "function") {
            onLogin({
              ...currentUser,
              username: currentUser.username,
              email: currentUser.email,
              hasPassword: currentUser.hasPassword,
              needsProfileSetup: currentUser.needsProfileSetup,
              createdAt: currentUser.createdAt,
              profileTrainer: currentUser.profileTrainer,
              nameColor1: currentUser.nameColor1 || currentUser.nameGradientColor1 || null,
              nameColor2: currentUser.nameColor2 || currentUser.nameGradientColor2 || null,
              avatar: currentUser.avatar || null,
              verified: currentUser.verified,
              isAdmin: currentUser.isAdmin || false,
              isContentCreator: currentUser.isContentCreator || false,
              isPremium: Boolean(currentUser.isPremium),
              premiumMonths: currentUser.premiumMonths || 0,
              premiumSince: currentUser.premiumSince || null,
              youtubeUrl: currentUser.youtubeUrl || null,
              twitchUrl: currentUser.twitchUrl || null,
              onboarding: currentUser.onboarding,
              progressBars,
            });
          }

          if (currentUser.needsProfileSetup) {
            navigate("/complete-signup", { replace: true });
          } else {
            showMessage("Logged in successfully!", "success");
            navigate("/", { replace: true });
          }
        } catch (err) {
          window.dispatchEvent(new CustomEvent("resetOAuthLoading"));
          console.error("OAuth callback error:", err);
          showMessage(err.message || "Failed to finalize login", "error");
          navigate("/login", { replace: true });
        }
      })();
    } else {
      window.dispatchEvent(new CustomEvent("resetOAuthLoading"));
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, showMessage, onLogin]);

  return <LoadingSpinner fullScreen />;
}
