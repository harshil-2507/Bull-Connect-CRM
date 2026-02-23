"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const roleGuard_1 = require("../middlewares/roleGuard");
const campaign_controller_1 = require("../controllers/campaign.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB
    },
});
router.use((0, roleGuard_1.roleGuard)(["ADMIN", "MANAGER"]));
router.post("/", campaign_controller_1.createCampaign);
router.get("/", campaign_controller_1.getAllCampaigns);
router.get("/stats", campaign_controller_1.getAllCampaignStats);
router.get("/:id/pipeline", campaign_controller_1.getCampaignPipeline);
router.get("/:id/stats", campaign_controller_1.getCampaignStatsById);
router.get("/:id/leads", campaign_controller_1.getCampaignLeads);
router.get("/:id", campaign_controller_1.getCampaignById);
router.patch("/:id/toggle", campaign_controller_1.toggleCampaign);
router.post("/:id/upload", upload.single("file"), campaign_controller_1.uploadCampaignCsv);
router.post("/:id/assign", campaign_controller_1.bulkAssignCampaignLeads);
exports.default = router;
