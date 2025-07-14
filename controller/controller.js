require('dotenv').config()
const users = require("../schema/userSchema")
const Folder = require("../schema/folderSchema")
const Bookmark = require("../schema/bookmarkSchema")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const { Resend } = require("resend");



// Optional: Function to generate userId (auto-increment style)
const generateUserId = async () => {
  const lastUser = await users.findOne().sort({ userId: -1 });
  return lastUser ? lastUser.userId : 1000; // Start from 1000
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // ✅ Correct usage of users (Mongoose model)
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(406).json({ message: "Account already exists" });
    }

    const newUserId = await generateUserId() + 1;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new users({
      userId: newUserId,
      name,
      email,
      address: "",
      contact: "",
      location: "",
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully", newUser });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      return res.status(400).json("User not found");
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(400).json("Invalid credentials");
    }

    const secretKey = process.env.JWT_SECRET;

    // ✅ Add userId to token
    const token = jwt.sign(
      { userId: existingUser.userId, email: existingUser.email },
      secretKey,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ userDetails: existingUser, token });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = await users.findOne({ userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User found", data: user }); // ✅ Wrap in `data`
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

exports.editUser = async (req, res) => {
  try {

    const userId = Number(req.params.userId);
    // console.log("Updating user with ID:", userId, "Request Body:", req.body);

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const existingUser = await users.findOne({ userId });

    if (!existingUser) {
      console.error("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {
      ...(imageUrl ? { Image: imageUrl } : {}),
      name: req.body.name,
      address: req.body.address,
      location: req.body.location,
      contact: req.body.contact,
    };

    const updatedUser = await users.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      console.error("Database update failed for user:", userId);
      return res.status(500).json({ message: "Error updating profile" });
    }

    // console.log("Updated User:", updatedUser);
    return res.status(200).json({ message: "Profile updated successfully!", data: updatedUser });

  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("email:", email);

    const user = await users.findOne({ email });
    console.log("user:", user);

    // Always send same response to avoid exposing valid emails
    res.status(200).send('If user exists, email will be sent.');

    if (!user) return; // Stop if no user found

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Save hashed token and expiry to DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `http://localhost:5173/resetPassword/${token}`;

    // Send email
    const resend = new Resend('re_SUEcK81p_8KMG2sSe8MbLUxtpB9DXp1GS');
    try {

      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset Password',
        html: `<p>This is the link to reset your password:<br/><a href="${resetLink}">${resetLink}</a></p>`
      });
      console.log("data:", data);
      console.log("error:", error)
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Optionally: log or alert admin
    }

  } catch (error) {
    console.error("Forgot password failed:", error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params; // Token from URL
  const { password } = req.body; // New password from the request body

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await users.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and remove reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// in controller.js
const generateBookmarkId = async () => {
  const last = await Bookmark.findOne().sort({ bookmarkId: -1 });
  return last ? last.bookmarkId + 1 : 1000;
};
exports.getBookmarkById = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const userId = req.userId;

    const bookmark = await Bookmark.findOne({
      bookmarkId: Number(bookmarkId),
      userId,
    });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.status(200).json({ bookmark });
  } catch (error) {
    console.error("Get bookmark error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.createBookmark = async (req, res) => {
  try {
    const { title, url, description, folderId, thumbnail } = req.body;
    const userId = req.userId;

    // ✅ Debug logs
    console.log("userId from token:", userId);
    console.log("Received data:", req.body);

    if (!title || !url || !folderId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bookmarkId = await generateBookmarkId();

    const newBookmark = new Bookmark({
      bookmarkId,
      title,
      url,
      description,
      folderId,
      userId,
      thumbnail,
    });

    await newBookmark.save();

    return res.status(201).json({ message: "Bookmark created", bookmark: newBookmark });
  } catch (err) {
    console.error("Bookmark creation error:", err);
    return res.status(500).json({ message: "Failed to create bookmark", error: err.message });
  }
};
exports.editBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;
    const userId = req.userId; // from JWT middleware
    const { title, url, description, thumbnail, folderId } = req.body;

    if (!title || !url || !folderId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { bookmarkId: Number(bookmarkId), userId },
      {
        $set: {
          title,
          url,
          description,
          thumbnail,
          folderId,
        },
      },
      { new: true }
    );

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found or unauthorized" });
    }

    res.status(200).json({ message: "Bookmark updated successfully", bookmark });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};





const generateFolderId = async () => {
  const lastFolder = await Folder.findOne().sort({ folderId: -1 });
  return lastFolder ? lastFolder.folderId + 1 : 1000;
};

exports.createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId; // 🟢 Comes from JWT

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folderId = await generateFolderId();

    const newFolder = new Folder({
      folderId,
      name,
      userId,
    });

    await newFolder.save();

    return res.status(201).json({
      message: "Folder created successfully",
      folder: newFolder,
    });
  } catch (error) {
    console.error("Folder creation error:", error);
    return res.status(500).json({
      message: "Failed to create folder",
      error,
    });
  }
};


exports.getFolderList = async (req, res) => {
  try {
    const userId = req.userId; // 🟢 From JWT

    const folders = await Folder.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Folders fetched successfully",
      folders,
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return res.status(500).json({
      message: "Failed to fetch folders",
      error: error.message,
    });
  }
};
exports.getBookmarksByFolderId = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;

    const bookmarks = await Bookmark.find({ folderId, userId }).sort({ createdAt: -1 });
    return res.status(200).json({ bookmarks });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch bookmarks", error: err.message });
  }
};
