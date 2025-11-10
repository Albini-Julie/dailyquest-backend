const Quest = require('../models/Quest');
const User = require('../models/User');

// Créer une quête
exports.createQuest = async (req, res) => {
  try {
    const { title, description, points } = req.body;
    const quest = await Quest.create({
      title,
      description,
      points: points || 10,
      creator: req.user._id,
    });
    res.status(201).json(quest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer toutes les quêtes
exports.getAllQuests = async (req, res) => {
  try {
    const quests = await Quest.find().populate('creator', 'username');
    res.json(quests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer une quête par ID
exports.getQuestById = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id).populate('creator', 'username');
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    res.json(quest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une quête
exports.updateQuest = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    // Seul le créateur peut modifier
    if (!quest.creator.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(quest, req.body);
    await quest.save();
    res.json(quest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer une quête
exports.deleteQuest = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    if (!quest.creator.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await quest.deleteOne();
    res.json({ message: 'Quest deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Valider une quête (emoji / pouce)
exports.validateQuest = async (req, res) => {
  try {
    const quest = await Quest.findById(req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    // Empêcher un utilisateur de valider deux fois
    if (quest.validations.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already validated' });
    }

    quest.validations.push(req.user._id);

    // Si validations >= 5, on marque la quête comme complétée et on ajoute les points
    if (quest.validations.length >= 5 && quest.status !== 'completed') {
      quest.status = 'completed';
      const creator = await User.findById(quest.creator);
      creator.points += quest.points;
      await creator.save();
    }

    await quest.save();
    res.json(quest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
