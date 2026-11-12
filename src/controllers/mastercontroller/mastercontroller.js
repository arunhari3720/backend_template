
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// MASTER REGISTER
exports.masterRegister = async (req, res) => {
  try {
    const { name, email, phoneNo, password, setupSecret } = req.body;

    if (!name || !email || !password || !setupSecret) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Verify master setup secret
    if (setupSecret !== process.env.MASTER_REGISTER_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid registration permission",
      });
    }

    // Allow only initial master creation through this endpoint
    const masterExists = await User.exists({ userType: "master" });

    if (masterExists) {
      return res.status(403).json({
        success: false,
        message: "Master account already exists",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const master = await User.create({
      name,
      email,
      phoneNo: phoneNo || null,
      password: hashedPassword,
      provider: "email",
      userType: "master",
    });

    return res.status(201).json({
      success: true,
      message: "Master registered successfully",
      master: {
        id: master._id,
        name: master.name,
        email: master.email,
        userType: master.userType,
      },
    });

  } catch (error) {
    console.error("Master Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Master registration failed",
    });
  }
};


// MASTER LOGIN
exports.masterLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const master = await User.findOne({
      email: email.toLowerCase(),
      userType: "master",
    }).select("+password");

    if (!master || !master.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid master credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      master.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid master credentials",
      });
    }

    const token = jwt.sign(
      {
        id: master._id,
        email: master.email,
        userType: "master",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Master login successful",
      token,
      master: {
        id: master._id,
        name: master.name,
        email: master.email,
        phoneNo: master.phoneNo,
        userType: master.userType,
      },
    });

  } catch (error) {
    console.error("Master Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Master login failed",
    });
  }
};


// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
      userType: { $ne: "master" },
    };

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password -googleId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });

  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};
