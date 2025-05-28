const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const mongoURI = 'mongodb://localhost:27017/pdfdb';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
  console.log('MongoDB connected and GridFS ready');
});

module.exports = { mongoose, gfs: () => gfs };
