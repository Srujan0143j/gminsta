import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import { uploadMedia } from '../config/cloudinary.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, fullname, email, password } = req.body;

    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, error: 'Email address already registered' });
    }

    const usernameExists = await User.findOne({ username: username.toLowerCase().trim() });
    if (usernameExists) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    let profilePicUrl = '/uploads/default-avatar.png';

    // Handle profile pic upload
    if (req.file) {
      const uploadResult = await uploadMedia(req.file, 'gminsta/avatars');
      if (uploadResult) {
        profilePicUrl = uploadResult.url;
      }
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      fullname,
      email: email.toLowerCase().trim(),
      password,
      profilePic: profilePicUrl,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        website: user.website,
        gender: user.gender,
        isPrivate: user.isPrivate,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email/username and password' });
    }

    const identifier = emailOrUsername.toLowerCase().trim();
    // Search user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, error: 'Your account has been banned.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        website: user.website,
        gender: user.gender,
        isPrivate: user.isPrivate,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user details (using token)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, error: 'There is no user with that email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host').includes('localhost') ? 'localhost:5173' : req.get('host')}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'GMinsta Password Reset Request',
        message,
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested a password reset on GMinsta. Click the link below to set a new password:</p>
          <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #0095f6; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p>If the button doesn't work, copy-paste this URL into your browser:</p>
          <p>${resetUrl}</p>
          <br/>
          <p>This link is valid for 10 minutes only.</p>
        `,
      });

      res.status(200).json({ success: true, data: 'Email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Hash token sent in params
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Set new password (will be hashed automatically in pre-save)
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/changepassword
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please enter current and new passwords' });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
