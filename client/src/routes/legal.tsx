import { useState, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

type Tab = "terms" | "privacy" | "returns" | "shipping";

export function LegalPage({ defaultTab = "terms" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  useEffect(() => {
    const path = window.location.pathname.replace("/", "") as Tab;
    if (["terms", "privacy", "returns", "shipping"].includes(path)) {
      setTab(path);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-4 md:px-8 py-16 md:py-24 animate-page-in">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent mb-3">Policy &amp; Governance</p>
            <h1 className="font-display text-4xl md:text-5xl italic mb-6">Cosmot Standards</h1>

            {/* Tab switchers */}
            <div className="flex flex-wrap justify-center gap-2 border-b border-border pb-4">
              {[
                { id: "terms", label: "Terms of Service" },
                { id: "privacy", label: "Privacy Policy" },
                { id: "returns", label: "Return & Refund Policy" },
                { id: "shipping", label: "Shipping Policy" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider transition ${
                    tab === t.id
                      ? "bg-foreground text-background font-medium"
                      : "border border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </header>

          <article className="prose prose-stone max-w-none text-sm leading-relaxed text-muted-foreground space-y-6">
            {tab === "terms" && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl text-foreground italic">Terms &amp; Conditions of Sale</h2>
                <p>
                  Welcome to <strong>Cosmot</strong>. By browsing this store, creating an account, or purchasing any of our cosmetic ritual formulations, you agree to comply with and be bound by the following terms.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">1. Product Purity &amp; Disclaimer</h3>
                <p>
                  All Cosmot products are crafted in small batches with cellular-grade, ethically sourced botanicals. Formulations are intended solely for topical aesthetic application. We recommend performing an allergy patch test 24 hours prior to regular use.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">2. Pricing &amp; Currency</h3>
                <p>
                  All prices are quoted in Ethiopian Birr (ETB) and include applicable Value Added Tax (VAT 15%). Pricing and availability are subject to change without prior notice.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">3. Governing Law</h3>
                <p>
                  These terms are governed by and construed in accordance with the commercial and civil laws of the Federal Democratic Republic of Ethiopia.
                </p>
              </section>
            )}

            {tab === "privacy" && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl text-foreground italic">Customer Privacy Notice</h2>
                <p>
                  Cosmot respects your personal confidentiality. We process personal data solely to fulfill orders, facilitate deliveries, and provide customer support.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">Information We Collect</h3>
                <p>
                  We securely store contact identifiers (name, delivery address, email, telephone) and order records. We do not store sensitive payment card details or banking credentials on our servers; all digital payments are securely processed through Chapa's PCI-DSS compliant infrastructure.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">Communication</h3>
                <p>
                  We utilize transactional emails solely for order status updates, delivery confirmations, and password resets. Your contact information is never sold or shared with external advertising brokers.
                </p>
              </section>
            )}

            {tab === "returns" && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl text-foreground italic">Returns &amp; Hygiene Standards</h2>
                <p>
                  Due to the biological and hygienic sensitivity of cellular cosmetic products, safety seals must remain intact to be eligible for return or exchange.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">Eligibility Window</h3>
                <p>
                  Unopened, factory-sealed products in original packaging may be returned within <strong>14 calendar days</strong> of confirmed delivery.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">Damaged or Incorrect Items</h3>
                <p>
                  If your shipment arrives damaged or with incorrect items, please contact our support desk at <a href="mailto:support@cosmot.et" className="text-accent underline">support@cosmot.et</a> within 48 hours of receipt with a photo of the parcel. We will arrange an immediate replacement or full refund.
                </p>
              </section>
            )}

            {tab === "shipping" && (
              <section className="space-y-4">
                <h2 className="font-display text-2xl text-foreground italic">Shipping &amp; Delivery Logistics</h2>
                <p>
                  Cosmot provides secure temperature-controlled delivery throughout Ethiopia.
                </p>
                <h3 className="font-medium text-foreground text-base mt-4">Transit Times</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Standard Delivery:</strong> 2 to 4 business days (450 ETB, free on orders over 4,500 ETB).</li>
                  <li><strong>Express Dispatch:</strong> 24 to 48 hours priority courier (850 ETB).</li>
                </ul>
                <h3 className="font-medium text-foreground text-base mt-4">Tracking</h3>
                <p>
                  Once dispatched, you can monitor your parcel status directly in your account under the <strong>Orders</strong> dashboard.
                </p>
              </section>
            )}
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
