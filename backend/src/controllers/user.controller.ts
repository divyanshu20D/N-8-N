import type { Request, Response } from "express";
import * as userService from "../services/user.service";
import { sendError } from "../utils/errorResponse";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("[GET_USERS_ERROR]", error);
    sendError(res, 500, {
      code: "USER_LIST_ERROR",
      message: "Error fetching users",
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    sendError(res, 500, {
      code: "USER_CREATE_ERROR",
      message: "Error creating user",
    });
  }
};
