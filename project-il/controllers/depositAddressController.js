const jwt = require('jsonwebtoken');
const db = require('../db');
const bcrypt = require('bcrypt');

// 전체 주소 조회
exports.getAllDepositAddresses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM deposit_addresses ORDER BY id DESC')
    res.status(200).json(rows)
  } catch (err) {
    console.error('❌ [getAllDepositAddresses]', err)
    res.status(500).json({ error: 'Failed to fetch deposit addresses' })
  }
}

// 새 주소 등록 (같은 통화 있으면 update)
exports.createOrUpdateDepositAddress = async (req, res) => {
  const { currency, address } = req.body
  if (!currency || !address)
    return res.status(400).json({ error: 'currency and address are required' })

  try {
    const [existing] = await db.query('SELECT id FROM deposit_addresses WHERE currency = ?', [currency])
    if (existing.length > 0) {
      await db.query('UPDATE deposit_addresses SET address = ?, updated_at = NOW() WHERE currency = ?', [address, currency])
      return res.status(200).json({ message: 'Address updated successfully' })
    } else {
      await db.query('INSERT INTO deposit_addresses (currency, address) VALUES (?, ?)', [currency, address])
      return res.status(201).json({ message: 'Address created successfully' })
    }
  } catch (err) {
    console.error('❌ [createOrUpdateDepositAddress]', err)
    res.status(500).json({ error: 'Failed to create or update deposit address' })
  }
}


// 특정 ID 수정
exports.updateDepositAddress = async (req, res) => {
  const { id } = req.params
  const { currency, address } = req.body
  if (!id || !address)
    return res.status(400).json({ error: 'id and address are required' })

  try {
    await db.query(
      'UPDATE deposit_addresses SET currency = ?, address = ?, updated_at = NOW() WHERE id = ?',
      [currency, address, id]
    )
    res.status(200).json({ message: 'Address updated successfully' })
  } catch (err) {
    console.error('❌ [updateDepositAddress]', err)
    res.status(500).json({ error: 'Failed to update deposit address' })
  }
}