// ✅ controllers/platformController.js (없다면 새로 만들기)
exports.getAllPlatforms = async (req, res) => {
  const lang = req.query.lang || 'en'
try {
  const [rows] = await db.query(`
    SELECT p.id AS platform_id, pt.name, p.currency
    FROM platforms p
    JOIN platform_translations pt ON pt.platform_id = p.id
    WHERE pt.language = ?
  `, [lang])
  
  console.log('rows 길이:', rows.length)
  res.json(rows)

} catch (err) {
  console.error('❌ DB 또는 응답 오류:', err)
  res.status(500).json({ message: 'DB 처리 중 오류 발생' })
}

}
