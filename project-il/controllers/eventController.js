// controllers/eventController.js
const db = require('../db')

// 📍이벤트 목록 조회
exports.getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM event_bonus ORDER BY created_at DESC')
    res.status(200).json(rows)
  } catch (err) {
    console.error('❌ 이벤트 목록 조회 실패:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// 📍이벤트 생성
exports.createEvent = async (req, res) => {
  const { event_name, start_date, end_date, bonus_rate, target_type } = req.body
  try {
    await db.query(
      `INSERT INTO event_bonus (event_name, start_date, end_date, bonus_rate, target_type)
       VALUES (?, ?, ?, ?, ?)`,
      [event_name, start_date, end_date, bonus_rate, target_type]
    )
    res.status(201).json({ message: 'Event created' })
  } catch (err) {
    console.error('❌ 이벤트 생성 실패:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

// 📍이벤트 활성/비활성 토글
// ✅ 이벤트 활성/비활성 토글
exports.toggleEvent = async (req, res) => {
  const { id } = req.params

  try {
    // 1️⃣ 현재 이벤트 조회
    const [rows] = await db.execute('SELECT * FROM event_bonus WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' })

    const event = rows[0]
    const newStatus = event.is_active ? 0 : 1

    // 2️⃣ 활성화하려는 경우에만 중복 체크
    if (newStatus === 1) {
      const [overlaps] = await db.execute(
        `SELECT * FROM event_bonus
         WHERE is_active = 1
         AND id != ?
         AND (
           (? BETWEEN start_date AND end_date)
           OR (? BETWEEN start_date AND end_date)
           OR (start_date BETWEEN ? AND ?)
         )`,
        [id, event.start_date, event.end_date, event.start_date, event.end_date]
      )

      if (overlaps.length > 0) {
        return res.status(400).json({
          message: '⚠️ 이미 같은 기간의 활성 이벤트가 존재합니다.'
        })
      }
    }

    // 3️⃣ 상태 토글
    await db.execute('UPDATE event_bonus SET is_active = ? WHERE id = ?', [newStatus, id])
    res.json({ message: `Event ${newStatus ? 'activated' : 'deactivated'}` })
  } catch (err) {
    console.error('❌ toggleEvent error:', err)
    res.status(500).json({ message: 'Internal Server Error', error: err.message })
  }
}


// 📍이벤트 삭제
exports.deleteEvent = async (req, res) => {
  const { id } = req.params
  try {
    await db.query(`DELETE FROM event_bonus WHERE id = ?`, [id])
    res.status(200).json({ message: 'Event deleted' })
  } catch (err) {
    console.error('❌ 이벤트 삭제 실패:', err)
    res.status(500).json({ message: 'Server error' })
  }
}
