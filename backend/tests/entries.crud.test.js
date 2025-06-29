const request = require('supertest');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Đảm bảo server đã chạy trước khi test
const BASE_URL = 'http://localhost:3000';

describe('CRUD API /entries (SQLite)', () => {
  const testEntry = {
    entry_id: 'test123',
    account_debit: '1001',
    account_credit: '4001',
    amount: 9999,
    currency: 'USD',
    timestamp: '2025-06-29T12:00:00Z'
  };

  afterAll((done) => {
    // Xóa test entry khỏi DB sau khi test
    const db = new sqlite3.Database(path.join(__dirname, '../data/ledger.db'));
    db.run('DELETE FROM entries WHERE entry_id = ?', [testEntry.entry_id], () => db.close(done));
  });

  it('POST /entries - tạo entry mới', async () => {
    const res = await request(BASE_URL)
      .post('/entries')
      .send(testEntry)
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(testEntry.entry_id);
  });

  it('GET /entries/:id - lấy entry vừa tạo', async () => {
    const res = await request(BASE_URL).get(`/entries/${testEntry.entry_id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.entry_id).toBe(testEntry.entry_id);
  });

  it('PUT /entries/:id - cập nhật entry', async () => {
    const res = await request(BASE_URL)
      .put(`/entries/${testEntry.entry_id}`)
      .send({ ...testEntry, amount: 8888 })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /entries/:id - kiểm tra entry đã cập nhật', async () => {
    const res = await request(BASE_URL).get(`/entries/${testEntry.entry_id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.amount).toBe(8888);
  });

  it('DELETE /entries/:id - xóa entry', async () => {
    const res = await request(BASE_URL).delete(`/entries/${testEntry.entry_id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /entries/:id - entry đã bị xóa', async () => {
    const res = await request(BASE_URL).get(`/entries/${testEntry.entry_id}`);
    expect(res.statusCode).toBe(404);
  });
});
