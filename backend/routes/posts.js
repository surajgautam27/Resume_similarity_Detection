const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a post
router.post('/', auth, [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Post must be 1-2000 characters'),
  body('mediaUrl').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = new Post({
      author: req.user.userId,
      content: req.body.content,
      mediaUrl: req.body.mediaUrl
    });
    await post.save();
    const populated = await Post.findById(post._id).populate('author', 'name email');
    res.status(201).json({ post: populated });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// List posts (feed)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find()
      .populate('author', 'name email')
      .populate('comments.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const total = await Post.countDocuments();
    res.json({ posts, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (error) {
    console.error('List posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like/unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const userId = req.user.userId;
    const liked = (post.likes || []).some(id => id.toString() === userId);
    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes = post.likes || [];
      post.likes.push(userId);
    }
    await post.save();
    const populated = await Post.findById(post._id).populate('author', 'name email');
    res.json({ post: populated, likesCount: populated.likes?.length || 0, message: liked ? 'Unliked' : 'Liked' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', auth, [
  body('text').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments = post.comments || [];
    post.comments.push({ user: req.user.userId, text: req.body.text });
    await post.save();
    const populated = await Post.findById(post._id)
      .populate('author', 'name email')
      .populate('comments.user', 'name email');
    res.status(201).json({ comments: populated.comments });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete own post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete' });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


