const router = require('express').Router();
const { getDb } = require('../config/db');
const { ObjectId } = require('mongodb');

// --- 1. GET ALL PENDING USERS ---
router.get('/pending-users', async (req, res) => {
  try {
    const db = getDb();
    // Fetch users who are strictly marked as 'pending'
    const users = await db.collection('users').find({ accountStatus: 'pending' }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 2. APPROVE OR REJECT USER (With Privacy Cleanup) ---
router.put('/verify-user/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, aadhaarNumber } = req.body; // status = 'approved' or 'rejected'

    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // --- NEW: PRIVACY & STORAGE OPTIMIZATION ---
    let updateQuery;
    if (status === 'rejected') {
      // If rejected, set status AND delete the heavy/sensitive images
      updateQuery = { 
        $set: { accountStatus: 'rejected' },
        $unset: { aadhaarCardImage: "", profileImage: "" } // $unset completely removes these fields
      };
    } else {
      // If approved, just update the status
      updateQuery = { 
        $set: { accountStatus: 'approved' } 
      };
    }

    // Update the user's status in the database
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      updateQuery
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User successfully ${status}!` });
  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- 3. GET ALL REQUESTS (FOR MONITORING) ---
router.get('/all-requests', async (req, res) => {
  try {
    const db = getDb();
    // Fetch all requests, sorted by newest first
    const requests = await db.collection('requests').find().sort({ createdAt: -1 }).toArray();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- GET ALL REPORTS/COMPLAINTS ---
router.get('/all-reports', async (req, res) => {
  try {
    const db = getDb();
    // Only fetch reports that are NOT resolved
    const reports = await db.collection('reports')
                            .find({ status: { $ne: 'Resolved' } }) 
                            .sort({ createdAt: -1 })
                            .toArray();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- GET ALL APPROVED VOLUNTEERS ---
router.get('/all-volunteers', async (req, res) => {
  try {
    const db = getDb();
    const volunteers = await db.collection('users').find({ role: 'volunteer', accountStatus: 'approved' }).toArray();
    res.json(volunteers);
  } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});
// GET ALL ACTIVE ELDERLY USERS
router.get('/all-elderly', async (req, res) => {
  try {
    const db = getDb();
    const elderly = await db.collection('users')
      .find({ role: 'elderly', accountStatus: 'approved' })
      .toArray();
    res.json(elderly);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- BAN USER (UPDATE STATUS TO TERMINATED) ---
router.delete('/delete-user/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { accountStatus: 'terminated' } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- UNBAN USER (RESTORE STATUS TO APPROVED) ---
router.put('/unban-user/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { accountStatus: 'approved' } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- GET ALL BANNED USERS ---
router.get('/banned-users', async (req, res) => {
  try {
    const db = getDb();
    const bannedUsers = await db.collection('users').find({ accountStatus: 'terminated' }).toArray();
    res.json(bannedUsers);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});
// --- MARK REPORT AS RESOLVED ---
router.put('/resolve-report/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid Report ID' });

    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'Resolved' } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report marked as resolved.' });
  } catch (err) {
    console.error("Resolve Report Error:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;