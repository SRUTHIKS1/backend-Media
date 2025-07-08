require('dotenv').config()
const users=require("../schema/userSchema")
const bcrypt=require("bcrypt")
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
  const user = req.body
  const { email, password } = user
  //console.log(user)//
  try {
    const existingUser = await users.findOne({ email: email })
    console.log(existingUser)//
    if (!existingUser) {
      return res.status(400).json("user not found")
    }
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
      return res.status(400).json("invalid")
    }
    const secretKey = process.env.JWT_SECRET
    const token = jwt.sign({ email: existingUser.email }, secretKey, { expiresIn: '1h' })
    return res.status(200).json({ userDetails: existingUser, token })


    // } else {

    //     const newUser = new users({ username, email, password })
    //     await newUser.save()
    //     res.status(200).json(newUser)


    // }
  } catch (error) {
    res.status(401).json(error)
  }
}

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
      
     const{data,error}= await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset Password',
        html: `<p>This is the link to reset your password:<br/><a href="${resetLink}">${resetLink}</a></p>`
      });
      console.log("data:",data);
      console.log("error:",error)
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
