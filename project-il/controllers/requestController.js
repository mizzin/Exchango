const sendTelegramMessage = require('../utils/telegram')


exports.applyRequest = async (req, res) => {
  try {
    // 1. 신청 정보 DB 저장 (예시)
    // await db.query('INSERT INTO requests ...', [req.body.someField, ...])

    // 2. 텔레그램 알림 보내기 (원하는 정보로 메시지 구성)
    const msg = `새로운 신청이 도착했습니다!\n신청자: ${req.body.username || '알 수 없음'}\n신청 항목: ${req.body.item || 'N/A'}`
    await sendTelegramMessage(msg)

    // 3. 사용자에게 정상 응답
    res.json({ ok: true, message: "신청 완료!" })
  } catch (err) {
    // 에러 처리
    res.status(500).json({ ok: false, error: err.message })
  }
}
