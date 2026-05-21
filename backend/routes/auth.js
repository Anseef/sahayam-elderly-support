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
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Regex Validations
    if (!/^\d{12}$/.test(aadhaarNumber)) return res.status(400).json({ message: 'Invalid Aadhaar (12 digits required).' });
    if (!/^\d{10}$/.test(phoneNumber)) return res.status(400).json({ message: 'Invalid Phone (10 digits required).' });
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ message: 'PIN must be 4 digits.' });
    
    // Check Existing User
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ phoneNumber }, { aadhaarNumber }] 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this Phone or Aadhaar.' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const newUser = {
      fullName,
      aadhaarNumber,
      phoneNumber,
      pin: hashedPin,
      role,
      profileImage: null, 
      location: null,     
      accountStatus: 'pending',
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
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// --- LOGIN ROUTE (UPDATED) ---
router.post('/login', async (req, res) => {
  try {
    const db = getDb();
    const { phoneNumber, pin } = req.body;

    if (!phoneNumber || !pin) {
      return res.status(400).json({ message: 'Enter Phone and PIN' });
    }

    const user = await db.collection('users').findOne({ phoneNumber });
    
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    const validPin = await bcrypt.compare(pin, user.pin);
    if (!validPin) {
      return res.status(400).json({ message: 'Invalid PIN.' });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // --- RETURN PROFILE DATA ON LOGIN ---
    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        name: user.fullName,
        role: user.role,
        profileImage: user.profileImage || null, 
        location: user.location || null, 
        phoneNumber: user.phoneNumber,
        accountStatus: user.accountStatus || 'pending' // <-- NEW: Send status back to app
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- PROFILE ROUTE ---
router.get('/profile/:userId', async (req, res) => {
  try {
    const db = getDb();
    if (!ObjectId.isValid(req.params.userId)) return res.status(400).json({ message: 'Invalid ID' });

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.params.userId) },
      { projection: { pin: 0 } }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Mask Aadhaar
    if (user.aadhaarNumber && user.aadhaarNumber.length === 12) {
      user.aadhaarNumber = `XXXX XXXX ${user.aadhaarNumber.slice(-4)}`;
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- UPDATE CONTACTS ---
router.put('/contacts/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const { contacts } = req.body; 

    if (!ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { trustedContacts: contacts } }
    );

    res.json({ message: 'Contacts updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- GENERIC UPDATE USER PROFILE ---
router.put('/profile/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const updateData = req.body; 

    // Remove immutable fields to prevent accidental overwrites
    delete updateData._id; 
    delete updateData.role; 
    delete updateData.accountStatus;

    // Handle array updates specifically for saved addresses
    if (req.body.savedAddresses) {
        updateData.savedAddresses = req.body.savedAddresses;
    }

    // Remove undefined keys so we don't accidentally wipe data
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});
module.exports = router;