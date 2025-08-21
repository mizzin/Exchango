const path = require('path')
const fs = require('fs')
const multer = require('multer')

// 저장 폴더 생성
const uploadPath = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

exports.uploadImage = [
  upload.single('file'),
  (req, res) => {
    const fileUrl = `/uploads/${req.file.filename}`
    res.json({ url: fileUrl })
  }
]