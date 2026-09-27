import bcrypt from 'bcrypt';
import User from '../models/user.js';
import jwt from 'jsonwebtoken'
import Refreshtoken from '../models/RefreshToken.js';
import OTP from '../models/OTP.js';
import nodemailer from 'nodemailer';


// Creating Email Transporter yaha bata rahe hai ki is email se email bhejna hai to nodemailer email create kr dega is email se bhejne ke liye

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// Regidter/signup user 
const register = async (req, res) => {

    try {
        const { name, username, email, password } = req.body;
        const user = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (user) {
            return res.status(409).json({
                message: 'User already exist, Please try to login..',
                success: false
            });
        }

        const newUser = new User({
            name,
            username,
            email
        });

        newUser.password = await bcrypt.hash(password, 10);
        await newUser.save();
        console.log("1. USER SAVED new user"); // user saved to database 

        // Otp generation for email verification

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashOtp = await bcrypt.hash(otp, 10); // hashing otp 
        // save otp in database
        const newOtp = new OTP({
            userId: newUser._id,
            otp: hashOtp,
            purpose: 'email_verification',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)

        });

        await newOtp.save();
        console.log("1. USER SAVED after otp");

        //Email pe otp bhejne ke liye 
        console.log("OTP SAVED:", otp);
        console.log("EMAIL USER:", process.env.EMAIL_USER);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP is ${otp}. It will expire in 10 minutea.`
        })

        console.log("EMAIL SENT");

        res.status(201).json({ message: ' Registered Successfully.....', success: true })
    } catch (error) {
        console.log("Register", error);
        res.status(500).json({ message: 'Internal Server Error', success: false });
    }

};

// Verify Otp 

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const storedOtp = await OTP.findOne({
            userId: user._id,
            purpose: "email_verification"

        });

        if (!storedOtp) {
            return res.status(404).json({
                message: 'Incorrect OTP',
                success: false
            });
        };
        // Checking that otp expirre to nahi hai n
        if (storedOtp.expiresAt < new Date()) {
            return res.status(404).json({
                message: 'OTP expired',
                success: false
            });
        };
        // user ne jo otp enter kiya hai wo and jo otp generate hua tha wo correct hai ya nahi check kr rahe hai
        const isOtpCorrect = await bcrypt.compare(otp, storedOtp.otp);

        if (!isOtpCorrect) {
            return res.status(404).json({
                message: 'OTP not matche , try again..',
                success: false
            })
        };
        //checking ki user verified ho gaya hai ya nahi ho gaya to save karo and otp ko delete kr raha hu
        user.isVerified = true;
        await user.save();
        // Delete OTP from User database 
        await OTP.findByIdAndDelete(storedOtp._id);

        res.status(200).json({
            message: 'OTP verified.',
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error'
        })
    }
}

//Login user
const loginUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await User.findOne({
            $or: [{ email }, { username }]
        });
        if (!user) {
            return res.status(403).json({
                message: 'User not found , Try to Register..... ',
                success: false
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(402).json({
                message: 'Incorrect Password!. Please Enter a correct password...',
                success: false
            })
        }

        const accessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_REFRESH_SECRET,

            {
                expiresIn: '7d'
            }
        );

        const newRefreshToken = new Refreshtoken({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await newRefreshToken.save();

        res.status(200).json({
            message: 'Login successfull...',
            success: true,
            accessToken,
            refreshToken,
            user: {
                name: user.name,
                role: user.role,
                email: user.email
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Internal Server error', success: false })
    }
}

// Verify Refreshtoken and Assign new Token 
const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const storedToken = await Refreshtoken.findOne({ token: refreshToken });
        if (!storedToken) {
            return res.status(403).json({
                message: "Refresh token not found",
                success: false
            });
        };

        if (storedToken.expiresAt < new Date()) {
            return res.status(403).json({
                message: "Refresh token expired",
                success: false
            });
        }



        const newAccessToken = jwt.sign(
            {
                userId: decoded.userId
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );
        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        })

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token",
            success: false
        });
    }
}

//Creating me agar browser refresh ho jata hai to uske baad Abhi kaunsa user logged in hai? pata krne ke liye 
//Kahne ka mtlb hai ki jb browser refresh hota hai to ye batane ke liye getme bana rahe hai ki konsa user login tha refresh se pahele
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found!',
                success: false
            })
        };

        res.status(200).json({
            success: true,
            user
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

// Logout function

const logOut = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const deleteToken = await Refreshtoken.findOneAndDelete({ token: refreshToken });

        if (!deleteToken) {
            return res.status(404).json({
                message: 'Invalid Token...',
                success: false
            })
        };

        res.status(200).json({
            message: 'Logout Successfully...',
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
}


export { register, verifyOtp, loginUser, refreshAccessToken, getMe, logOut }
