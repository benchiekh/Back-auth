const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();


router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;
  
    try {
      let user = await User.findOne({ email }); // Recherchez par 'email' au lieu de 'username'
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }
  
      user = new User({
        firstName,
        lastName,
        email,
        password,
        role
      });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();
  
      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  




/////// route login 

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
  
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
  
        console.log('User object:', user); // Log user object to see if role is present
  
        const payload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
        // Send token and role in the response
        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


  
  module.exports = router;
  