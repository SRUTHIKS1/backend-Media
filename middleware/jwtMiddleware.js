const jwt = require('jsonwebtoken');

const jwtMiddleware = (req, res, next) => {

    console.log("inside jwtMiddleware");
console.log(req);

    // Extracting the JWT from the Authorization header

const token = req.headers['authorization'] && req.headers['authorization'].split(" ")[1].replace(/^"|"$/g, '');
    console.log("Received token:", token);

    try {
        // Verifying the JWT using the secret key
        const  secretKey = process.env.JWT_SECRET
        const jwtResponse = jwt.verify(token, secretKey);

        req.payload =jwtResponse.email;
        console.log("email:",req.payload)

        
        next();
    } catch (error) {
        console.log(error);
        if (error.name === 'TokenExpiredError') {
            // Responding with a 401 Unauthorized status if the token has expired
            res.status(401).json("Authorization failed, token has expired");
        } else if (error.name === 'JsonWebTokenError') {
            // Responding with a 401 Unauthorized status for other JWT-related errors
            res.status(401).json("Authorization failed, invalid token");
        } else {
            // Responding with a generic 500 Internal Server Error for other unexpected errors
            res.status(500).json("Internal Server Error");
        }
    }
};

module.exports = jwtMiddleware;