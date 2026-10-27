const { createModel } = require('../lib/pgModel');
module.exports = createModel('overlap_reviews', ['layerMatches', 'matchingTokens']);
