const { createModel } = require('../lib/pgModel');
module.exports = createModel('system_configs', ['value']);
