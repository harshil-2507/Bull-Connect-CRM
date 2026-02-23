"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleGuard_1 = require("../middlewares/roleGuard");
const telecaller_controller_1 = require("../controllers/telecaller.controller");
const telecaller_controller_2 = require("../controllers/telecaller.controller");
const router = (0, express_1.Router)();
/**
 * TELECALLER only routes
 */
router.use((0, roleGuard_1.roleGuard)(["TELECALLER"]));
//order matters here - getNextLead should be before getWorkQueue, otherwise it will always return the whole queue instead of the next lead
router.get("/next", telecaller_controller_1.getNextLead);
router.get("/queue", telecaller_controller_2.getWorkQueue);
router.post("/call", telecaller_controller_1.logCall);
exports.default = router;
