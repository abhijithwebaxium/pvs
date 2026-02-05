import express from 'express';
import { signup, login, logout, getMe } from '../controllers/authController.js';
import { ldapLogin, testLdapConnection } from '../controllers/ldapAuthController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Regular authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// LDAP authentication routes
router.post('/ldap/login', ldapLogin);
router.get('/ldap/test', testLdapConnection); // Remove or protect this in production

export default router;
