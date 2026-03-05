import User, { type IUser } from "../models/User";

export const createUser = async (data: Partial<IUser>) => {
  const user = new User(data);
  return await user.save();
};

export const getAllUsers = async () => {
  return await User.find();
};
