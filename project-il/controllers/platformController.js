// ✅ controllers/platformController.js (없다면 새로 만들기)
exports.getAllPlatforms = async (req, res) => {
  const lang = req.query.lang || 'ko'

  try {
    const [rows] = await db.query(
      `
      SELECT DISTINCT p.id AS platform_id, pt.name
      FROM platforms p
      JOIN platform_translations pt ON p.id = pt.platform_id
      WHERE pt.language = ?
      ORDER BY pt.name ASC
      `,
      [lang]
    )

    const platforms = rows.map(row => ({
      id: row.platform_id,
      name: row.name
    }))

    res.json(platforms)
  } catch (err) {
    console.error('❌ 플랫폼 목록 조회 실패:', err)
    res.status(500).json({ message: '플랫폼 목록을 불러올 수 없습니다.' })
  }
}
