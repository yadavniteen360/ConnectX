import express from 'express';
import { register,verifyOtp, loginUser, refreshAccessToken , getMe, logOut } from '../controllers/authController.js'
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register',register);
router.post('/verify-otp',verifyOtp);
router.post('/login',loginUser);
router.post('/refreshToken',refreshAccessToken);
router.post('/logout',logOut);
router.post('/me',authMiddleware,getMe);

export default router;