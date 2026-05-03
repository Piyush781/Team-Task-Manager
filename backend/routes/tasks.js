const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const {
  getTasks, createTask, getTask, updateTask, deleteTask
} = require('../controllers/taskController');

router.use(auth);

router.get('/', getTasks);
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
    body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format')
  ],
  validate,
  createTask
);
router.get('/:id', getTask);
router.put(
  '/:id',
  [
    body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format')
  ],
  validate,
  updateTask
);
router.delete('/:id', deleteTask);

module.exports = router;