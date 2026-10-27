const { createModel } = require('../lib/pgModel');
module.exports = createModel('audit_logs', ['beforeState', 'afterState']);
