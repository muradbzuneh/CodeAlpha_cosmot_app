import { env } from "../env.js";

const CHAPA_API_URL = "https://api.chapa.co/v1";

export type ChapaInitParams = {
  amount: number;
  currency?: string;
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  txRef: string;
  callbackUrl?: string;
  returnUrl?: string;
  title?: string;
  description?: string;
};

export type ChapaInitResponse = {
  status: "success" | "failed";
  message: string;
  data?: {
    checkout_url: string;
  };
};

export type ChapaVerifyResponse = {
  status: "success" | "failed";
  message: string;
  data?: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    customization?: any;
  };
};

export class ChapaService {
  private secretKey: string | undefined;

  constructor() {
    this.secretKey = env.CHAPA_SECRET_KEY;
  }

  get isConfigured(): boolean {
    return (
      !!this.secretKey &&
      (this.secretKey.startsWith("CHASECK_") ||
        this.secretKey.startsWith("CHAPA_") ||
        this.secretKey.length > 10)
    );
  }

  async initialize(params: ChapaInitParams): Promise<{ checkoutUrl: string; txRef: string }> {
    if (!this.isConfigured) {
      throw new Error(
        "Chapa payment gateway key is missing. Please set CHAPA_SECRET_KEY in server/.env (Format: CHASECK_TEST-...)."
      );
    }

    const payload = {
      amount: String(params.amount),
      currency: params.currency || "ETB",
      email: params.email,
      first_name: params.firstName || "Customer",
      last_name: params.lastName || "Cosmot",
      phone_number: params.phoneNumber || "",
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      "customization[title]": params.title || "Cosmot Skincare",
      "customization[description]": params.description || `Order #${params.txRef}`,
    };

    try {
      const res = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: ChapaInitResponse = await res.json();

      if (res.ok && data.status === "success" && data.data?.checkout_url) {
        return {
          checkoutUrl: data.data.checkout_url,
          txRef: params.txRef,
        };
      }

      console.error("[Chapa Init Response Error]:", data);

      // If Chapa returns an invalid key error, throw clear error with instructions
      if (data.message && data.message.toLowerCase().includes("invalid api key")) {
        throw new Error(
          `Chapa API rejected your key (${this.secretKey?.slice(0, 10)}...). Chapa secret keys usually start with 'CHASECK_TEST-'. Please verify your active key in dashboard.chapa.co.`
        );
      }

      throw new Error(data.message || `Failed to initialize Chapa payment (${res.status})`);
    } catch (err: any) {
      console.error("[Chapa Network/Service Error]:", err.message);
      throw err;
    }
  }

  async verify(txRef: string): Promise<ChapaVerifyResponse> {
    if (!this.isConfigured) {
      throw new Error("Chapa secret key is not configured in server/.env");
    }

    try {
      const res = await fetch(`${CHAPA_API_URL}/transaction/verify/${txRef}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const data: ChapaVerifyResponse = await res.json();
      return data;
    } catch (err: any) {
      console.error("[Chapa Verify Error]:", err.message);
      return {
        status: "failed",
        message: err.message || "Failed to contact Chapa verification API",
      };
    }
  }
}

export const chapa = new ChapaService();
