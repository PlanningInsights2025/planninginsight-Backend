import Forum from '../../models/Forum.js';
import ForumThread from '../../models/ForumThread.js';
import User from '../../models/User.js';
import { notifyForumCreated, notifyForumPending } from '../../config/socket.js';
import { createNotification } from './notificationController.js';

/**
 * Create a new forum (user-initiated, pending approval)
 */
export const createForum = async (req, res) => {
  try {
    const { title, description, category, motivation, intent } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    // Check if forum with same title already exists
    const existingForum = await Forum.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
    if (existingForum) {
      return res.status(400).json({
        success: false,
        message: 'A forum with this title already exists'
      });
    }

    // Create forum with pending status
    const forum = new Forum({
      title,
      description,
      category,
      creator: userId,
      motivation,
      intent,
      status: 'pending',
      createdAt: new Date()
    });

    await forum.save();

    // Populate creator details for the response
    await forum.populate('creator', 'firstName lastName email profile');

    // Emit real-time event to admin dashboard
    notifyForumCreated({
      forumId: forum._id,
      title: forum.title,
      description: forum.description,
      category: forum.category,
      creator: {
        id: forum.creator._id,
        name: `${forum.creator.firstName} ${forum.creator.lastName}`,
        email: forum.creator.email
      },
      status: 'pending',
      motivation: forum.motivation,
      intent: forum.intent,
      createdAt: forum.createdAt
    });

    // Also emit to pending queue
    notifyForumPending({
      forumId: forum._id,
      title: forum.title,
      description: forum.description,
      category: forum.category,
      creator: {
        id: forum.creator._id,
        name: `${forum.creator.firstName} ${forum.creator.lastName}`
      },
      status: 'pending',
      createdAt: forum.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Forum submitted for approval',
      data: { forum }
    });
  } catch (error) {
    console.error('Create forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create forum',
      error: error.message
    });
  }
};

/**
 * Get all forums (with filters)
 */
export const getForums = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    // Filter by status (default: show only approved)
    if (status) {
      query.status = status;
    } else {
      query.status = 'approved';
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [forums, total] = await Promise.all([
      Forum.find(query)
        .populate('creator', 'firstName lastName profile')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Forum.countDocuments(query)
    ]);

    // Add thread count and follower count to each forum
    for (let forum of forums) {
      const threadCount = await ForumThread.countDocuments({ forum: forum._id, status: 'active' });
      forum.threadCount = threadCount;
      forum.followerCount = forum.followers ? forum.followers.length : 0;
    }

    res.json({
      success: true,
      data: {
        forums,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get forums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forums',
      error: error.message
    });
  }
};

/**
 * Get aggregated forum status counts (overall + per-user when available)
 */
export const getForumStatusCounts = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    // Overall status counts
    const [total, approved, pending, rejected] = await Promise.all([
      Forum.countDocuments({}),
      Forum.countDocuments({ status: 'approved' }),
      Forum.countDocuments({ status: 'pending' }),
      Forum.countDocuments({ status: 'rejected' })
    ]);

    const result = {
      overall: {
        total,
        approved,
        pending,
        rejected
      },
      user: {
        approved: 0,
        pending: 0,
        rejected: 0,
        followed: 0
      }
    };

    // Per-user counts when authenticated
    if (userId) {
      const [myApproved, myPending, myRejected, myFollowed] = await Promise.all([
        Forum.countDocuments({ creator: userId, status: 'approved' }),
        Forum.countDocuments({ creator: userId, status: 'pending' }),
        Forum.countDocuments({ creator: userId, status: 'rejected' }),
        Forum.countDocuments({ followers: userId })
      ]);

      result.user = {
        approved: myApproved,
        pending: myPending,
        rejected: myRejected,
        followed: myFollowed
      };
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get forum status counts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch forum status counts',
      error: error.message
    });
  }
};

/**
 * Get single forum by ID or slug
 */
export const getForum = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let forum = await Forum.findById(id)
      .populate('creator', 'firstName lastName profile')
      .lean();

    if (!forum) {
      forum = await Forum.findOne({ slug: id })
        .populate('creator', 'firstName lastName profile')
        .lean();
    }

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Get thread count
    const threadCount = await ForumThread.countDocuments({ forum: forum._id, status: 'active' });
    forum.threadCount = threadCount;
    forum.followerCount = forum.followers ? forum.followers.length : 0;

    // Check if current user is following this forum
    if (req.user) {
      const userId = req.user.userId || req.user.id;
      forum.isFollowing = forum.followers && forum.followers.some(f => f.toString() === userId.toString());
    }

    res.json({
      success: true,
      data: { forum }
    });
  } catch (error) {
    console.error('Get forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum',
      error: error.message
    });
  }
};

/**
 * Follow/Unfollow a forum
 */
export const toggleFollowForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const userId = req.user.userId || req.user.id;

    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    // Check if user is already following
    const isFollowing = forum.followers && forum.followers.includes(userId);

    if (isFollowing) {
      // Unfollow
      forum.followers = forum.followers.filter(f => f.toString() !== userId.toString());
      forum.followerCount = (forum.followerCount || 0) - 1;
    } else {
      // Follow
      if (!forum.followers) {
        forum.followers = [];
      }
      forum.followers.push(userId);
      forum.followerCount = (forum.followerCount || 0) + 1;

      // Create notification for forum creator
      await createNotification({
        recipient: forum.creator,
        sender: userId,
        type: 'forum_followed',
        title: 'New Forum Follower',
        message: `Someone started following your forum "${forum.title}"`,
        forum: forumId,
        deliveryMethod: 'web',
        priority: 'low'
      });
    }

    await forum.save();

    res.json({
      success: true,
      data: {
        isFollowing: !isFollowing,
        followerCount: forum.followerCount
      },
      message: isFollowing ? 'Forum unfollowed' : 'Forum followed successfully'
    });
  } catch (error) {
    console.error('Toggle follow forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle forum follow',
      error: error.message
    });
  }
};

/**
 * Get trending forums
 */
export const getTrendingForums = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const forums = await Forum.find({ status: 'approved' })
      .populate('creator', 'firstName lastName profile')
      .sort({ followerCount: -1, threadCount: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add thread counts
    for (let forum of forums) {
      const threadCount = await ForumThread.countDocuments({ forum: forum._id, status: 'active' });
      forum.threadCount = threadCount;
      forum.followerCount = forum.followers ? forum.followers.length : 0;
    }

    res.json({
      success: true,
      data: { forums }
    });
  } catch (error) {
    console.error('Get trending forums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending forums',
      error: error.message
    });
  }
};

/**
 * Check if forum title is unique
 */
export const checkTitleUniqueness = async (req, res) => {
  try {
    const { title } = req.params;

    const existingForum = await Forum.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') } 
    });

    res.json({
      success: true,
      data: {
        isUnique: !existingForum,
        exists: !!existingForum
      }
    });
  } catch (error) {
    console.error('Check title uniqueness error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check title uniqueness',
      error: error.message
    });
  }
};

/**
 * Get user's forums (created by user)
 */
export const getUserForums = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { status } = req.query;

    const query = { creator: userId };
    if (status) {
      query.status = status;
    }

    const forums = await Forum.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Add thread counts
    for (let forum of forums) {
      const threadCount = await ForumThread.countDocuments({ forum: forum._id });
      forum.threadCount = threadCount;
      forum.followerCount = forum.followers ? forum.followers.length : 0;
    }

    res.json({
      success: true,
      data: { forums }
    });
  } catch (error) {
    console.error('Get user forums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user forums',
      error: error.message
    });
  }
};
