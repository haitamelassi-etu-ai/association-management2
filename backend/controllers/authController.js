const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { getOrCreateDefaultAssociation } = require('../utils/associationHelper');
const { logAudit } = require('../utils/auditLogger');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role, telephone, poste, associationId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    let resolvedAssociationId = associationId;
    if (!resolvedAssociationId) {
      const defaultAssociation = await getOrCreateDefaultAssociation();
      resolvedAssociationId = defaultAssociation._id;
    }

    // Create user
    const user = await User.create({
      nom,
      prenom,
      email,
      password,
      role: role || 'staff',
      telephone,
      poste,
      association: resolvedAssociationId
    });

    const populatedUser = await User.findById(user._id).populate(
      'association',
      'name logoUrl address hasStock hasTransport isActive'
    );

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        association: populatedUser?.association || null,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', { email, passwordProvided: !!password });

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir email et mot de passe'
      });
    }

    // Check user
    const user = await User.findOne({ email })
      .select('+password')
      .populate('association', 'name logoUrl address hasStock hasTransport isActive');
    console.log('👤 User found:', !!user);
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User is not active:', email);
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password match:', isMatch);
    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    if (!user.association) {
      const defaultAssociation = await getOrCreateDefaultAssociation();
      await User.findByIdAndUpdate(user._id, { association: defaultAssociation._id });
      user.association = defaultAssociation;
    }

    const safeUser = await User.findById(user._id).populate(
      'association',
      'name logoUrl address hasStock hasTransport isActive'
    );

    console.log('✅ Login successful for:', email);
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        association: safeUser?.association || null,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'association',
      'name logoUrl address hasStock hasTransport isActive'
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change current user's password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      user: req.user,
      action: 'password_change',
      resource: 'user',
      resourceId: user._id,
      details: { operation: 'change_password' },
      req
    });

    res.json({
      success: true,
      message: 'Mot de passe change avec succes'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
