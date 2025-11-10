const express = require('express');
const {
  createQuest,
  getAllQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
  validateQuest,
} = require('../controllers/questController');
const auth = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes CRUD
router.get('/', getAllQuests);
router.get('/:id', getQuestById);
router.post('/', auth, createQuest);
router.put('/:id', auth, updateQuest);
router.delete('/:id', auth, deleteQuest);

// Validation par la communauté
router.post('/:id/validate', auth, validateQuest);

module.exports = router;
