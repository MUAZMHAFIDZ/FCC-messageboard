const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let testThreadId
  let testReplyId
  let testPass = 'pass'
  
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
    .post('/api/threads/test')
    .send({
      board: 'test',
      text: 'test Thread',
      delete_password: testPass
    })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      let createdThreadId = res.redirects[0].split('/')[res.redirects[0].split('/').length - 1]
      testThreadId = createdThreadId
      done()
    })
  })

  test('Post a reply: POST request to /api/replies/{board}', function(done){
    chai.request(server)
    .post('/api/replies/test')
    .send({
      thread_id: testThreadId,
      text: 'test reply',
      delete_password: testPass
    })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      let createdReplyId = res.redirects[0].split('=')[res.redirects[0].split('=').length - 1]
      testReplyId = createdReplyId
      done()
    })
  })
  
  test('Get Threads from a Board', function(done) {
    chai.request(server)
    .get('/api/threads/test')
    .send()
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.isArray(res.body)
      assert.isAtMost(res.body.length, 10)
      let firstThread = res.body[0]
      assert.isUndefined(firstThread.delete_password)
      assert.isAtMost(firstThread.replies.length, 3)
      done()
    })
  })


  test("Get Replies from a Thread", function(done){
    chai.request(server)
    .get('/api/replies/test')
    .query({thread_id: testThreadId})
    .send()
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.isUndefined(res.body.delete_password)
      assert.isArray(res.body.replies)
      done()
    })
  })


  test( 'Reporting a Thread', function(done){
    chai.request(server)
    .put('/api/threads/test')
    .send({
      thread_id: testThreadId
    })
    .end(function(err, res) {
      assert.equal(res.text, 'reported')
      done()
    })
  })

  test( 'Reporting a Reply', function(done){
    chai.request(server)
    .put('/api/replies/test')
    .send({
      thread_id: testThreadId,
      reply_id: testReplyId
    })
    .end(function(err, res) {
      assert.equal(res.text, 'reported')
      done()
    })
  })
  
  test('Deleting a Thread with incorrect password', function(done){
    chai.request(server)
    .delete('/api/threads/test')
    .send({
      thread_id: testThreadId,
      delete_password: 'wrong'
    })
    .end(function(err, res) {
      assert.equal(res.text, 'incorrect password')
      done()
    })
  })

  test('Delete a Reply with wrong password', function(done){
    chai.request(server)
    .delete('/api/replies/test')
    .send({
      thread_id: testThreadId,
      reply_id: testReplyId,
      delete_password: 'wrong'
    })
    .end(function(err, res) {
      assert.equal(res.text, 'incorrect password')
      done()
    })
  })

  test('Delete a Reply with right password', function(done){
    chai.request(server)
    .delete('/api/replies/test')
    .send({
      thread_id: testThreadId,
      reply_id: testReplyId,
      delete_password: testPass
    })
    .end(function(err, res) {
      assert.equal(res.text, 'success')
      done()
    })
  })

  test('Delete a Thread with correct password', function(done){
    chai.request(server)
    .delete('/api/threads/test')
    .send({
      thread_id: testThreadId,
      delete_password: testPass
    })
    .end(function(err, res) {
      assert.equal(res.status, 200);
      assert.equal(res.text, 'success')
      done()
    })
  })

  
});