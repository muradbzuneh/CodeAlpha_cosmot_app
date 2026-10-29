import { Resend } from "resend";
import { env } from "../env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type OrderEmailData = {
  orderId: string;
  customerName: string;
  email: string;
  total: number;
  subtotal: number;
  discount: number;
  vat: number;
  shippingFee: number;
  address: string;
  city?: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  if (!resend) {
    console.log(`[Resend Not Configured] Order confirmation email for ${data.email} (Order #${data.orderId})`);
    return;
  }

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4;">
          <p style="margin: 0; font-weight: 500; font-size: 14px; color: #1c1917;">${item.name}</p>
          <p style="margin: 2px 0 0; font-size: 12px; color: #78716c;">Qty: ${item.quantity}</p>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; text-align: right; font-size: 14px; font-weight: 500; color: #1c1917;">
          ${(item.price * item.quantity).toFixed(2)} ETB
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1c1917;">
      <div style="border-bottom: 2px solid #1c1917; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="font-size: 32px; font-style: italic; margin: 0; letter-spacing: -0.02em;">Cosmot.</h1>
        <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 10px; color: #78716c; margin-top: 6px;">Skincare Rituals · Order Confirmed</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Hello ${data.customerName || "Customer"},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
        Thank you for your ritual selection. We have received your order <strong style="color: #1c1917;">#${data.orderId.slice(0, 10)}</strong> and are preparing it with care.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 28px 0;">
        <thead>
          <tr style="border-bottom: 1px solid #e7e5e4;">
            <th style="text-align: left; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716c;">Item</th>
            <th style="text-align: right; padding-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #78716c;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background-color: #fafaf9; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #78716c;">
          <span>Subtotal</span>
          <span>${data.subtotal.toFixed(2)} ETB</span>
        </div>
        ${
          data.discount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #059669;">
                <span>Discount applied</span>
                <span>-${data.discount.toFixed(2)} ETB</span>
              </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #78716c;">
          <span>VAT (15%)</span>
          <span>${data.vat.toFixed(2)} ETB</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: #78716c;">
          <span>Delivery</span>
          <span>${data.shippingFee === 0 ? "Free" : `${data.shippingFee.toFixed(2)} ETB`}</span>
        </div>
        <div style="border-top: 1px solid #e7e5e4; padding-top: 12px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 600;">
          <span>Total</span>
          <span>${data.total.toFixed(2)} ETB</span>
        </div>
      </div>

      <div style="font-size: 12px; color: #78716c; line-height: 1.6; border-top: 1px solid #f5f5f4; padding-top: 20px;">
        <p style="margin: 0;"><strong>Shipping to:</strong> ${data.address}${data.city ? `, ${data.city}` : ""}</p>
        <p style="margin: 4px 0 0;"><strong>Payment Method:</strong> ${data.paymentMethod.toUpperCase()}</p>
      </div>

      <p style="font-size: 12px; color: #a8a29e; margin-top: 40px; text-align: center;">
        Cosmot · Kombolcha, Ethiopia · Pure Botanical Aesthetics
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL || "Cosmot <onboarding@resend.dev>",
      to: data.email,
      subject: `Order Confirmation #${data.orderId.slice(0, 8)} - Cosmot`,
      html,
    });
    console.log(`[Resend] Dispatched order confirmation email for order #${data.orderId} to ${data.email}`);
  } catch (err) {
    console.error("[Resend Error] Failed to send order confirmation email:", err);
  }
}
