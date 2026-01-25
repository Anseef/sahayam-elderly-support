const router = require('express').Router();
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

router.post('/create_request', async (req, res) => {
  try {
    const db = getDb();
    const { 
      requesterId, 
      requesterName, 
      inputMode,
      category,
      location, 
      dateTime, 
      notes, 
      voiceUri,
      isPaid,
      paymentAmount 
    } = req.body;

    // 2. Validation
    if (!requesterId || !category) {
      return res.status(400).json({ message: 'Missing required fields (User ID or Category).' });
    }
    const newRequest = {
      requesterId: requesterId,
      requesterName: requesterName,
      category: category,
      inputMode: inputMode,
      status: 'Pending',
      createdAt: new Date(),
      
      location: inputMode === 'text' ? location : null,
      dateTime: inputMode === 'text' ? dateTime : null,
      notes: inputMode === 'text' ? notes : null,
      
      voiceNote: inputMode === 'voice' ? voiceUri : null, 

      isPaid: isPaid || false,
      paymentAmount: isPaid ? paymentAmount : 0,
      
      volunteerId: null,
      volunteerName: null
    };

    const result = await db.collection('requests').insertOne(newRequest);
    res.status(201).json({ 
      message: 'Request saved successfully!', 
      requestId: result.insertedId,
      savedRequest: newRequest
    });

  } catch (err) {
    console.error("Database Save Error:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// --- GET REQUESTS FOR A SPECIFIC USER (Existing) ---
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;

    const requests = await db.collection('requests')
      .find({ requesterId: userId }) 
      .sort({ createdAt: -1 }) 
      .toArray();

    const active = requests.filter(r => r.status === 'Pending' || r.status === 'Accepted');
    const history = requests.filter(r => r.status === 'Completed' || r.status === 'Cancelled');

    res.json({ active, history });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;