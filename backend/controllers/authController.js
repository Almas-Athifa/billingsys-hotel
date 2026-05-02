const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const getStaff = async (req, res) => {
  const users = await User.find({ role: 'Staff' }).select('-password');
  res.json(users);
};

const addStaff = async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'Staff'
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

const deleteStaff = async (req, res) => {
  try {
     const user = await User.findById(req.params.id);
     if(user) {
        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User removed' });
     } else {
        res.status(404).json({ message: 'User not found' });
     }
  } catch(error) {
     res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, getStaff, addStaff, deleteStaff };
