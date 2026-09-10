export const defaultSettings = {
  brand_name: "PetPals",
  brand_logo: "",
  tagline: "Everything your furry friend needs, delivered with love to your door.",
  contact_email: "hello@petpals.com",
  contact_phone: "+1 (555) 012-3456",
  whatsapp_number: "",
  contact_address: "124 Whisker Lane, Portland, OR 97205",
  support_hours: "Mon–Sat, 9am–6pm",
  hero_badge: "Get 40% Off On Your First Order",
  hero_title: "Puppy And Cat\nFood",
  hero_subtitle:
    "Premium nutrition crafted for your best friends. Wholesome ingredients, irresistible flavor, and tail-wagging happiness in every bowl.",
  promo_title: "Chicken Flavor Food",
  promo_old_price: "600 MAD",
  promo_price: "400 MAD",
  hero_image: "",
  free_shipping_threshold: "500",
  shipping_fee: "50",
  delivery_note: "Delivery within 24h — pay on delivery",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  homepage_sections:
    '[{"id":"hero","visible":true},{"id":"categories","visible":true},{"id":"products","visible":true},{"id":"promo","visible":true},{"id":"best","visible":true},{"id":"reviews","visible":true}]',
} as const;

export type Settings = { [K in keyof typeof defaultSettings]: string };