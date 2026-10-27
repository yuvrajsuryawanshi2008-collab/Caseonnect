const { createModel } = require('../lib/pgModel');
module.exports = createModel('coordination_requests', ['associatedCaseIds', 'jointActionNotes']);
