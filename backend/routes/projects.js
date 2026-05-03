const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');

router.use(auth);

router.get('/', getProjects);
router.post('/', [body('name').trim().notEmpty().withMessage('Project name is required')], validate, createProject);
router.get('/:id', getProject);
router.put('/:id', [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')], validate, updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', [body('userId').notEmpty().withMessage('userId is required')], validate, addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;