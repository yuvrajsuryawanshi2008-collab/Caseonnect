const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

function formatNotification(n) {
  if (!n) return null;
  const obj = typeof n.toObject === 'function' ? n.toObject() : { ...n };
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    _id: (obj._id || obj.id)?.toString()
  };
}

// GET /api/notifications
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userBureau = req.user.bureauId;

    const filter = {
      $or: [
        { recipientUserId: null },
        { recipientUserId: userId }
      ]
    };
    if (userBureau) {
      filter.$or.push({ bureauCode: userBureau });
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).lean();
    const formatted = notifications.map(formatNotification);
    const unreadCount = formatted.filter(n => !n.isRead).length;

    res.json({
      success: true,
      unreadCount,
      notifications: formatted
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { $set: { isRead: true } });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userBureau = req.user.bureauId;

    const filter = {
      $or: [
        { recipientUserId: null },
        { recipientUserId: userId }
      ]
    };
    if (userBureau) {
      filter.$or.push({ bureauCode: userBureau });
    }

    await Notification.updateMany(filter, { $set: { isRead: true } });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
