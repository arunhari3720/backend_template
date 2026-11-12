
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
} = require("../../controllers/usercontroller/usercontroller");
const {
  verifyToken,
  verifyMaster,
} = require("../../middlewares/auth_middleware");


router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);

module.exports = router;
