const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { getUsers, updateRole, getAllUsersBasic } = require('../controllers/userController');

router.use(auth);

// Admin only — full user list
router.get('/', adminOnly, getUsers);

// All authenticated users — basic info only (for member dropdowns)
router.get('/basic', getAllUsersBasic);

router.put(
  '/:id/role',
  adminOnly,
  [body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')],
  validate,
  updateRole
);

module.exports = router;