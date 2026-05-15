const ForumPost = require("../module/ForumPost");

exports.getPosts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = { society: req.user.society, isHidden: false };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const total = await ForumPost.countDocuments(filter);
    const posts = await ForumPost.find(filter)
      .populate("author", "name role flatNumber wing avatar")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, posts });
  } catch (err) { next(err); }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate("author", "name role flatNumber wing avatar")
      .populate("replies.sender", "name role avatar");
    if (!post || post.isHidden) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, post });
  } catch (err) { next(err); }
};

exports.createPost = async (req, res, next) => {
  try {
    const post = await ForumPost.create({
      ...req.body,
      society: req.user.society,
      author: req.user._id,
    });
    res.status(201).json({ success: true, post });
  } catch (err) { next(err); }
};

exports.addReply = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post || post.isLocked) return res.status(400).json({ success: false, message: "Post locked or not found" });

    post.replies.push({ author: req.user._id, body: req.body.body });
    await post.save();
    res.json({ success: true, replies: post.replies });
  } catch (err) { next(err); }
};

exports.likePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Not found" });

    const idx = post.likes.indexOf(req.user._id);
    if (idx === -1) post.likes.push(req.user._id);
    else post.likes.splice(idx, 1); // toggle

    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (err) { next(err); }
};

exports.moderatePost = async (req, res, next) => {
  try {
    const { isPinned, isLocked, isHidden } = req.body;
    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { isPinned, isLocked, isHidden },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, post });
  } catch (err) { next(err); }
};