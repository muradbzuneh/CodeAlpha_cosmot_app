import { env } from "../env.js";

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
  status: "success" | "failed" | "error";
  message: string;
  data?: {
    checkout_url: string;
  };
};

export type ChapaVerifyResponse = {
  status: "success" | "failed" | "error";
  message: string;
  data?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    currency?: string;
    amount?: number;
    status?: string;
    reference?: string;
    chapa_reference?: string;
    processor_reference?: string;
    merchant_reference?: string;
    tx_ref?: string;
  };
};

export class ChapaService {
  private secretKey: string | undefined;

  constructor() {
    this.secretKey = env.CHAPA_SECRET_KEY;
  }

  // Chapa Global keys start with CHAPA_TEST_PRIV_ or CHAPA_LIVE_PRIV_ (dashboard.chapa.global)
  get isGlobal(): boolean {
    return !!this.secretKey && this.secretKey.startsWith("CHAPA_");
  }

  get isConfigured(): boolean {
    return (
      !!this.secretKey &&
      (this.secretKey.startsWith("CHASECK_") ||
        this.secretKey.startsWith("CHAPA_") ||
        this.secretKey.length > 15)
    );
  }

  async initialize(params: ChapaInitParams): Promise<{ checkoutUrl: string; txRef: string }> {
    if (!this.isConfigured) {
      throw new Error(
        "Chapa payment gateway key is missing. Please set CHAPA_SECRET_KEY in server/.env."
      );
    }

    if (this.isGlobal) {
      return this.initializeGlobalV2(params);
    } else {
      return this.initializeV1(params);
    }
  }

  // 1. Chapa Global v2 (https://api.chapa.global/v2/payments/hosted)
  private async initializeGlobalV2(params: ChapaInitParams): Promise<{ checkoutUrl: string; txRef: string }> {
    // Chapa Global reference must be at most 20 characters
    const txRef = params.txRef.slice(0, 20);

    // Chapa Global requires https:// for callback_url
    let callbackUrl = params.callbackUrl;
    if (!callbackUrl || !callbackUrl.startsWith("https://")) {
      callbackUrl = "https://code-alpha-cosmot-app-back.vercel.app/api/orders/webhook";
    }

    // Chapa Global also requires https:// for return_url
    let returnUrl = params.returnUrl;
    if (returnUrl && !returnUrl.startsWith("https://")) {
      const httpsOrigin = env.CORS_ORIGIN.split(",")
        .map((s) => s.trim())
        .find((s) => s.startsWith("https://"));

      if (httpsOrigin) {
        try {
          const parsed = new URL(returnUrl);
          returnUrl = `${httpsOrigin}${parsed.pathname}${parsed.search}`;
        } catch {
          returnUrl = `${httpsOrigin}/orders?payment=success&tx_ref=${txRef}`;
        }
      } else {
        returnUrl = returnUrl.replace(/^http:\/\//i, "https://");
      }
    }

    const payload = {
      // Amount in integer cents (e.g., 250 ETB = 25000 cents)
      amount: Math.round(params.amount * 100),
      currency: params.currency || "ETB",
      merchant_reference: txRef,
      customer: {
        email: params.email,
        first_name: params.firstName || "Customer",
        last_name: params.lastName || "Cosmot",
        phone_number: params.phoneNumber || undefined,
      },
      callback_url: callbackUrl,
      return_url: returnUrl,
    };

    const res = await fetch("https://api.chapa.global/v2/payments/hosted", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `idemp-${txRef}`,
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();

    if (res.ok && data.status === "success" && data.data?.checkout_url) {
      return {
        checkoutUrl: data.data.checkout_url,
        txRef,
      };
    }

    console.error("[Chapa Global v2 Error]:", data);
    throw new Error(data.message || `Chapa payment initialization failed (${res.status})`);
  }

  // 2. Chapa Legacy v1 (https://api.chapa.co/v1/transaction/initialize)
  private async initializeV1(params: ChapaInitParams): Promise<{ checkoutUrl: string; txRef: string }> {
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

    const res = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();

    if (res.ok && data.status === "success" && data.data?.checkout_url) {
      return {
        checkoutUrl: data.data.checkout_url,
        txRef: params.txRef,
      };
    }

    console.error("[Chapa v1 Error]:", data);
    throw new Error(data.message || `Failed to initialize Chapa payment (${res.status})`);
  }

  async verify(reference: string): Promise<ChapaVerifyResponse> {
    if (!this.isConfigured) {
      throw new Error("Chapa secret key is not configured in server/.env");
    }

    const cleanRef = reference.trim().slice(0, 20);
    const verifyUrl = this.isGlobal
      ? `https://api.chapa.global/v2/payments/${encodeURIComponent(cleanRef)}/verify`
      : `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(reference.trim())}`;

    try {
      const res = await fetch(verifyUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      });

      const data: any = await res.json();

      if (data.status === "success") {
        return {
          status: "success",
          message: data.message || "Payment verified",
          data: data.data,
        };
      }

      return {
        status: "failed",
        message: data.message || "Verification failed",
        data: data.data,
      };
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
