import axios from "axios";
import Credential, {
  type CredentialStatus,
  type ICredential,
} from "../models/Credential";
import { decryptObject, encryptObject } from "./crypto.service";

type CredentialData = Record<string, unknown>;

export interface CredentialMetadataDto {
  id: string;
  name: string;
  provider: string;
  status: CredentialStatus;
  lastTestedAt?: number;
  lastTestError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CredentialWriteInput {
  name?: string;
  provider?: string;
  data?: CredentialData;
}

export interface CredentialTestResult {
  success: boolean;
  message: string;
  provider: string;
}

const toMetadataDto = (credential: ICredential): CredentialMetadataDto => ({
  id: credential._id.toString(),
  name: credential.name,
  provider: credential.provider,
  status: credential.status,
  lastTestedAt: credential.lastTestedAt?.getTime(),
  lastTestError: credential.lastTestError,
  createdAt: credential.createdAt.getTime(),
  updatedAt: credential.updatedAt.getTime(),
});

const assertCredentialPayload = (data: CredentialWriteInput) => {
  if (!data.name || !data.provider || !data.data) {
    throw new Error("name, provider, and data are required");
  }
  if (typeof data.data !== "object" || Array.isArray(data.data)) {
    throw new Error("data must be an object");
  }
};

export const createCredential = async (
  userId: string,
  data: CredentialWriteInput,
) => {
  assertCredentialPayload(data);

  const credential = new Credential({
    userId,
    name: data.name,
    provider: data.provider,
    encryptedData: encryptObject(data.data as CredentialData),
  });

  const saved = await credential.save();
  return toMetadataDto(saved);
};

export const getUserCredentials = async (userId: string) => {
  const credentials = await Credential.find({ userId }).sort({ updatedAt: -1 });
  return credentials.map(toMetadataDto);
};

export const getCredentialById = async (id: string, userId: string) => {
  const credential = await Credential.findOne({ _id: id, userId });
  return credential ? toMetadataDto(credential) : null;
};

export const updateCredential = async (
  id: string,
  userId: string,
  data: CredentialWriteInput,
) => {
  const credential = await Credential.findOne({ _id: id, userId });
  if (!credential) return null;

  if (typeof data.name === "string") credential.name = data.name;
  if (typeof data.provider === "string") credential.provider = data.provider;

  if (data.data !== undefined) {
    if (typeof data.data !== "object" || Array.isArray(data.data)) {
      throw new Error("data must be an object");
    }
    credential.encryptedData = encryptObject(data.data as CredentialData);
    credential.status = "never_tested";
    credential.lastTestError = undefined;
    credential.lastTestedAt = undefined;
  }

  await credential.save();
  return toMetadataDto(credential);
};

export const deleteCredential = async (id: string, userId: string) => {
  const credential = await Credential.findOneAndDelete({ _id: id, userId });
  return credential ? toMetadataDto(credential) : null;
};

export const getDecryptedCredential = async (id: string, userId: string) => {
  const credential = await Credential.findOne({ _id: id, userId });
  if (!credential) return null;

  const data = decryptObject(credential.encryptedData);
  return {
    metadata: toMetadataDto(credential),
    data,
  };
};

const runProviderTest = async (
  provider: string,
  data: CredentialData,
): Promise<CredentialTestResult> => {
  switch (provider) {
    case "discord": {
      const webhookUrl = String(data.webhookUrl ?? "");
      if (!webhookUrl) {
        throw new Error("Missing webhookUrl for discord credential");
      }
      await axios.post(webhookUrl, { content: "n8n-clone credential test" });
      return { success: true, message: "Discord webhook reachable", provider };
    }
    case "telegram": {
      const botToken = String(data.botToken ?? "");
      const chatId = String(data.chatId ?? "");
      if (!botToken || !chatId) {
        throw new Error("Missing botToken or chatId for telegram credential");
      }
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: "n8n-clone credential test",
      });
      return { success: true, message: "Telegram bot token is valid", provider };
    }
    case "weather": {
      const apiKey = String(data.apiKey ?? "");
      if (!apiKey) {
        throw new Error("Missing apiKey for weather credential");
      }
      await axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: { q: "London", appid: apiKey },
      });
      return { success: true, message: "Weather API key is valid", provider };
    }
    case "notion": {
      const apiKey = String(data.apiKey ?? "");
      const parentPageId = String(data.parentPageId ?? "");
      const notionVersion = String(data.notionVersion ?? "2022-06-28");
      if (!apiKey || !parentPageId) {
        throw new Error("Missing apiKey or parentPageId for notion credential");
      }

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": notionVersion,
      };

      await axios.get("https://api.notion.com/v1/users/me", { headers });
      await axios.get(`https://api.notion.com/v1/pages/${parentPageId}`, {
        headers,
      });

      return {
        success: true,
        message: "Notion token and parent page access are valid",
        provider,
      };
    }
    default:
      return {
        success: true,
        message: `No provider-specific test for '${provider}', structure is valid`,
        provider,
      };
  }
};

export const testCredential = async (id: string, userId: string) => {
  const credential = await Credential.findOne({ _id: id, userId });
  if (!credential) return null;

  let result: CredentialTestResult;
  try {
    const decrypted = decryptObject(credential.encryptedData);
    result = await runProviderTest(credential.provider, decrypted);

    credential.status = "passed";
    credential.lastTestError = undefined;
  } catch (error: any) {
    result = {
      success: false,
      message: error?.message || "Credential test failed",
      provider: credential.provider,
    };
    credential.status = "failed";
    credential.lastTestError = result.message;
  }

  credential.lastTestedAt = new Date();
  await credential.save();

  return {
    credential: toMetadataDto(credential),
    result,
  };
};
