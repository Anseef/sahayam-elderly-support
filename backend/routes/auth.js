const router = require('express').Router();
const { getDb } = require('../config/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

// --- REGISTER ROUTE ---
router.post('/register', async (req, res) => {
  try {
    const db = getDb();
    const { fullName, aadhaarNumber, phoneNumber, pin, role } = req.body;
    if (!fullName || !aadhaarNumber || !phoneNumber || !pin || !role) {
      return res.status(400).json({ message: 'All fields (Name, Aadhaar, Phone, PIN, Role) are required.' });
    }

    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(aadhaarNumber)) {
      return res.status(400).json({ message: 'Invalid Aadhaar Number. Must be exactly 12 digits.' });
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid Phone Number. Must be exactly 10 digits.' });
    }
    const pinRegex = /^\d{4}$/;
    if (!pinRegex.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });
    }
    if (role !== 'elderly' && role !== 'volunteer') {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ phoneNumber: phoneNumber }, { aadhaarNumber: aadhaarNumber }] 
    });

    if (existingUser) {
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: 'This Phone Number is already registered.' });
      }
      if (existingUser.aadhaarNumber === aadhaarNumber) {
        return res.status(400).json({ message: 'This Aadhaar Number is already registered.' });
      }
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    const newUser = {
      fullName,
      aadhaarNumber,
      phoneNumber,
      pin: hashedPin,
      role,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(newUser);
    
    res.status(201).json({ 
      message: 'User registered successfully!', 
      userId: result.insertedId,
      role: role 
    });

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const db = getDb();
    const { phoneNumber, pin } = req.body;

    if (!phoneNumber || !pin) {
      return res.status(400).json({ message: 'Please enter both Phone Number and PIN' });
    }
    const user = await db.collection('users').findOne({ phoneNumber: phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'Phone number not registered. Please create an account.' });
    }
    const validPin = await bcrypt.compare(pin, user.pin);
    if (!validPin) {
      return res.status(400).json({ message: 'Invalid PIN. Please try again.' });
    }
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        name: user.fullName,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// --- PROFILE ROUTE (UPDATED) ---
router.get('/profile/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { pin: 0 } } // Don't send PIN
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // --- MASK AADHAAR LOGIC ---
    if (user.aadhaarNumber && user.aadhaarNumber.length === 12) {
      const last4Digits = user.aadhaarNumber.slice(-4);
      user.aadhaarNumber = `XXXX XXXX ${last4Digits}`;
    }

    res.json(user);

  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.put('/profile/image/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const { profileImage } = req.body; // This is the Base64 string

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profileImage: profileImage } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile image updated successfully' });

  } catch (err) {
    console.error("Image Upload Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});



router.put('/update/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    
    // Validate ID
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    // Prepare Update Data (Map Frontend keys to Backend keys)
    const updateData = {
      fullName: req.body.name,           // Frontend sends 'name', DB expects 'fullName'
      phoneNumber: req.body.phone,       // Frontend sends 'phone', DB expects 'phoneNumber'
      aadhaarNumber: req.body.aadhaar,   // Frontend sends 'aadhaar', DB expects 'aadhaarNumber'
      address: req.body.address,
      location: req.body.location,
      bloodGroup: req.body.bloodGroup,
      conditions: req.body.conditions,
      guardian: req.body.guardian
    };

    // Remove undefined fields (so we don't overwrite with nulls if not sent)
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});
module.exports = router;