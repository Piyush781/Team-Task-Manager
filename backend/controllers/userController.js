const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    user.role = req.body.role;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ New: open to all authenticated users — returns only id + name + email
const getAllUsersBasic = async (req, res) => {
  try {
    const users = await User.find()
      .select('name email')
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, updateRole, getAllUsersBasic };