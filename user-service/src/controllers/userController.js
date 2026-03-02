const User = require('../models/User');

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'firstName, lastName, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ firstName, lastName, email, password });
    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

const getUsers = async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
