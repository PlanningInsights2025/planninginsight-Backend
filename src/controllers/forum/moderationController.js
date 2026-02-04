// Placeholder moderation controller to satisfy imports and allow the server to start.
// TODO: Implement full moderation logic (flags, identity reveal, appeals).

export const getAllFlags = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'getAllFlags is not implemented yet.'
  });
};

export const getAnonymousIdentity = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'getAnonymousIdentity is not implemented yet.'
  });
};

export const resolveFlag = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'resolveFlag is not implemented yet.'
  });
};

export const submitAppeal = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'submitAppeal is not implemented yet.'
  });
};

export const reviewAppeal = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'reviewAppeal is not implemented yet.'
  });
};

export default {
  getAllFlags,
  getAnonymousIdentity,
  resolveFlag,
  submitAppeal,
  reviewAppeal
};
