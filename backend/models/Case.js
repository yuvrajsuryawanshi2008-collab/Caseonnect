const { createModel } = require('../lib/pgModel');
module.exports = createModel('cases', ['timeline', 'internalRemarks', 'documents', 'relatedCaseIds']);
