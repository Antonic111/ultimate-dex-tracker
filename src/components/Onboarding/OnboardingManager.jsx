import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../Shared/UserContext";
import { profileAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import OnboardingModal from "./OnboardingModal";
import TutorialPromptModal from "./TutorialPromptModal";
import InteractiveTutorial from "./InteractiveTutorial";
import TutorialCompleteModal from "./TutorialCompleteModal";
export default function OnboardingManager({ onTutorialActiveChange }) {
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const [phase, setPhase] = useState(null); // 'settings', 'prompt', 'tutorial', 'complete'

  useEffect(() => {
    if (onTutorialActiveChange) {
      onTutorialActiveChange(phase === "tutorial");
    }
  }, [phase, onTutorialActiveChange]);

  useEffect(() => {
    if (user?.username && user.onboarding) {
      if (user.onboarding.isComplete === false) {
        const step = user.onboarding.tutorialStep || 0;
        if (step === 0) setPhase("settings");
        else if (step === 1) setPhase("prompt");
        else if (step === 999) setPhase("complete");
        else setPhase("tutorial");
      } else {
        setPhase(null);
      }
    } else {
      setPhase(null);
    }
  }, [user?.username, user?.onboarding?.isComplete, user?.onboarding?.tutorialStep]);

  const updateOnboarding = async (newState) => {
    // Optimistic UI update
    if (user.setUser) {
      user.setUser(prev => ({
        ...prev,
        onboarding: { ...prev.onboarding, ...newState }
      }));
    }

    // Backend update
    try {
      await profileAPI.updateProfile({ onboarding: newState });
    } catch (err) {
      console.error("Failed to update onboarding state", err);
    }
  };

  if (!phase) return null;

  return (
    <>
      {phase === "settings" && (
        <OnboardingModal 
          onComplete={() => updateOnboarding({ isComplete: false, tutorialStep: 1 })} 
        />
      )}

      {phase === "prompt" && (
        <TutorialPromptModal 
          onSkip={() => updateOnboarding({ isComplete: true, tutorialStep: 0 })}
          onAccept={() => updateOnboarding({ isComplete: false, tutorialStep: 2 })}
        />
      )}

      {phase === "tutorial" && (
        <InteractiveTutorial 
          initialStep={user.onboarding.tutorialStep - 1} // since step 2 maps to index 1 (Step 1 of tutorial)
          onComplete={() => {
            setTimeout(() => {
              updateOnboarding({ isComplete: false, tutorialStep: 999 });
            }, 0);
          }}
        />
      )}

      {phase === "complete" && (
        <TutorialCompleteModal 
          onComplete={() => {
            setTimeout(() => {
              updateOnboarding({ isComplete: true, tutorialStep: 0 });
            }, 0);
          }}
          onReplay={() => {
            navigate("/");
            setTimeout(() => {
              updateOnboarding({ isComplete: false, tutorialStep: 2 });
            }, 0);
          }}
        />
      )}
    </>
  );
}
