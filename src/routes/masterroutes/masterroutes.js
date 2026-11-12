
const express = require("express");
const router = express.Router();

const {
  masterRegister,
  masterLogin,
  getAllUsers,
} = require("../../controllers/mastercontroller/mastercontroller");

const {
  verifyToken,
  verifyMaster,
} = require("../../middlewares/auth_middleware");

// Public routes
router.post("/register", masterRegister);
router.post("/login", masterLogin);

// Protected routes
router.get(
  "/users",
  verifyToken,
  verifyMaster,
  getAllUsers
);

module.exports = router;
