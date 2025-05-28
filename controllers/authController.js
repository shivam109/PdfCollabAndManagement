const { registerUser, signInUser } = require('../firebase/firebaseAuthService');
const admin = require('../firebase/firebaseConfig');

exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userData = await registerUser(email, password);
    res.status(201).json(userData);
  } catch (err) {
    res.status(400).json({ error: err.response.data.error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userData = await signInUser(email, password);
    res.status(200).json(userData); // contains idToken, etc.
  } catch (err) {
    res.status(400).json({ error: err.response.data.error.message });
  }
};

exports.verifyToken = async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    res.status(200).json({ uid: decoded.uid, email: decoded.email });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
