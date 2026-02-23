"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = roleGuard;
function roleGuard(allowed) {
    return (req, res, next) => {
        //  Narrow req.user first
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}
