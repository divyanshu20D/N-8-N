import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import * as credentialService from "../services/credential.service";
import { sendError } from "../utils/errorResponse";

export const createCredential = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const credential = await credentialService.createCredential(userId, req.body);
    res.status(201).json(credential);
  } catch (error: any) {
    console.error("[CREATE_CREDENTIAL_ERROR]", {
      userId: (req.user as any)?.userId,
      body: req.body,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 400, {
      code: "CREDENTIAL_CREATE_ERROR",
      message: error.message || "Error creating credential",
    });
  }
};

export const getCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const credentials = await credentialService.getUserCredentials(userId);
    res.status(200).json(credentials);
  } catch (error: any) {
    console.error("[GET_CREDENTIALS_ERROR]", {
      userId: (req.user as any)?.userId,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "CREDENTIAL_LIST_ERROR",
      message: error.message || "Error fetching credentials",
    });
  }
};

export const getCredential = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const credential = await credentialService.getCredentialById(
      req.params.id as string,
      userId,
    );
    if (!credential) {
      sendError(res, 404, {
        code: "CREDENTIAL_NOT_FOUND",
        message: "Credential not found",
      });
      return;
    }
    res.status(200).json(credential);
  } catch (error: any) {
    console.error("[GET_CREDENTIAL_ERROR]", {
      userId: (req.user as any)?.userId,
      credentialId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "CREDENTIAL_GET_ERROR",
      message: error.message || "Error fetching credential",
    });
  }
};

export const updateCredential = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const credential = await credentialService.updateCredential(
      req.params.id as string,
      userId,
      req.body,
    );
    if (!credential) {
      sendError(res, 404, {
        code: "CREDENTIAL_NOT_FOUND",
        message: "Credential not found",
      });
      return;
    }
    res.status(200).json(credential);
  } catch (error: any) {
    console.error("[UPDATE_CREDENTIAL_ERROR]", {
      userId: (req.user as any)?.userId,
      credentialId: req.params.id,
      body: req.body,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 400, {
      code: "CREDENTIAL_UPDATE_ERROR",
      message: error.message || "Error updating credential",
    });
  }
};

export const deleteCredential = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const credential = await credentialService.deleteCredential(
      req.params.id as string,
      userId,
    );
    if (!credential) {
      sendError(res, 404, {
        code: "CREDENTIAL_NOT_FOUND",
        message: "Credential not found",
      });
      return;
    }
    res.status(200).json({ message: "Credential deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE_CREDENTIAL_ERROR]", {
      userId: (req.user as any)?.userId,
      credentialId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "CREDENTIAL_DELETE_ERROR",
      message: error.message || "Error deleting credential",
    });
  }
};

export const testCredential = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const result = await credentialService.testCredential(
      req.params.id as string,
      userId,
    );
    if (!result) {
      sendError(res, 404, {
        code: "CREDENTIAL_NOT_FOUND",
        message: "Credential not found",
      });
      return;
    }

    const statusCode = result.result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error("[TEST_CREDENTIAL_ERROR]", {
      userId: (req.user as any)?.userId,
      credentialId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "CREDENTIAL_TEST_ERROR",
      message: error.message || "Error testing credential",
    });
  }
};
