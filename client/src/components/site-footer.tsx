import { Facebook, Instagram, Send, Twitter, Mail, Phone, MapPin } from "lucide-react";

const socials = [
  { label: "Facebook", icon: Facebook, href: "https://facebook.com/muradbzuneh" },
  { label: "Instagram", icon: Instagram, href: "https://instagram.com/muradina_16" },
  { label: "Telegram", icon: Send, href: "https://t.me/murad_bz" },
  { label: "X", icon: Twitter, href: "https://x.com/MURADBZUNEH" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 px-4 md:px-8 py-16 bg-stone-900 text-stone-300 rounded-t-[3rem]">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <div className="font-display text-4xl text-stone-100 italic mb-4 flex items-center gap-3">
              <img src="/cosmot-logo.png" alt="" className="size-12 grid place-items-center rounded-full 
              border border-stone-700 hover:text-stone-900 transition-colors" />
              Cosmot.
            </div>
            <p className="text-sm text-stone-400 max-w-xs leading-relaxed mb-6">
              Cellular-grade cosmetics formulated in small batches. Ethically sourced, satin to the touch.
            </p>
            <div className="flex gap-3">
              {socials.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="size-10 grid place-items-center rounded-full border border-stone-700 hover:border-stone-100 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                >
                  <Icon size={16} strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Directory</p>
            <ul className="text-sm space-y-2 text-stone-300">
              <li><a href="#" className="hover:text-stone-100">Journal</a></li>
              <li><a href="#" className="hover:text-stone-100">Our Ethics</a></li>
              <li><a href="#" className="hover:text-stone-100">Stockists</a></li>
              <li><a href="#" className="hover:text-stone-100">Shipping</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Service</p>
            <ul className="text-sm space-y-2 text-stone-300">
              <li><a href="#" className="hover:text-stone-100">Returns</a></li>
              <li><a href="#" className="hover:text-stone-100">FAQ</a></li>
              <li><a href="#" className="hover:text-stone-100">Track Order</a></li>
              <li><a href="#" className="hover:text-stone-100">Gift Cards</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500">Contact</p>
            <a
              href="mailto:muradbzuneh@gmail.com"
              className="flex items-start gap-2 text-sm text-stone-300 hover:text-stone-100 break-all"
            >
              <Mail size={14} className="mt-0.5 shrink-0" />
              muradbzuneh@gmail.com
            </a>
            <a
              href="tel:+25160851651"
              className="flex items-start gap-2 text-sm text-stone-300 hover:text-stone-100"
            >
              <Phone size={14} className="mt-0.5 shrink-0" />
              +251 60 851 651
            </a>
            <p className="flex items-start gap-2 text-sm text-stone-400">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              Wollo, Kombolcha · Ethiopia
            </p>
          </div>
        </div>
        <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-[10px] text-stone-600 tracking-wider uppercase">
            © 2026 Cosmot · Kombolcha, Ethiopia 
          </p>
          <p className="text-[10px] text-stone-600 tracking-wider uppercase">
            Privacy · Terms · Cookies
          </p>
        </div>
      </div>
    </footer>
  );
}
