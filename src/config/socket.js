import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

/**
 * Initialize Socket.io server
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware — optional (guests allowed for read-only rooms)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        // Allow unauthenticated connections (e.g., article read-only rooms)
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      socket.user = user || null;
      next();
    } catch (error) {
      // Invalid token — allow as guest
      socket.user = null;
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userName = socket.user?.name || 'Guest';
    const userId = socket.user?._id;
    console.log(`Socket connected: ${userName} (${userId || 'unauthenticated'})`);

    // Join user's personal room for notifications (authenticated only)
    if (userId) {
      socket.join(`user:${userId}`);

      // Join admin rooms if user is admin or masterAdmin
      if (socket.user.role === 'admin' || socket.user.role === 'masterAdmin') {
        socket.join('admin:dashboard');
        socket.join('admin:moderation');
        console.log(`✅ Admin ${userName} joined admin rooms`);
      }
    }

    // ─── Article rooms (available to all, including guests) ───────────────

    socket.on('article:join', (articleId) => {
      if (articleId) {
        socket.join(`article:${articleId}`);
      }
    });

    socket.on('article:leave', (articleId) => {
      if (articleId) {
        socket.leave(`article:${articleId}`);
      }
    });

    // ─── Forum rooms ──────────────────────────────────────────────────────

    // Join forum room
    socket.on('forum:join', (forumId) => {
      socket.join(`forum:${forumId}`);
    });

    // Leave forum room
    socket.on('forum:leave', (forumId) => {
      socket.leave(`forum:${forumId}`);
    });

    // Join thread room
    socket.on('thread:join', (threadId) => {
      socket.join(`thread:${threadId}`);
    });

    // Leave thread room
    socket.on('thread:leave', (threadId) => {
      socket.leave(`thread:${threadId}`);
    });

    // Typing indicator for threads
    socket.on('thread:typing', ({ threadId, isTyping }) => {
      if (!socket.user) return;
      socket.to(`thread:${threadId}`).emit('thread:user_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        isTyping
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userName}`);
    });

    // Error handler
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.io initialized');
  return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit event to article room
 */
export const emitToArticle = (articleId, event, data) => {
  if (io) {
    io.to(`article:${articleId}`).emit(event, data);
  }
};

/**
 * Emit event to specific user
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit event to forum room
 */
export const emitToForum = (forumId, event, data) => {
  if (io) {
    io.to(`forum:${forumId}`).emit(event, data);
  }
};

/**
 * Emit event to thread room
 */
export const emitToThread = (threadId, event, data) => {
  if (io) {
    io.to(`thread:${threadId}`).emit(event, data);
  }
};

/**
 * Broadcast to all connected clients
 */
export const broadcastToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Real-time event handlers for forum activities
 */

// New thread created
export const notifyNewThread = (forumId, threadData) => {
  emitToForum(forumId, 'thread:new', threadData);
};

// New answer posted
export const notifyNewAnswer = (threadId, forumId, answerData) => {
  emitToThread(threadId, 'answer:new', answerData);
  emitToForum(forumId, 'answer:new', answerData);
};

// New comment added
export const notifyNewComment = (threadId, answerId, commentData) => {
  emitToThread(threadId, 'comment:new', { answerId, comment: commentData });
};

// Reaction added (upvote/downvote)
export const notifyReaction = (targetType, targetId, reactionData) => {
  if (targetType === 'thread') {
    emitToThread(targetId, 'reaction:updated', reactionData);
  } else if (targetType === 'answer') {
    // Emit to thread room where answer belongs
    emitToThread(reactionData.threadId, 'reaction:updated', reactionData);
  }
};

// Answer accepted
export const notifyAnswerAccepted = (threadId, answerId, answerAuthorId) => {
  emitToThread(threadId, 'answer:accepted', { answerId });
  emitToUser(answerAuthorId, 'notification', {
    type: 'answer_accepted',
    message: 'Your answer was accepted!',
    threadId
  });
};

// Moderation action
export const notifyModerationAction = (targetUserId, actionData) => {
  emitToUser(targetUserId, 'moderation:action', actionData);
};

// Trending update
export const notifyTrendingUpdate = (forumId, trendingData) => {
  emitToForum(forumId, 'trending:updated', trendingData);
};

// Forum status change (approved/rejected)
export const notifyForumStatusChange = (creatorId, forumData) => {
  emitToUser(creatorId, 'forum:status_changed', forumData);
};

// Poll created
export const notifyPollCreated = (forumId, pollData) => {
  emitToForum(forumId, 'poll:created', pollData);
};

// Poll vote
export const notifyPollVote = (forumId, pollId, voteData) => {
  emitToForum(forumId, 'poll:voted', { pollId, voteData });
};

// Thread followed
export const notifyThreadFollowed = (threadId, followerData) => {
  emitToThread(threadId, 'thread:followed', followerData);
};

/**
 * Admin Dashboard Events
 */

// Forum created - notify admin dashboard
export const notifyForumCreated = (forumData) => {
  if (io) {
    io.to('admin:dashboard').emit('forum:created', forumData);
  }
};

// Forum pending approval
export const notifyForumPending = (forumData) => {
  if (io) {
    io.to('admin:dashboard').emit('forum:pending', forumData);
  }
};

// Forum approved - notify creator and admins
export const notifyForumApproved = (creatorId, forumData) => {
  emitToUser(creatorId, 'forum:approved', forumData);
  if (io) {
    io.to('admin:dashboard').emit('forum:approved', forumData);
  }
};

// Forum rejected - notify creator and admins
export const notifyForumRejected = (creatorId, forumData) => {
  emitToUser(creatorId, 'forum:rejected', forumData);
  if (io) {
    io.to('admin:dashboard').emit('forum:rejected', forumData);
  }
};

// Report created - notify moderation team
export const notifyReportCreated = (reportData) => {
  if (io) {
    io.to('admin:moderation').emit('report:created', reportData);
    io.to('admin:dashboard').emit('report:created', reportData);
  }
};

// Report resolved - notify reporter and admins
export const notifyReportResolved = (reporterId, reportData) => {
  emitToUser(reporterId, 'report:resolved', reportData);
  if (io) {
    io.to('admin:moderation').emit('report:resolved', reportData);
  }
};

// Moderation action broadcast
export const notifyModerationEvent = (targetUserId, actionData) => {
  emitToUser(targetUserId, 'moderation:action', actionData);
  if (io) {
    io.to('admin:moderation').emit('moderation:event', actionData);
  }
};

// Analytics update - admin dashboard only
export const notifyAnalyticsUpdate = (analyticsData) => {
  if (io) {
    io.to('admin:dashboard').emit('analytics:update', analyticsData);
  }
};

// Anonymous identity revealed (Master Admin only)
export const notifyIdentityRevealed = (revealData) => {
  if (io) {
    io.to('admin:moderation').emit('moderation:identity_revealed', revealData);
  }
};

// Emit to all admins
export const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin:dashboard').emit(event, data);
  }
};

// Emit to moderation team
export const emitToModeration = (event, data) => {
  if (io) {
    io.to('admin:moderation').emit(event, data);
  }
};

export default { initializeSocket, getIO };
