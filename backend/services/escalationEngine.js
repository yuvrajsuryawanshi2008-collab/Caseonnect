const Case = require('../models/Case');
const Notification = require('../models/Notification');
const { CASE_STATUSES } = require('../config/constants');

/**
 * Calculates case ageing category (0-7, 8-15, 16-30, >30 days) and overdue state.
 */
function calculateAgeing(caseDoc) {
  const now = new Date();
  const received = new Date(caseDoc.receivedDate || caseDoc.createdAt);
  const ageDays = Math.max(0, Math.floor((now - received) / (1000 * 60 * 60 * 24)));

  let bracket = '0-7 days';
  if (ageDays > 30) bracket = '>30 days';
  else if (ageDays >= 16) bracket = '16-30 days';
  else if (ageDays >= 8) bracket = '8-15 days';

  const isClosed = [CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED].includes(caseDoc.status);
  const deadline = new Date(caseDoc.slaDeadline);
  const isOverdue = !isClosed && now > deadline;
  const daysOverdue = isOverdue ? Math.floor((now - deadline) / (1000 * 60 * 60 * 24)) : 0;
  const daysRemaining = !isOverdue && !isClosed ? Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))) : 0;

  return {
    ageDays,
    bracket,
    isOverdue,
    daysOverdue,
    daysRemaining
  };
}

/**
 * Routine audit to alert on impending SLA deadlines and overdue matters.
 */
async function scanAndProcessDeadlines() {
  const activeCases = await Case.find({
    status: { $nin: [CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED] }
  });

  const now = new Date();

  for (const c of activeCases) {
    const deadline = new Date(c.slaDeadline);
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours > 0 && diffHours <= 48) {
      const existing = await Notification.findOne({
        caseId: String(c._id),
        type: 'DEADLINE_WARNING',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existing) {
        await Notification.create({
          bureauCode: c.bureauCode,
          recipientUserId: c.assignedOfficerId,
          title: `Approaching SLA Deadline: ${c.caseNumber}`,
          message: `Case ${c.caseNumber} at ${c.institutionName} reaches its SLA deadline in ${Math.round(diffHours)} hours.`,
          type: 'DEADLINE_WARNING',
          caseId: String(c._id),
          linkUrl: `/cases`
        });
      }
    } else if (diffHours < 0) {
      const existing = await Notification.findOne({
        caseId: String(c._id),
        type: 'OVERDUE_ALERT',
        createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
      });

      if (!existing) {
        await Notification.create({
          bureauCode: c.bureauCode,
          recipientUserId: c.assignedOfficerId,
          title: `OVERDUE CASE: ${c.caseNumber}`,
          message: `Case ${c.caseNumber} has exceeded its SLA resolution window by ${Math.abs(Math.round(diffHours / 24))} day(s). Immediate action or escalation required.`,
          type: 'OVERDUE_ALERT',
          caseId: String(c._id),
          linkUrl: `/pending-overdue`
        });
      }
    }
  }
}

module.exports = {
  calculateAgeing,
  scanAndProcessDeadlines
};
