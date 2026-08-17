  const handleToggleCaught = useCallback(async (poke, isShiny = false) => {
    const key = getCaughtKey(poke, null, isShiny);

    if (caught[key]) {
      const info = caughtInfoMap[key];
      if (hasMeaningfulInfo(info)) {
        // Show reset modal instead of old confirm dialog
        setResetModal({
          show: true,
          pokemon: poke,
          pokemonName: formatPokemonName(poke?.name),
          isShiny: isShiny
        });
        setResetModalClosing(false);
        return;
      }
    }

    // Determine what will happen before touching state so we can pass data in the event.
    const wasAlreadyCaught = !!caught[key];
    let freshInfo = null;

    if (!wasAlreadyCaught) {
      const newEntry = {
        nickname: "",
        date: "",
        ball: BALL_OPTIONS[0].value,
        mark: MARK_OPTIONS[0].value,
        method: METHOD_OPTIONS[0],
        game: GAME_OPTIONS[0].value,
        checks: "",
        notes: "",
        entryId: Math.random().toString(36).substr(2, 9)
      };
      freshInfo = {
        caught: true,
        caughtAt: Date.now(),
        entries: [newEntry]
      };
      setCaughtInfoMap(prevInfoMap => ({
        ...prevInfoMap,
        [key]: freshInfo
      }));
      if (user?.username) {
        const pokeName = formatPokemonName(poke.name);
        const formName = getFormDisplayName(poke) || null;
        const sprite = getSpriteUrl(poke, isShiny, currentDexPreferences?.useHomeSprites);
        const newCatchTrigger = { pokemonName: pokeName, formName: formName, sprite: sprite, username: user.username, profileTrainer: user.profileTrainer };
        updateCaughtData(user.username, key, freshInfo, newCatchTrigger);
      }
    } else {
      setCaughtInfoMap(prevInfoMap => {
        const updated = { ...prevInfoMap };
        delete updated[key];
        return updated;
      });
      if (user?.username) {
        updateCaughtData(user.username, key, null);
      }
    }

    setCaught(prev => ({ ...prev, [key]: !wasAlreadyCaught }));

    // keep sidebar in sync - switch to newly caught pokemon
    if (sidebarOpen && selectedPokemon) {
      // Check if it's a different Pok├⌐mon (different ID) or different form (same ID but different name/formType)
      const isDifferentPokemon = selectedPokemon.id !== poke.id;
      const isDifferentForm = selectedPokemon.id === poke.id && selectedPokemon.name !== poke.name;

      if (isDifferentPokemon || isDifferentForm) {
        console.log("Sidebar is open, switching to newly toggled pokemon:", poke.name, "form:", poke.formType);
        setSelectedPokemon(poke);
      }
    }

    // Persist the most-recent-catch order to sessionStorage so Profile.jsx can read it on
    // mount even when it was unmounted during the catch (e.g. user was on the dex page).
    try {
      const existing = JSON.parse(sessionStorage.getItem('recentCatchOrder') || '[]');
      let updated;
      if (!wasAlreadyCaught) {
        // Prepend the new catch, remove duplicates, keep top 5
        updated = [
          { stableId: poke.stableId, isShiny },
          ...existing.filter(c => !(c.stableId === poke.stableId && !!c.isShiny === !!isShiny))
        ].slice(0, 5);
      } else {
        // Remove the uncaught Pok├⌐mon from the order
        updated = existing.filter(c => !(c.stableId === poke.stableId && !!c.isShiny === !!isShiny));
      }
      sessionStorage.setItem('recentCatchOrder', JSON.stringify(updated));
    } catch { /* sessionStorage unavailable ΓÇö silently ignore */ }

    // Notify other pages (e.g. Profile's Recent Entries) that caught data changed.
    // Pass freshInfo so Profile can optimistically prepend without a server fetch race.
    // Tag with source:'app' so App.jsx's own listener skips it.
    window.dispatchEvent(new CustomEvent('caughtDataChanged', {
      detail: {
        pokemon: poke,
        caughtKey: key,
        caughtInfo: wasAlreadyCaught ? null : freshInfo,
        wasCaught: wasAlreadyCaught,
        isShiny,
        source: 'app'
      }
    }));
  }, [caught, caughtInfoMap, sidebarOpen, selectedPokemon, showShiny, user?.username]);

  // Handle reset confirmation from grid click or bulk operations
  const handleResetConfirm = () => {
    // Close modal with animation
    setResetModalClosing(true);
    setTimeout(() => {
      setResetModal({
        show: false,
        pokemon: null,
        pokemonName: '',
        isShiny: false,
        isBulkReset: false,
        box: null
      });
      setResetModalClosing(false);
    }, 300);

    if (resetModal.isBulkReset && resetModal.box) {
      // Handle bulk reset (Unmark All)
      const newCaughtMap = { ...caught };
      const newInfoMap = { ...caughtInfoMap };
      const delta = {};

      resetModal.box.forEach(p => {
        const key = getCaughtKey(p, null, resetModal.isShiny);
        newCaughtMap[key] = false;
        newInfoMap[key] = null;
        delta[key] = null;
      });

      setCaught(newCaughtMap);
      setCaughtInfoMap(newInfoMap);

      // Send changes to server
      if (user?.username) {
        try {
          const { caughtAPI } = import('./utils/api.js');
          caughtAPI.patchCaughtData({ changes: delta });
        } catch (e) {
          // Fallback to full save
          updateCaughtData(user.username, null, newInfoMap);
        }
      }

      // Close sidebar if any of these Pok├⌐mon were selected
      if (selectedPokemon && resetModal.box.some(p => getCaughtKey(p, null, resetModal.isShiny) === getCaughtKey(selectedPokemon, null, showShiny))) {
        setSelectedPokemon(null);
        setSidebarOpen(false);
      }
    } else if (resetModal.pokemon) {
      // Handle individual reset (grid click)
      const key = getCaughtKey(resetModal.pokemon, null, resetModal.isShiny);

      // Actually reset the Pok├⌐mon data
      setCaught(prev => ({ ...prev, [key]: false }));
      setCaughtInfoMap(prev => ({ ...prev, [key]: null }));
      if (user?.username) {
        updateCaughtData(user.username, key, null);
      }

      // Close sidebar if this Pok├⌐mon was selected
      if (selectedPokemon && getCaughtKey(selectedPokemon, null, showShiny) === key) {
        setSelectedPokemon(null);
        setSidebarOpen(false);
      }
    }

    // Notify other pages (e.g. Profile's Recent Entries) that caught data changed.
    // Tag with source:'app' so App.jsx's own listener skips it.
    window.dispatchEvent(new CustomEvent('caughtDataChanged', { detail: { source: 'app' } }));
  };
