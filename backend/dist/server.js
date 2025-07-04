"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = require("dotenv");
const auth_1 = __importDefault(require("./routes/auth"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const shifts_1 = __importDefault(require("./routes/shifts"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.text({ limit: '50mb' }));
app.use('/api', auth_1.default);
app.use('/api/transactions', transactions_1.default);
app.use('/api/shifts', shifts_1.default);
app.get('/api/hello', (req, res) => {
    res.json({
        message: 'Co404 Finance API with TypeScript is running! 🚀',
        version: '2.0.0-typescript',
        timestamp: new Date().toISOString(),
        routes: [
            'POST /api/login',
            'GET /api/me',
            'GET /api/transactions',
            'POST /api/transactions',
            'POST /api/shifts/start',
            'GET /api/shifts/active',
            'POST /api/shifts/end'
        ]
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Co404 Finance Server (TypeScript) running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/hello`);
    console.log(`🔐 Available endpoints:`);
    console.log(`   POST /api/login`);
    console.log(`   GET  /api/me`);
    console.log(`   GET  /api/transactions`);
    console.log(`   POST /api/transactions`);
    console.log(`   POST /api/shifts/start`);
    console.log(`   GET  /api/shifts/active`);
    console.log(`   POST /api/shifts/end`);
});
exports.default = app;
//# sourceMappingURL=server.js.map