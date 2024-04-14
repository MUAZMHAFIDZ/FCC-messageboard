'use strict';

const mongodb = require('mongodb');
const mongoose = require('mongoose');

module.exports = function(app) {

  mongoose.connect(process.env.DB)

  const replySchema = new mongoose.Schema({
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    created_on: { type: Date, required: true },
    reported: { type: Boolean, required: true }
  })

  const threadSchema = new mongoose.Schema({
    text: { type: String, required: true },
    delete_password: { type: String, required: true },
    board: { type: String, required: true },
    created_on: { type: Date, required: true },
    bumped_on: { type: Date, required: true },
    reported: { type: Boolean, required: true },
    replies: [replySchema]
  })

  const Reply = mongoose.model('Reply', replySchema)
  const Thread = mongoose.model('Thread', threadSchema)

  app.post('/api/threads/:board', async (req, res) => {
    let newThread = new Thread(req.body)
    if (!newThread.board || newThread.board === '') {
      newThread.board = req.params.board
    }
    newThread.created_on = new Date().toUTCString()
    newThread.bumped_on = new Date().toUTCString()
    newThread.reported = false
    newThread.replies = []
    let savedThread = await newThread.save()
    try {
      if (savedThread) {
        return res.redirect('/b/' + savedThread.board + '/' + savedThread.id)
      }
    } catch (err) {
      console.log(err)
    }
  })

  app.post('/api/replies/:board', async (req, res) => {
    let newReply = new Reply(req.body)
    newReply.created_on = new Date().toUTCString()
    newReply.reported = false
    let updatedThread = await Thread.findByIdAndUpdate(
      req.body.thread_id,
      { $push: { replies: newReply }, bumped_on: new Date().toUTCString() },
      { new: true }
    )
    try {
      if (updatedThread) {
        return res.redirect('/b/' + updatedThread.board + '/' + updatedThread.id + '?new_reply_id=' + newReply.id)
      }
    } catch (err) {
      console.log(err)
    }
  })

  app.get('/api/threads/:board', async (req, res) => {

    let threads = await Thread.find({ board: req.params.board })
      .sort({ bumped_on: 'desc' })
      .limit(10)
      .select('-delete_password -reported')
      .lean()
      .exec()
    try {
      if (threads) {
        threads.forEach((thread) => {
          thread['replycount'] = thread.replies.length
          thread.replies.sort((thread1, thread2) => {
            return (thread2.created_on - thread1.created_on)
          })
          thread.replies = thread.replies.slice(0, 3)

          thread.replies.forEach((reply) => {
            reply.delete_password = undefined
            reply.reported = undefined
          })
        })
        return res.json(threads)
      }
    } catch (err) {
      console.log(err)
    }
  })

  app.get('/api/replies/:board', async (req, res) => {
    let thread = await Thread.findById(req.query.thread_id)
    try {
      if (thread) {
        thread.delete_password = undefined
        thread.reported = undefined

        thread['replycount'] = thread.replies.length
        thread.replies.sort((thread1, thread2) => {
          return (thread2.created_on - thread1.created_on)
        })

        thread.replies.forEach((reply) => {
          reply.delete_password = undefined
          reply.reported = undefined
        })
        return res.json(thread)
      }
    } catch (err) {
      console.log(err)
    }
  })

  app.delete('/api/threads/:board', async (req, res) => {
    let thread = await Thread.findById(req.body.thread_id)
    if (thread) {
      if (thread.delete_password === req.body.delete_password) {
        await Thread.findByIdAndDelete(req.body.thread_id)
        return res.send('success')
      } else {
        return res.send('incorrect password')
      }
    } else {
      return res.send('thread not found')
    }
  })

  app.delete('/api/replies/:board', async (req, res) => {
    let thread = await Thread.findById(req.body.thread_id)

    if (thread) {
      let reply = thread.replies.find((reply) => {
        return reply.id === req.body.reply_id
      })
      if (reply.delete_password === req.body.delete_password) {
        reply.text = '[deleted]'
      } else {
        return res.send('incorrect password')
      }
      let updatedThread = await thread.save()
      if (updatedThread) {
        return res.send('success')
      }
    } else {
      return res.send('Thread not found')
    }
  })

  app.put('/api/threads/:board', async (req, res) => {
    let thread = await Thread.findByIdAndUpdate(
      req.body.thread_id,
      { reported: true },
      { new: true })
      if (thread) {
        return res.send('reported')
      }
  })

  app.put('/api/replies/:board', async (req, res) => {
    let thread = await Thread.findById(req.body.thread_id)
    if (thread) {
      let reply = thread.replies.find((reply) => {
        return reply.id === req.body.reply_id
      })
      reply.reported = true
      let updatedThread = await thread.save()
      if (updatedThread) {
        return res.send('reported')
      }
    }
  })

  // app.route('/api/threads/:board');
  // app.route('/api/replies/:board');

};