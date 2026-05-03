const Project = require('../models/Project');
const Task = require('../models/Task');

const getProjects = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { members: req.user._id };
    }
    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    const projectsWithCount = await Promise.all(
      projects.map(async (p) => {
        const taskCount = await Task.countDocuments({ project: p._id });
        return { ...p.toJSON(), taskCount };
      })
    );
    res.json(projectsWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id]
    });
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    res.status(201).json({ ...project.toJSON(), taskCount: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.user.role !== 'admin' && !project.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const taskCount = await Task.countDocuments({ project: project._id });
    res.json({ ...project.toJSON(), taskCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'Only admin or project owner can update' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    const taskCount = await Task.countDocuments({ project: project._id });
    res.json({ ...project.toJSON(), taskCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project and all tasks deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'Only admin or owner can add members' });
    }

    const { userId } = req.body;
    if (project.members.map(m => m.toString()).includes(userId)) {
      return res.status(400).json({ error: 'User is already a member' });
    }
    project.members.push(userId);
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    const taskCount = await Task.countDocuments({ project: project._id });
    res.json({ ...project.toJSON(), taskCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'Only admin or owner can remove members' });
    }

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    const taskCount = await Task.countDocuments({ project: project._id });
    res.json({ ...project.toJSON(), taskCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };