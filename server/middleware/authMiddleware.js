import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Token not found , Authorization faild...'
            })
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid User , Authorizarion faild' })
        }
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decoded; // controller me req.user.userId mill jayega isse 
        next();
    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired access token",
            success: false
        });
    }
}

export default authMiddleware;