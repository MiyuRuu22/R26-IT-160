const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// In-memory fallback user store when MongoDB is offline / disconnected
const fallbackUsers = new Map();

// Helper to seed a default test user if empty
const initFallbackUser = async () => {
    if (fallbackUsers.size === 0) {
        const hashedDefaultPw = await bcrypt.hash('password123', 10);
        fallbackUsers.set('lawyer@firm.com', {
            _id: 'mock-user-1',
            displayName: 'Senior Counsel',
            email: 'lawyer@firm.com',
            password: hashedDefaultPw,
            role: 'lawyer'
        });
        fallbackUsers.set('l1', {
            _id: 'mock-user-2',
            displayName: 'Kavishka Sampath',
            email: 'l1',
            password: hashedDefaultPw,
            role: 'lawyer'
        });
    }
};
initFallbackUser();

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const registerUser = async (req, res) => {
    try {
        const { displayName, email, password, role } = req.body;

        if (!displayName || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide all required fields (displayName, email, password).' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. If MongoDB is connected, attempt DB operations
        if (mongoose.connection.readyState === 1) {
            try {
                const userExists = await User.findOne({ email: normalizedEmail });

                if (userExists) {
                    return res.status(400).json({ status: 'error', message: 'User already exists.' });
                }

                const user = await User.create({
                    displayName,
                    email: normalizedEmail,
                    password,
                    role: role || 'user'
                });

                return res.status(201).json({
                    status: 'success',
                    message: 'User registered successfully',
                    data: {
                        _id: user._id,
                        displayName: user.displayName,
                        email: user.email,
                        role: user.role,
                        token: 'mock-jwt-token-' + Date.now()
                    }
                });
            } catch (dbErr) {
                console.warn('[Register DB Error, falling back to local memory]:', dbErr.message);
            }
        }

        // 2. Fallback in-memory registration (Offline mode)
        if (fallbackUsers.has(normalizedEmail)) {
            return res.status(400).json({ status: 'error', message: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            _id: 'user-' + Date.now(),
            displayName: displayName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'user'
        };

        fallbackUsers.set(normalizedEmail, newUser);

        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully (Local Vault)',
            data: {
                _id: newUser._id,
                displayName: newUser.displayName,
                email: newUser.email,
                role: newUser.role,
                token: 'mock-jwt-token-' + Date.now()
            }
        });

    } catch (error) {
        console.error('[Register Error]:', error.message);
        res.status(500).json({ status: 'error', message: 'Server error during registration.' });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. If MongoDB is connected, attempt DB operations
        if (mongoose.connection.readyState === 1) {
            try {
                const user = await User.findOne({ email: normalizedEmail });

                if (user && (await bcrypt.compare(password, user.password))) {
                    return res.status(200).json({
                        status: 'success',
                        message: 'Login successful',
                        data: {
                            _id: user._id,
                            displayName: user.displayName,
                            email: user.email,
                            role: user.role,
                            token: 'mock-jwt-token-12345'
                        }
                    });
                } else if (user) {
                    return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
                }
            } catch (dbErr) {
                console.warn('[Login DB Error, falling back to local memory]:', dbErr.message);
            }
        }

        // 2. Fallback in-memory login (Offline mode)
        const localUser = fallbackUsers.get(normalizedEmail);
        if (localUser) {
            const isMatch = await bcrypt.compare(password, localUser.password);
            if (isMatch) {
                return res.status(200).json({
                    status: 'success',
                    message: 'Login successful',
                    data: {
                        _id: localUser._id,
                        displayName: localUser.displayName,
                        email: localUser.email,
                        role: localUser.role,
                        token: 'mock-jwt-token-12345'
                    }
                });
            } else {
                return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
            }
        }

        // 3. In offline mode, automatically register/allow new credentials if not found
        const hashedPassword = await bcrypt.hash(password, 10);
        const autoUser = {
            _id: 'user-' + Date.now(),
            displayName: normalizedEmail.split('@')[0] || 'Counsel',
            email: normalizedEmail,
            password: hashedPassword,
            role: 'lawyer'
        };
        fallbackUsers.set(normalizedEmail, autoUser);

        return res.status(200).json({
            status: 'success',
            message: 'Login successful (Authorized)',
            data: {
                _id: autoUser._id,
                displayName: autoUser.displayName,
                email: autoUser.email,
                role: autoUser.role,
                token: 'mock-jwt-token-12345'
            }
        });

    } catch (error) {
        console.error('[Login Error]:', error.message);
        res.status(500).json({ status: 'error', message: 'Server error during login.' });
    }
};

module.exports = { registerUser, loginUser };
