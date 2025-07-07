require('dotenv').config()
const users=require("../schema/userSchema")
const bcrypt=require("bcrypt")
const jwt = require('jsonwebtoken');


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