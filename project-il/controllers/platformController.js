// controllers/platformController.js
const db = require('../db')

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
// 조회
exports.getUserPlatforms = async (req, res) => {
  const { id } = req.params
  const lang = req.query.lang || 'ko' // ✅ 언어 동적 설정

  try {
    const [rows] = await db.query(`
      SELECT up.id, up.platform_id, up.platform_user_id, pt.name AS platform_name
      FROM user_platforms up
      JOIN platform_translations pt 
        ON up.platform_id = pt.platform_id 
        AND pt.language = ?
      WHERE up.user_id = ?
      ORDER BY up.created_at ASC
    `, [lang, id])

    res.json(rows)
  } catch (err) {
    console.error('❌ 플랫폼 조회 실패:', err)
    res.status(500).json({ message: '플랫폼 정보를 불러올 수 없습니다.' })
  }
}

// 등록
exports.addUserPlatform = async (req, res) => {
  const { id } = req.params
  const { platform_id, platform_user_id } = req.body

  if (!platform_id || !platform_user_id)
    return res.status(400).json({ message: '플랫폼과 아이디를 모두 입력해주세요.' })

  try {
    // 현재 등록 개수 확인
    const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM user_platforms WHERE user_id = ?', [id])
    if (countRows[0].cnt >= 3)
      return res.status(400).json({ message: '최대 3개의 플랫폼만 등록할 수 있습니다.' })

    // 중복 방지
    const [dupRows] = await db.query('SELECT * FROM user_platforms WHERE user_id = ? AND platform_id = ?', [id, platform_id])
    if (dupRows.length > 0)
      return res.status(400).json({ message: '이미 등록된 플랫폼입니다.' })

    // 등록
    await db.query(`
      INSERT INTO user_platforms (user_id, platform_id, platform_user_id)
      VALUES (?, ?, ?)
    `, [id, platform_id, platform_user_id])

    res.status(201).json({ message: '플랫폼이 등록되었습니다.' })
  } catch (err) {
    console.error('❌ 플랫폼 등록 실패:', err)
    res.status(500).json({ message: '플랫폼 등록 중 오류가 발생했습니다.' })
  }
}