const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
const fileRoutes = require('./routes/files');
app.use('/api/files', fileRoutes);
app.listen(3000, () => {
  console.log('Server running on port 3000');
});