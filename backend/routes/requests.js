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
    const payload = req.body;

    if (!payload.requesterId || !payload.category) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Fetch the requester's actual profile image from the users collection
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.requesterId) });

    const newRequest = {
      requesterId: payload.requesterId,
      requesterName: payload.requesterName,
      requesterImage: user?.profileImage || payload.requesterImage || null, // Best fallback
      category: payload.category,
      inputMode: payload.inputMode,
      status: 'Pending',
      createdAt: new Date(),
      location: payload.location || null,
      curr_location: payload.curr_location || null,
      dateTime: payload.dateTime || null,
      notes: payload.notes || null,
      voiceNote: (payload.inputMode === 'voice' && payload.voiceUri) ? payload.voiceUri : null, 
      isPaid: payload.isPaid || false,
      paymentAmount: payload.isPaid ? payload.paymentAmount : 0,
      volunteerId: null,
      volunteerName: null,
      volunteerImage: null 
    };

    const result = await db.collection('requests').insertOne(newRequest);
    res.status(201).json({ message: 'Request created!', requestId: result.insertedId });

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

// --- 4. GET ALL REQUESTS (Added for Volunteer Profile Stats) ---
router.get('/all', async (req, res) => {
  try {
    const db = getDb();
    const requests = await db.collection('requests').find().sort({ createdAt: -1 }).toArray();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 5. GET AVAILABLE REQUESTS (Feed) ---
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

// --- 6. GET VOLUNTEER TASKS (My Tasks) ---
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

// --- 7. ACCEPT REQUEST ---
router.put('/accept/:requestId', async (req, res) => {
  try {
    const db = getDb();
    const { requestId } = req.params;
    const { volunteerId, volunteerName, volunteerImage } = req.body; 

    if (!ObjectId.isValid(requestId)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: 'Accepted',
          volunteerId,
          volunteerName,
          volunteerImage: volunteerImage || null,
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

// --- 8. COMPLETE REQUEST (Volunteer) ---
router.put('/complete/:requestId', async (req, res) => {
  try {
    const db = getDb();
    const { requestId } = req.params;
    const { completionNote } = req.body; 

    if (!ObjectId.isValid(requestId)) return res.status(400).json({ message: 'Invalid ID' });

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: 'Completed', 
          completionNote: completionNote || null,
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

// --- 9. DROP TASK (Volunteer) ---
router.put('/drop/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid request ID' });

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

    if (result.matchedCount === 0) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Task dropped and returned to open feed.' });
  } catch (err) {
    console.error("Drop Task Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 10. SUBMIT REVIEW AND RATING (Elderly) ---
router.put('/review/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Request ID' });

    const result = await db.collection('requests').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          rating: Number(rating), 
          feedback: feedback,
          isReviewed: true 
        } 
      }
    );

    if (result.matchedCount === 0) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Review submitted successfully' });

  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 11. SUBMIT A REPORT / COMPLAINT ---
router.post('/report/:taskId', async (req, res) => {
  try {
    const db = getDb();
    const { taskId } = req.params;
    const { reportedBy, reporterName, reporterRole, issue, taskTitle } = req.body;

    const newReport = {
      taskId: new ObjectId(taskId),
      taskTitle,
      reportedBy: new ObjectId(reportedBy),
      reporterName,
      reporterRole,
      issue,
      status: 'Unresolved',
      createdAt: new Date()
    };

    await db.collection('reports').insertOne(newReport);
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;