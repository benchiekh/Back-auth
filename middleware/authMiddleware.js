const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log('Received token:', token); // Ajoutez ce log pour vérifier le token reçu
    if (!token) return res.status(401).json({ msg: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded); // Ajoutez ce log pour vérifier le contenu décodé du token
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};


module.exports = authMiddleware;
