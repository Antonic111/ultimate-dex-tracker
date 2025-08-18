import express from "express";
import { Router } from "express";
import User from "../models/User.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

const router = Router();

// Get profile likes
router.get('/:username/likes', authenticateUser, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId;

    // Find the profile owner
    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if current user has liked this profile
    const hasLiked = profileOwner.likes && profileOwner.likes.includes(currentUserId);

    res.json({ 
      hasLiked, 
      likeCount: profileOwner.likes ? profileOwner.likes.length : 0 
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

    // Find the profile owner
    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get like count only
    const likeCount = profileOwner.likes ? profileOwner.likes.length : 0;

    res.json({ count: likeCount });
  } catch (error) {
    console.error('Error getting public profile likes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle profile like
router.post('/:username/like', authenticateUser, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId;

    // Find the profile owner
    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Prevent self-liking
    if (profileOwner._id.equals(currentUserId)) {
      return res.status(400).json({ error: 'Cannot like your own profile' });
    }

    // Toggle like
    const hasLiked = profileOwner.likes && profileOwner.likes.includes(currentUserId);
    
    if (hasLiked) {
      // Remove like
      profileOwner.likes = profileOwner.likes.filter(id => !id.equals(currentUserId));
    } else {
      // Add like
      if (!profileOwner.likes) profileOwner.likes = [];
      profileOwner.likes.push(currentUserId);
    }

    await profileOwner.save();

    res.json({ 
      hasLiked: !hasLiked, 
      likeCount: profileOwner.likes ? profileOwner.likes.length : 0 
    });
  } catch (error) {
    console.error('Error toggling profile like:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
