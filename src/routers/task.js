const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();
const sharp = require('sharp');
const multer = require('multer');

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?orderBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.orderBy) {
    const parts = req.query.orderBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const _id = req.params.id;
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(204).send(task);
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['completed', 'description'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    if (!task) {
      return res.status(204).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!task) {
      return res.status(204).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Task Image APIs
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Upload an image please'));
    }

    cb(undefined, true);
  },
});

router.post('/tasks/:id/image', auth, upload.single('image'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    return res.status(204).send();
  }

  try {
    task.image = buffer;
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/tasks/:id/image', auth, async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    return res.status(204).send();
  }

  task.image = undefined;
  await task.save();
  res.send();
});

router.get('/tasks/:id/image', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task || !task.image) {
      return res.status(204).send();
    }

    res.set('Content-Type', 'image/png');
    res.send(task.image);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
