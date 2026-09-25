import express from "express";
import { Router } from "express";
import User from "../models/User.js";
import { authenticateUser, optionalAuthenticateUser } from "../middleware/authenticateUser.js";

const router = Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get profile likes
router.get('/:username/likes', optionalAuthenticateUser, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId ? String(req.userId) : null;

    // Find the profile owner (case-insensitive)
    const profileOwner = await User.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') }
    }).select('likes');

    if (!profileOwner) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const uniqueLikes = Array.isArray(profileOwner.likes)
      ? Array.from(new Set(profileOwner.likes.filter(Boolean).map(id => id.toString())))
      : [];

    const hasLiked = currentUserId ? uniqueLikes.includes(currentUserId) : false;

    res.json({ 
      hasLiked, 
      likeCount: uniqueLikes.length 
    });
  } catch (error) {
    console.error('Error getting profile likes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public like count for a profile (no authentication required)
router.get('/:username/likes/public', async (req, res) => {
  try {
    const { username } = req.params;

    // Find the profile owner (case-insensitive)
    const profileOwner = await User.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') }
    }).select('likes');

    if (!profileOwner) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const uniqueLikes = Array.isArray(profileOwner.likes)
      ? Array.from(new Set(profileOwner.likes.filter(Boolean).map(id => id.toString())))
      : [];

    res.json({ count: uniqueLikes.length });
  } catch (error) {
    console.error('Error getting public profile likes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle profile like
router.post('/:username/like', authenticateUser, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = String(req.userId);

    // Find the profile owner (case-insensitive)
    const profileOwner = await User.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') }
    });

    if (!profileOwner) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profileOwner.isSuspended) {
      return res.status(400).json({ error: 'Cannot interact with a suspended account' });
    }

    // Clean and normalize existing likes to unique string IDs
    const existingLikes = Array.isArray(profileOwner.likes)
      ? Array.from(new Set(profileOwner.likes.filter(Boolean).map(id => id.toString())))
      : [];

    const alreadyLiked = existingLikes.includes(currentUserId);
    let updatedLikes;

    if (alreadyLiked) {
      // Remove like (unlike)
      updatedLikes = existingLikes.filter(id => id !== currentUserId);
    } else {
      // Add like
      updatedLikes = [...existingLikes, currentUserId];
    }

    profileOwner.likes = updatedLikes;
    await profileOwner.save();

    res.json({ 
      hasLiked: !alreadyLiked, 
      likeCount: updatedLikes.length 
    });
  } catch (error) {
    console.error('Error toggling profile like:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get total caught Pokémon count across all accounts (public)
router.get('/stats/total-caught', async (req, res) => {
  try {
    // Aggregate across all users: sum entries in caughtPokemon where caught === true
    const result = await User.aggregate([
      {
        $project: {
          caughtEntries: { $objectToArray: "$caughtPokemon" }
        }
      },
      { $unwind: "$caughtEntries" },
      {
        $match: { "caughtEntries.v.caught": true }
      },
      {
        $count: "total"
      }
    ]);

    const total = result.length > 0 ? result[0].total : 0;
    res.json({ total });
  } catch (error) {
    console.error('Error getting total caught count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

