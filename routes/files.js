const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db/mysqlConfig')
const verifyToken = require('../middlewares/verifyToken')
const nodemailer = require('nodemailer')

const router = express.Router()

// Setup local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/'
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({ storage })

/**
 * 📤 Upload PDF (stores in local + saves in MySQL)
 */
router.post('/upload', verifyToken, upload.single('pdf'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ message: 'No file uploaded' })

  const { filename, path: filepath } = file
  try {
    await db.query(
      'INSERT INTO pdf_files (name, path, user_id) VALUES (?, ?, ?)',
      [filename, filepath, req.user.uid],
    )
    res.status(201).json({ message: 'File uploaded successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * 📄 List user files
 */
router.get('/user/:uid', verifyToken, async (req, res) => {
  try {
    const [
      rows,
    ] = await db.query(
      'SELECT * FROM pdf_files WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.uid],
    )
    res.status(200).json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * 👁 View PDF file
 */
router.get('/view/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/', req.params.filename)
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${req.params.filename}"`,
    )
    res.setHeader('Access-Control-Allow-Origin', '*')
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)

    stream.on('error', (err) => {
      res.status(500).send('Error streaming PDF')
    })
  } else {
    res.status(404).json({ message: 'File not found' })
  }
})

/**
 * 🔗 Generate shareable link
 */
router.get('/:id/share', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pdf_files WHERE id = ?', [
      req.params.id,
    ])
    if (rows.length === 0)
      return res.status(404).json({ message: 'File not found' })

    const file = rows[0]
    if (file.user_id !== req.user.uid)
      return res.status(403).json({ message: 'Unauthorized' })
    const link = `http://localhost:4200/shared/${file.name
      .replace('.pdf', '')
      .split('/')
      .pop()}`
    res.json({ link })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
router.post('/:id/comments', async (req, res) => {
  const { author = 'Guest', text, parentId = null } = req.body
  const fileId = req.params.id
  if (!text) return res.status(400).json({ message: 'Comment text required' })

  try {
    await db.query(
      'INSERT INTO comments (file_id, author, text, parent_id) VALUES (?, ?, ?, ?)',
      [fileId, author, text, parentId],
    )

    res.status(201).json({ message: 'Comment added' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
router.get('/:id/comments', async (req, res) => {
  const fileId = req.params.id

  try {
    const [
      comments,
    ] = await db.query(
      'SELECT * FROM comments WHERE file_id = ? ORDER BY created_at ASC',
      [fileId],
    )

    res.status(200).json(comments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /files/:id/share/email
router.post('/:id/share/email', verifyToken, async (req, res) => {
  const { email } = req.body
  const fileId = req.params.id
  if (!email)
    return res.status(400).json({ message: 'Recipient email required' })

  try {
    // Get the file info from DB
    const [rows] = await db.query('SELECT * FROM pdf_files WHERE name = ?', [
      fileId,
    ])
    if (rows.length === 0)
      return res.status(404).json({ message: 'File not found' })

    const file = rows[0]
    if (file.user_id !== req.user.uid)
      return res.status(403).json({ message: 'Unauthorized' })

    // ✅ Generate link to open in shared-viewer
    const shareLink = `http://localhost:4200/shared/${file.name.replace(
      '.pdf',
      '',
    )}`

    // ✅ Setup email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rr0380106@gmail.com',
        pass: 'fgkt rydv lvfp ozwb', // Use App Password, not your Gmail password
      },
    })

    // ✅ Email options
    const mailOptions = {
      from: '"PDF App" rr0380106@gmail.com',
      to: email,
      subject: 'Shared PDF File',
      html: `
        <p>You have been invited to view a PDF file.</p>
        <p><strong>${file.name}</strong></p>
        <p>Click the link below to view it:</p>
        <a href="${shareLink}" target="_blank">${shareLink}</a>
      `,
    }

    // ✅ Send email
    await transporter.sendMail(mailOptions)

    res.status(200).json({ message: 'Shareable link sent via email' })
  } catch (err) {
    console.error('Email error:', err.message)
    res.status(500).json({ message: 'Failed to send email' })
  }
})

module.exports = router
