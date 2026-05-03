const Task = require('../models/Task');
const Project = require('../models/Project');

const getTasks = async (req, res) => {
  try {
    const { projectId, assigneeId, status, priority, overdue, search } = req.query;
    let filter = {};

    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      filter.project = { $in: projectIds };
    }

    if (projectId) filter.project = projectId;
    if (assigneeId) filter.assignee = assigneeId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project, assignee } = req.body;

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const isMember = proj.members.map(m => m.toString()).includes(req.user._id.toString());
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    const task = await Task.create({
      title, description, status, priority,
      dueDate: dueDate || null,
      project, assignee: assignee || null,
      createdBy: req.user._id
    });

    await task.populate('project', 'name');
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name owner members')
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = task.project.owner.toString() === req.user._id.toString();
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner && !isAssignee && !isCreator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (isAssignee && !isAdmin && !isOwner && !isCreator) {
      task.status = req.body.status || task.status;
    } else {
      const { title, description, status, priority, dueDate, assignee } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (assignee !== undefined) task.assignee = assignee || null;
    }

    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.user.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = task.project.owner.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator && !isProjectOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };