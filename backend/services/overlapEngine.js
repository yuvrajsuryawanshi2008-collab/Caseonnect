const Case = require('../models/Case');
const OverlapReview = require('../models/OverlapReview');
const Notification = require('../models/Notification');
const { tokenize, computeJaccardSimilarity, findMatchingTokens } = require('../utils/textSimilarity');

/**
 * Executes 3-layer cross-bureau overlap detection for a target case.
 */
async function scanForOverlaps(targetCase) {
  if (!targetCase || !targetCase.institutionId) return [];

  // Query other open or recent cases for the same institution (or matching permanent ID)
  const candidateCases = await Case.find({
    institutionId: targetCase.institutionId
  });

  const discoveredOverlaps = [];

  for (const candidate of candidateCases) {
    // Avoid comparing case to itself
    if (String(candidate._id) === String(targetCase._id)) continue;

    // Check if overlap review already exists between these two cases
    const existing = await OverlapReview.findOne({
      $or: [
        { caseAId: targetCase._id, caseBId: candidate._id },
        { caseAId: candidate._id, caseBId: targetCase._id }
      ]
    });

    if (existing) {
      discoveredOverlaps.push(existing);
      continue;
    }

    // Layer 1: Deterministic Key Match
    const exactIdMatch = String(targetCase.permanentId) === String(candidate.permanentId);
    let confidenceScore = 0;
    const explanations = [];

    // Layer 2: Rule-Based Contextual Match
    const isDifferentBureau = targetCase.bureauCode !== candidate.bureauCode;
    const isSameCategory = targetCase.category === candidate.category;
    
    const targetDate = new Date(targetCase.receivedDate || targetCase.createdAt);
    const candidateDate = new Date(candidate.receivedDate || candidate.createdAt);
    const diffDays = Math.abs((targetDate - candidateDate) / (1000 * 60 * 60 * 24));
    const timeWindowOverlap = diffDays <= 60;

    if (exactIdMatch) {
      confidenceScore += 30;
      explanations.push(`Layer 1: Identical institution statutory ID (${targetCase.permanentId})`);
    }

    if (isDifferentBureau) {
      explanations.push(`Cross-Bureau jurisdiction detected: ${targetCase.bureauCode} and ${candidate.bureauCode}`);
      if (isSameCategory) {
        confidenceScore += 30;
        explanations.push(`Layer 2: Matching grievance category '${targetCase.category}' across bureaus`);
      }
      if (timeWindowOverlap) {
        confidenceScore += 15;
        explanations.push(`Layer 2: Temporal proximity (${Math.round(diffDays)} days apart)`);
      }
    } else {
      if (isSameCategory) {
        confidenceScore += 20;
        explanations.push(`Matching category within same bureau (${targetCase.category})`);
      }
    }

    // Layer 3: Lexical & Text Similarity
    const textA = `${targetCase.title} ${targetCase.description}`;
    const textB = `${candidate.title} ${candidate.description}`;
    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);
    const textSim = computeJaccardSimilarity(tokensA, tokensB);
    const matchedTokens = findMatchingTokens(tokensA, tokensB);

    if (textSim > 0.15) {
      const addedScore = Math.min(35, Math.round(textSim * 70));
      confidenceScore += addedScore;
      explanations.push(`Layer 3: Text narrative similarity (${Math.round(textSim * 100)}%) with overlapping terms: [${matchedTokens.slice(0, 5).join(', ')}]`);
    }

    // Threshold: if confidence >= 40% and involves multiple cases
    if (confidenceScore >= 40) {
      const newReview = await OverlapReview.create({
        caseAId: String(targetCase._id),
        caseANumber: targetCase.caseNumber,
        caseATitle: targetCase.title,
        caseABureau: targetCase.bureauCode,
        caseAOfficer: targetCase.assignedOfficerName || 'Unassigned',
        
        caseBId: String(candidate._id),
        caseBNumber: candidate.caseNumber,
        caseBTitle: candidate.title,
        caseBBureau: candidate.bureauCode,
        caseBOfficer: candidate.assignedOfficerName || 'Unassigned',
        
        institutionId: String(targetCase.institutionId),
        institutionName: targetCase.institutionName,
        permanentId: targetCase.permanentId,
        
        confidenceScore: Math.min(100, confidenceScore),
        layerMatches: {
          exactIdMatch,
          categoryOverlap: isSameCategory,
          timeWindowOverlap,
          textSimilarityScore: Math.round(textSim * 100)
        },
        matchingTokens: matchedTokens.slice(0, 8),
        explanation: explanations.join(' | '),
        status: 'PENDING_REVIEW'
      });

      // Mark cases as having potential overlaps
      await Case.findByIdAndUpdate(targetCase._id, { hasPotentialOverlap: true });
      await Case.findByIdAndUpdate(candidate._id, { hasPotentialOverlap: true });

      // Dispatch alert to both bureaus
      await Notification.create({
        bureauCode: targetCase.bureauCode,
        title: `Potential Overlapping Case Detected: ${targetCase.caseNumber}`,
        message: `Potential overlap with ${candidate.caseNumber} (${candidate.bureauCode}) at ${targetCase.institutionName}. Review and coordination required.`,
        type: 'OVERLAP_ALERT',
        caseId: String(targetCase._id),
        linkUrl: `/overlaps`
      });

      if (isDifferentBureau) {
        await Notification.create({
          bureauCode: candidate.bureauCode,
          title: `Potential Overlapping Case Detected: ${candidate.caseNumber}`,
          message: `Case ${targetCase.caseNumber} filed at ${targetCase.bureauCode} matches ${candidate.caseNumber}. Review and coordination required.`,
          type: 'OVERLAP_ALERT',
          caseId: String(candidate._id),
          linkUrl: `/overlaps`
        });
      }

      discoveredOverlaps.push(newReview);
    }
  }

  return discoveredOverlaps;
}

module.exports = {
  scanForOverlaps
};
