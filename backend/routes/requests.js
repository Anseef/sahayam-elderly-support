const router = require('express').Router();
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

// ==========================================
//      ELDERLY / GENERAL REQUEST ROUTES
// ==========================================

// --- 1. CREATE NEW REQUEST ---
router.post('/create_request', async (req, res) => {
  try {
    const db = getDb();
    const { 
      requesterId, requesterName, inputMode, category,
      location, curr_location, dateTime, notes, 
      voiceUri, isPaid, paymentAmount,
      requesterImage 
    } = req.body;

    if (!requesterId || !category) {
      return res.status(400).json({ message: 'Missing fields.' });
    }

    const newRequest = {
      requesterId,
      requesterName,
      requesterImage: requesterImage || null, 
      category,
      inputMode,
      status: 'Pending',
      createdAt: new Date(),
      location: location || null,
      curr_location: curr_location || null,
      dateTime: dateTime || null,
      notes: notes || null,
      voiceNote: (inputMode === 'voice' && voiceUri) ? voiceUri : null, 
      isPaid: isPaid || false,
      paymentAmount: isPaid ? paymentAmount : 0,
      volunteerId: null,
      volunteerName: null,
      volunteerImage: null // Initialize as null
    };

    const result = await db.collection('requests').insertOne(newRequest);
    res.status(201).json({ message: 'Saved!', requestId: result.insertedId });

  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 2. GET REQUESTS FOR USER ---
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const requests = await db.collection('requests')
      .find({ requesterId: req.params.userId }) 
      .sort({ createdAt: -1 }) 
      .toArray();

    const active = requests.filter(r => ['Pending', 'Accepted'].includes(r.status));
    const history = requests.filter(r => ['Completed', 'Cancelled'].includes(r.status));

    res.json({ active, history });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 3. DELETE REQUEST ---
router.delete('/delete/:requestId', async (req, res) => {
  try {
    const db = getDb();
    if (!ObjectId.isValid(req.params.requestId)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await db.collection('requests').deleteOne({ _id: new ObjectId(req.params.requestId) });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Not found' });

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// ==========================================
//            VOLUNTEER DATA ROUTES
// ==========================================

// --- 4. GET AVAILABLE REQUESTS (Feed) ---
router.get('/available', async (req, res) => {
  try {
    const db = getDb();
    const requests = await db.collection('requests')
      .find({ status: 'Pending' })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 5. GET VOLUNTEER TASKS (My Tasks) ---
router.get('/volunteer/:volunteerId', async (req, res) => {
  try {
    const db = getDb();
    const requests = await db.collection('requests')
      .find({ volunteerId: req.params.volunteerId })
      .sort({ createdAt: -1 })
      .toArray();

    const active = requests.filter(r => r.status === 'Accepted');
    const history = requests.filter(r => r.status === 'Completed');

    res.json({ active, history });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});


// ==========================================
//           VOLUNTEER ACTIONS (UPDATES)
// ==========================================

// --- 6. ACCEPT REQUEST ---
router.put('/accept/:requestId', async (req, res) => {
  try {
    const db = getDb();
    const { requestId } = req.params;
    const { volunteerId, volunteerName, volunteerImage } = req.body; // Added volunteerImage

    if (!ObjectId.isValid(requestId)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: 'Accepted',
          volunteerId,
          volunteerName,
          volunteerImage: volunteerImage || null, // Save Image URL
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Request accepted!' });

  } catch (err) {
    console.error("Accept Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 7. COMPLETE REQUEST (Volunteer) ---
router.put('/complete/:requestId', async (req, res) => {
  try {
    const db = getDb();
    const { requestId } = req.params;
    const { completionNote } = req.body; // <-- Extract the note

    if (!ObjectId.isValid(requestId)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: 'Completed', 
          completionNote: completionNote || null, // <-- Save the note
          updatedAt: new Date() 
        } 
      }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Completed!' });

  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 8. SUBMIT REVIEW (Elderly) ---
router.put('/review/:requestId', async (req, res) => {
  try {
    const db = getDb();
    const { requestId } = req.params;
    const { rating, feedback } = req.body;

    if (!ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid Request ID' });
    }

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Valid rating (1-5) is required.'});
    }

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          rating: rating,
          feedback: feedback || null,
          isReviewed: true, // Flag to show it's been reviewed
          reviewedAt: new Date() 
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Optional: You could also update the volunteer's average rating here

    res.json({ message: 'Review submitted successfully!' });
  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.put('/drop/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'Pending',
          volunteerId: null,
          volunteerName: null,
          volunteerImage: null 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Task dropped and returned to open feed.' });
  } catch (err) {
    console.error("Drop Task Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- CREATE REQUEST (Elderly user) ---
router.post('/create_request', async (req, res) => {
  try {
    const db = getDb();
    const payload = req.body;

    // --- NEW: Fetch the requester's actual profile image ---
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.requesterId) });
    
    const newRequest = {
      ...payload,
      requesterImage: user?.profileImage || null,
      status: 'Pending',
      createdAt: new Date()
    };
    console.log(requesterImage);

    const result = await db.collection('requests').insertOne(newRequest);
    res.status(201).json({ message: 'Request created', requestId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;