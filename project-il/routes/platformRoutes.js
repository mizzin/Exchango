// routes/platformRoutes.js

const express = require('express')
const router = express.Router()
const db = require('../db') // 예: mysql2 or your db wrapper

router.get('/', async (req, res) => {
  const lang = req.query.lang || 'ko'

  try {
    const [rows] = await db.query(`
      SELECT p.id AS platform_id, pt.name, p.currency
      FROM platforms p
      JOIN platform_translations pt ON pt.platform_id = p.id
      WHERE pt.language = ?
      ORDER BY p.id
    `, [lang])
    
    res.json(rows)
  } catch (err) {
    console.error('플랫폼 목록 로딩 실패:', err)
    res.status(500).json({ message: '플랫폼 목록 불러오기 실패', error: err.message })
  }
})

module.exports = router
