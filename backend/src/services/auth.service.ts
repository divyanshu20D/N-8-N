import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../models/User";

export const register = async (data: Partial<IUser>) => {
  const { name, email, password } = data;

  if (!name || !email || !password) {
    throw new Error("Please provide all required fields");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email,
    password: hashedPassword,
  });

  await user.save();

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "30d" },
  );

  return { user: { id: user._id, name: user.name, email: user.email }, token };
};

export const login = async (data: Partial<IUser>) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "30d" },
  );

  return { user: { id: user._id, name: user.name, email: user.email }, token };
};
