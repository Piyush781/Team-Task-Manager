const Task = require('../models/Task');
const Project = require('../models/Project');

const getDashboard = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let projectFilter = {};
    let taskProjectIds = null;

    if (!isAdmin) {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      taskProjectIds = userProjects.map(p => p._id);
      projectFilter = { members: req.user._id };
    }

    const totalProjects = await Project.countDocuments(projectFilter);

    const taskFilter = taskProjectIds ? { project: { $in: taskProjectIds } } : {};
    const totalTasks = await Task.countDocuments(taskFilter);

    const [todo, in_progress, done] = await Promise.all([
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: 'in_progress' }),
      Task.countDocuments({ ...taskFilter, status: 'done' })
    ]);

    const now = new Date();
    const overdueTasks = await Task.find({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $ne: 'done' }
    })
      .populate('project', 'name')
      .populate('assignee', 'name')
      .select('title dueDate project assignee')
      .limit(10);

    const myTasks = await Task.find({
      assignee: req.user._id
    })
      .populate('project', 'name')
      .select('title status priority dueDate project')
      .sort({ dueDate: 1 })
      .limit(10);

    const recentActivity = await Task.find(taskFilter)
      .populate('project', 'name')
      .populate('assignee', 'name')
      .select('title status priority updatedAt project assignee')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      totalProjects,
      totalTasks,
      tasksByStatus: { todo, in_progress, done },
      overdueTasks,
      myTasks,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getDashboard };