import ForumThread from '../../models/ForumThread.js';
import ForumAnswer from '../../models/ForumAnswer.js';
import Forum from '../../models/Forum.js';
import User from '../../models/User.js';
import { 
  notifyNewThread, 
  notifyNewAnswer, 
  notifyNewComment,
  notifyReaction,
  notifyAnswerAccepted,
  notifyThreadFollowed 
} from '../../config/socket.js';
import { createNotification } from './notificationController.js';

/**
 * Create a new thread
 */
export const createThread = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { title, content, isQuestion, isAnonymous, tags } = req.body;

    // Verify forum exists and is approved
    const forum = await Forum.findById(forumId);
    if (!forum) {
      return res.status(404).json({ message: 'Forum not found' });
    }
    if (forum.status !== 'approved') {
      return res.status(403).json({ message: 'Forum is not approved yet' });
    }

    // Create thread
    const thread = new ForumThread({
      forum: forumId,
      title,
      content,
      author: req.user._id,
      isQuestion: isQuestion || false,
      isAnonymous: isAnonymous || false,
      tags: tags || [],
      followers: [req.user._id] // Auto-follow own thread
    });

    await thread.save();

    // Update forum stats
    forum.questionCount += 1;
    forum.metadata.lastActivityAt = new Date();
    await forum.save();

    // Populate author for response
    await thread.populate('author', 'name email avatar');

    // Real-time notification to forum followers
    notifyNewThread(forumId, {
      threadId: thread._id,
      title: thread.title,
      author: thread.isAnonymous ? null : {
        _id: thread.author._id,
        name: thread.author.name
      },
      createdAt: thread.createdAt
    });

    // Notify forum followers
    const forumFollowers = forum.followers.filter(
      f => f.toString() !== req.user._id.toString()
    );
    
    for (const followerId of forumFollowers) {
      await createNotification({
        recipient: followerId,
        sender: req.user._id,
        type: 'new_thread',
        title: 'New Discussion',
        message: `New ${isQuestion ? 'question' : 'thread'} in ${forum.title}`,
        forum: forumId,
        thread: thread._id,
        actionUrl: `/forum/${forumId}/thread/${thread._id}`
      });
    }

    res.status(201).json({
      message: 'Thread created successfully',
      thread
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ message: 'Failed to create thread', error: error.message });
  }
};

/**
 * Get threads for a forum
 */
export const getThreads = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { 
      sort = 'latest', 
      filter = 'all',
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const query = { forum: forumId, status: 'active' };

    // Apply filters
    if (filter === 'questions') query.isQuestion = true;
    if (filter === 'unanswered') {
      query.isQuestion = true;
      query.hasAcceptedAnswer = false;
      query.answerCount = 0;
    }
    if (filter === 'following' && req.user) {
      query.followers = req.user._id;
    }

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'trending':
        sortOption = { trendingScore: -1 };
        break;
      case 'popular':
        sortOption = { voteScore: -1, viewCount: -1 };
        break;
      case 'unanswered':
        sortOption = { answerCount: 1, createdAt: -1 };
        break;
      default:
        sortOption = { isPinned: -1, lastActivityAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [threads, total] = await Promise.all([
      ForumThread.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'name email avatar reputation')
        .populate('acceptedAnswer')
        .lean(),
      ForumThread.countDocuments(query)
    ]);

    // Add user-specific data
    const enrichedThreads = threads.map(thread => ({
      ...thread,
      hasUpvoted: thread.upvotes?.some(v => v.user.toString() === req.user?._id.toString()),
      hasDownvoted: thread.downvotes?.some(v => v.user.toString() === req.user?._id.toString()),
      isFollowing: thread.followers?.includes(req.user?._id.toString()),
      isAuthor: thread.author._id.toString() === req.user?._id.toString()
    }));

    res.json({
      threads: enrichedThreads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ message: 'Failed to fetch threads', error: error.message });
  }
};

/**
 * Get single thread details
 */
export const getThread = async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await ForumThread.findById(threadId)
      .populate('author', 'name email avatar reputation')
      .populate('forum', 'title slug')
      .populate('acceptedAnswer');

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Increment view count
    thread.viewCount += 1;
    await thread.save();

    // Get answers
    const answers = await ForumAnswer.find({ thread: threadId, status: 'active' })
      .sort({ isAccepted: -1, voteScore: -1, createdAt: 1 })
      .populate('author', 'name email avatar reputation')
      .populate('comments.author', 'name avatar');

    // User-specific data
    const enrichedThread = {
      ...thread.toObject(),
      hasUpvoted: thread.upvotes?.some(v => v.user.toString() === req.user?._id.toString()),
      hasDownvoted: thread.downvotes?.some(v => v.user.toString() === req.user?._id.toString()),
      isFollowing: thread.followers?.includes(req.user?._id.toString()),
      isAuthor: thread.author._id.toString() === req.user?._id.toString()
    };

    res.json({
      thread: enrichedThread,
      answers
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ message: 'Failed to fetch thread', error: error.message });
  }
};

/**
 * Post an answer to a thread
 */
export const createAnswer = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, isAnonymous } = req.body;

    const thread = await ForumThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    if (thread.isLocked) {
      return res.status(403).json({ message: 'Thread is locked' });
    }

    const answer = new ForumAnswer({
      thread: threadId,
      forum: thread.forum,
      content,
      author: req.user._id,
      isAnonymous: isAnonymous || false
    });

    await answer.save();

    // Update thread stats
    thread.answerCount += 1;
    thread.lastActivityAt = new Date();
    await thread.save();

    // Update forum stats
    await Forum.findByIdAndUpdate(thread.forum, {
      $inc: { answerCount: 1 },
      'metadata.lastActivityAt': new Date()
    });

    await answer.populate('author', 'name email avatar reputation');

    // Real-time notification
    notifyNewAnswer(threadId, thread.forum, {
      answerId: answer._id,
      threadId,
      content: answer.content.substring(0, 200),
      author: answer.isAnonymous ? null : {
        _id: answer.author._id,
        name: answer.author.name
      },
      createdAt: answer.createdAt
    });

    // Notify thread followers
    const followers = thread.followers.filter(
      f => f.toString() !== req.user._id.toString()
    );
    
    for (const followerId of followers) {
      await createNotification({
        recipient: followerId,
        sender: req.user._id,
        type: 'new_answer',
        title: 'New Answer',
        message: `New answer on "${thread.title}"`,
        forum: thread.forum,
        thread: threadId,
        answer: answer._id,
        actionUrl: `/forum/${thread.forum}/thread/${threadId}#answer-${answer._id}`
      });
    }

    res.status(201).json({
      message: 'Answer posted successfully',
      answer
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ message: 'Failed to post answer', error: error.message });
  }
};

/**
 * Vote on thread (upvote/downvote)
 */
export const voteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'

    const thread = await ForumThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const userId = req.user._id;
    const hasUpvoted = thread.upvotes.some(v => v.user.toString() === userId.toString());
    const hasDownvoted = thread.downvotes.some(v => v.user.toString() === userId.toString());

    // Remove existing votes
    thread.upvotes = thread.upvotes.filter(v => v.user.toString() !== userId.toString());
    thread.downvotes = thread.downvotes.filter(v => v.user.toString() !== userId.toString());

    // Add new vote if different from existing
    if (voteType === 'upvote' && !hasUpvoted) {
      thread.upvotes.push({ user: userId, createdAt: new Date() });
    } else if (voteType === 'downvote' && !hasDownvoted) {
      thread.downvotes.push({ user: userId, createdAt: new Date() });
    }

    // Update vote score
    thread.voteScore = thread.upvotes.length - thread.downvotes.length;
    await thread.save();

    // Real-time notification
    notifyReaction('thread', threadId, {
      threadId,
      voteScore: thread.voteScore,
      upvotes: thread.upvotes.length,
      downvotes: thread.downvotes.length
    });

    // Notify thread author if upvoted
    if (voteType === 'upvote' && thread.author.toString() !== userId.toString()) {
      await createNotification({
        recipient: thread.author,
        sender: userId,
        type: 'thread_upvote',
        title: 'Thread Upvoted',
        message: `Someone upvoted your thread "${thread.title}"`,
        thread: threadId,
        actionUrl: `/forum/${thread.forum}/thread/${threadId}`
      });
    }

    res.json({
      message: 'Vote recorded',
      voteScore: thread.voteScore,
      hasUpvoted: thread.upvotes.some(v => v.user.toString() === userId.toString()),
      hasDownvoted: thread.downvotes.some(v => v.user.toString() === userId.toString())
    });
  } catch (error) {
    console.error('Vote thread error:', error);
    res.status(500).json({ message: 'Failed to vote', error: error.message });
  }
};

/**
 * Vote on answer
 */
export const voteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body;

    const answer = await ForumAnswer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id;
    const hasUpvoted = answer.upvotes.some(v => v.user.toString() === userId.toString());
    const hasDownvoted = answer.downvotes.some(v => v.user.toString() === userId.toString());

    // Remove existing votes
    answer.upvotes = answer.upvotes.filter(v => v.user.toString() !== userId.toString());
    answer.downvotes = answer.downvotes.filter(v => v.user.toString() !== userId.toString());

    // Add new vote
    if (voteType === 'upvote' && !hasUpvoted) {
      answer.upvotes.push({ user: userId, createdAt: new Date() });
    } else if (voteType === 'downvote' && !hasDownvoted) {
      answer.downvotes.push({ user: userId, createdAt: new Date() });
    }

    answer.voteScore = answer.upvotes.length - answer.downvotes.length;
    await answer.save();

    // Real-time notification
    notifyReaction('answer', answerId, {
      answerId,
      threadId: answer.thread,
      voteScore: answer.voteScore,
      upvotes: answer.upvotes.length,
      downvotes: answer.downvotes.length
    });

    res.json({
      message: 'Vote recorded',
      voteScore: answer.voteScore,
      hasUpvoted: answer.upvotes.some(v => v.user.toString() === userId.toString()),
      hasDownvoted: answer.downvotes.some(v => v.user.toString() === userId.toString())
    });
  } catch (error) {
    console.error('Vote answer error:', error);
    res.status(500).json({ message: 'Failed to vote', error: error.message });
  }
};

/**
 * Accept an answer (thread author only)
 */
export const acceptAnswer = async (req, res) => {
  try {
    const { threadId, answerId } = req.params;

    const thread = await ForumThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    // Only thread author can accept answers
    if (thread.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only thread author can accept answers' });
    }

    if (!thread.isQuestion) {
      return res.status(400).json({ message: 'Can only accept answers for questions' });
    }

    const answer = await ForumAnswer.findById(answerId);
    if (!answer || answer.thread.toString() !== threadId) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Unaccept previous answer if exists
    if (thread.acceptedAnswer) {
      await ForumAnswer.findByIdAndUpdate(thread.acceptedAnswer, {
        isAccepted: false,
        acceptedAt: null
      });
    }

    // Accept new answer
    answer.isAccepted = true;
    answer.acceptedAt = new Date();
    await answer.save();

    thread.hasAcceptedAnswer = true;
    thread.acceptedAnswer = answerId;
    await thread.save();

    // Real-time notification
    notifyAnswerAccepted(threadId, answerId, answer.author);

    // Notify answer author
    if (answer.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: answer.author,
        sender: req.user._id,
        type: 'answer_accepted',
        title: 'Answer Accepted',
        message: `Your answer was accepted on "${thread.title}"`,
        thread: threadId,
        answer: answerId,
        actionUrl: `/forum/${thread.forum}/thread/${threadId}#answer-${answerId}`
      });
    }

    res.json({ message: 'Answer accepted successfully' });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ message: 'Failed to accept answer', error: error.message });
  }
};

/**
 * Add comment to answer
 */
export const addComment = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { content, isAnonymous } = req.body;

    const answer = await ForumAnswer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const comment = {
      author: req.user._id,
      content,
      isAnonymous: isAnonymous || false,
      createdAt: new Date()
    };

    answer.comments.push(comment);
    await answer.save();

    // Update thread
    await ForumThread.findByIdAndUpdate(answer.thread, {
      $inc: { commentCount: 1 },
      lastActivityAt: new Date()
    });

    await answer.populate('comments.author', 'name avatar');
    const newComment = answer.comments[answer.comments.length - 1];

    // Real-time notification
    notifyNewComment(answer.thread, answerId, newComment);

    res.status(201).json({
      message: 'Comment added',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};

/**
 * Follow/unfollow thread
 */
export const toggleFollowThread = async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await ForumThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const userId = req.user._id;
    const isFollowing = thread.followers.includes(userId);

    if (isFollowing) {
      thread.followers = thread.followers.filter(f => f.toString() !== userId.toString());
    } else {
      thread.followers.push(userId);
      
      // Notify thread author
      if (thread.author.toString() !== userId.toString()) {
        await createNotification({
          recipient: thread.author,
          sender: userId,
          type: 'thread_followed',
          title: 'Thread Followed',
          message: `${req.user.name} is now following your thread`,
          thread: threadId,
          actionUrl: `/forum/${thread.forum}/thread/${threadId}`
        });
      }
    }

    await thread.save();

    // Real-time notification
    notifyThreadFollowed(threadId, {
      userId,
      isFollowing: !isFollowing
    });

    res.json({
      message: isFollowing ? 'Unfollowed thread' : 'Following thread',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ message: 'Failed to toggle follow', error: error.message });
  }
};

export default {
  createThread,
  getThreads,
  getThread,
  createAnswer,
  voteThread,
  voteAnswer,
  acceptAnswer,
  addComment,
  toggleFollowThread
};
