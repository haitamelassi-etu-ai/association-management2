const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

// Update current user's profile
router.patch('/profile', async (req, res) => {
  try {
    const { nom, prenom, email, telephone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    if (email !== undefined) user.email = email;
    if (telephone !== undefined) user.telephone = telephone;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('association', 'name hasStock hasTransport isActive');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update current user's preferences
router.patch('/preferences', async (req, res) => {
  try {
    const updates = req.body || {};
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const current = user.preferences || {};
    user.preferences = {
      ...current,
      ...updates,
      notifications: {
        ...(current.notifications || {}),
        ...(updates.notifications || {})
      }
    };

    await user.save();

    res.json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('association', 'name hasStock hasTransport isActive');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('association', 'name hasStock hasTransport isActive');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { nom, prenom, email, password, role, telephone, poste, shift, status, isWorking, isActive, association } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Update fields
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email;
    if (telephone) user.telephone = telephone;
    if (poste) user.poste = poste;
    if (shift) user.shift = shift;
    if (status) user.status = status;
    if (role) user.role = role;
    if (association) user.association = association;
    if (typeof isWorking !== 'undefined') user.isWorking = isWorking;
    if (typeof isActive !== 'undefined') user.isActive = isActive;
    
    // Update password if provided
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('association', 'name hasStock hasTransport isActive');
    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
