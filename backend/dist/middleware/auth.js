"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_1 = require("../config/constants");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.sendStatus(401);
        return;
    }
    jsonwebtoken_1.default.verify(token, constants_1.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        const user = decoded;
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            location: user.location
        };
        next();
    });
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map