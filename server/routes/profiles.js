import express from "express";
import { Router } from "express";
import User from "../models/User.js";
import { authenticateUser } from "../middleware/authenticateUser.js";

const router = Router();

// Get like count and whether current user has liked a profile
router.get('/:username/likes', authenticateUser, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.userId;

        // Find the profile owner
        const profileOwner = await User.findOne({ username });
        if (!profileOwner) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Get like count
        const likeCount = profileOwner.likes ? profileOwner.likes.length : 0;
        
        // Check if current user has liked this profile
        const hasLiked = profileOwner.likes ? profileOwner.likes.includes(currentUserId) : false;

        res.json({ count: likeCount, hasLiked });
    } catch (error) {
        console.error('Error getting profile likes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle like on a profile
router.post('/:username/like', authenticateUser, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.userId;



        // Find the profile owner
        const profileOwner = await User.findOne({ username });
        if (!profileOwner) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Initialize likes array if it doesn't exist
        if (!profileOwner.likes) {
            profileOwner.likes = [];
        }

        let liked = false;
        
        // Check if user already liked this profile
        const likeIndex = profileOwner.likes.indexOf(currentUserId);
        
        if (likeIndex === -1) {
            // Add like
            profileOwner.likes.push(currentUserId);
            liked = true;
        } else {
            // Remove like
            profileOwner.likes.splice(likeIndex, 1);
            liked = false;
        }

        await profileOwner.save();

        res.json({ 
            liked, 
            newCount: profileOwner.likes.length 
        });
    } catch (error) {
        console.error('Error toggling profile like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
