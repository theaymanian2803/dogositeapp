export type InfoItem = { label: string; value: string };

export type InfoSection = {
  heading: string;
  body: string[];
  list?: string[];
  items?: InfoItem[];
};

export type InfoPage = {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: InfoSection[];
};

export const infoPages: InfoPage[] = [
  {
    slug: "about",
    eyebrow: "Our story",
    title: "About PetPals",
    subtitle:
      "We're a team of pet lovers on a mission to make life better for animals — and the people who love them.",
    sections: [
      {
        heading: "Our story",
        body: [
          "PetPals started in 2020 with a simple idea: pet parents deserve better. Better food, better toys, better beds, and better guidance — all in one place, delivered with care.",
          "What began as a small neighborhood shop has grown into a trusted online destination for dogs, cats, and the whole family of furry friends. Through every stage, our values haven't changed: quality over quantity, and pets before profit.",
        ],
      },
      {
        heading: "What we believe",
        body: [
          "Every pet deserves a happy, healthy life. That belief guides every product we stock, every partner we work with, and every order we ship.",
        ],
        list: [
          "We only carry products we'd give our own pets.",
          "We work with vets and nutritionists to curate our range.",
          "Free shipping on every order over 500 MAD.",
          "30-day no-questions returns on all items.",
        ],
      },
      {
        heading: "Our promise",
        body: [
          "If your pet isn't happy, we're not happy. Reach out to our team any time and we'll make it right — whether that's a replacement, a refund, or just a friendly chat about your furry friend.",
        ],
      },
    ],
  },
  {
    slug: "contact",
    eyebrow: "Get in touch",
    title: "Contact us",
    subtitle:
      "Questions, feedback, or just want to say hi? Our team of pet people is here to help — usually within a few hours.",
    sections: [
      {
        heading: "Reach us directly",
        body: [
          "The fastest way to reach us is by email or chat. For order issues, please include your order number so we can help you faster.",
        ],
        items: [
          { label: "Email", value: "hello@petpals.com" },
          { label: "Phone", value: "+1 (555) 012-3456" },
          { label: "Visit us", value: "124 Whisker Lane, Portland, OR 97205" },
          { label: "Support hours", value: "Mon–Sat, 9am–6pm" },
        ],
      },
      {
        heading: "Send us a note",
        body: [
          "Prefer email? Click below and we'll get back to you with a real person — never a bot.",
        ],
      },
    ],
  },
  {
    slug: "shipping",
    eyebrow: "Delivery details",
    title: "Shipping",
    subtitle:
      "Fast, friendly, and free on orders over 500 MAD. Here's everything you need to know about how your pet's goodies get to your door.",
    sections: [
      {
        heading: "Shipping options",
        body: [
          "We ship from our Portland warehouse to all 50 states, with carbon-neutral delivery on every order.",
        ],
        list: [
          "Standard (3–5 business days) — free on orders over 500 MAD, otherwise 49.90 MAD.",
          "Express (1–2 business days) — 129 MAD.",
          "Same-day (selected cities) — 159 MAD, order before 12pm local time.",
        ],
      },
      {
        heading: "Tracking your order",
        body: [
          "Once your order ships, we'll email you a tracking link. You can also see live order status any time from your account page.",
        ],
      },
      {
        heading: "What about delivery times?",
        body: [
          "Most orders arrive within the estimated window. During peak seasons (holidays) allow an extra 1–2 days. If your order is ever late, we'll make it right with store credit.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    eyebrow: "Easy as it gets",
    title: "Returns & refunds",
    subtitle:
      "If something isn't right, return it. We offer 30-day no-questions returns on every single product.",
    sections: [
      {
        heading: "30-day returns",
        body: [
          "You have 30 days from delivery to return any item for a full refund or exchange — no questions asked, no restocking fees. Even if your pet decided the bed wasn't to their taste.",
        ],
      },
      {
        heading: "How to start a return",
        body: [
          "Start a return from your account page or email us with your order number. We'll email you a prepaid return label within one business day.",
        ],
        list: [
          "Items must be unused and in original packaging.",
          "Food and treats must be unopened for hygiene reasons.",
          "Refunds are processed within 5 business days of receipt.",
        ],
      },
      {
        heading: "Damaged or wrong items",
        body: [
          "If your order arrived damaged or incorrect, we'll replace it immediately at no cost — just send a photo and we'll handle the rest.",
        ],
      },
    ],
  },
  {
    slug: "faq",
    eyebrow: "Common questions",
    title: "Frequently asked questions",
    subtitle: "Quick answers to the questions we hear most from pet parents.",
    sections: [
      {
        heading: "Orders & payment",
        body: [
          "You can pay with all major credit cards, PayPal, and Apple Pay. Checkout is fast, secure, and guest-friendly — no account required.",
        ],
      },
      {
        heading: "Do you offer discounts for repeat customers?",
        body: [
          "Yes! Sign in to your account to earn PawPoints on every order, and keep an eye on your email for members-only promos and early access to sales.",
        ],
      },
      {
        heading: "Can I buy gift cards?",
        body: [
          "Absolutely — digital gift cards are delivered instantly by email and can be redeemed at checkout.",
        ],
      },
      {
        heading: "How do I track my order?",
        body: [
          "Log into your account to see live order status, or use the tracking link sent to your email once your order ships.",
        ],
      },
    ],
  },
  {
    slug: "careers",
    eyebrow: "Join the pack",
    title: "Careers at PetPals",
    subtitle:
      "Love pets? So do we. Come do the best work of your career with a team that brings dogs (and cats) to the office.",
    sections: [
      {
        heading: "Why PetPals",
        body: [
          "We're a small, friendly team growing fast. You'll have real ownership from day one, work with kind people, and get plenty of pet breaks.",
        ],
        list: [
          "Competitive pay + equity.",
          "Health, dental, and vision coverage.",
          "Unlimited PTO and flexible hours.",
          "Pet-friendly office (dogs welcome!).",
        ],
      },
      {
        heading: "Current openings",
        body: [
          "We're always looking for passionate people. Email your resume to careers@petpals.com.",
        ],
        list: [
          "Customer Happiness Specialist — Remote.",
          "Product Curator (Pet Supplies) — Portland, OR.",
          "Frontend Developer — Remote.",
          "Warehouse Operations Lead — Portland, OR.",
        ],
      },
    ],
  },
  {
    slug: "press",
    eyebrow: "News & media",
    title: "Press & media",
    subtitle:
      "The latest news, assets, and story of PetPals — for journalists and friends of the brand.",
    sections: [
      {
        heading: "In the news",
        body: [
          "PetPals has been featured in publications celebrating thoughtful, sustainable pet care. Recent highlights:",
        ],
        list: [
          "“PetPals tops the list of pet brands doing good.” — Pet Daily, 2026.",
          "“A modern pet shop with a heart.” — Northwest Living, 2025.",
          "“Why sustainable pet care is booming.” — Green Retail Report, 2025.",
        ],
      },
      {
        heading: "Brand assets",
        body: [
          "For logos, product images, and our media kit, email press@petpals.com and a real human will send everything you need.",
        ],
      },
    ],
  },
  {
    slug: "sustainability",
    eyebrow: "Better for pets, better for the planet",
    title: "Sustainability",
    subtitle:
      "We believe the healthiest pet products shouldn't cost the earth. Here's how we give back.",
    sections: [
      {
        heading: "Our commitments",
        body: [
          "From packaging to delivery, we're constantly reducing our footprint without compromising the quality your pets deserve.",
        ],
        list: [
          "100% recyclable and plastic-reduced packaging.",
          "Carbon-neutral shipping on every order.",
          "1% of every sale donated to animal rescue charities.",
          "Sustainably sourced ingredients in our foods and treats.",
        ],
      },
      {
        heading: "The bigger picture",
        body: [
          "So far we've planted over 25,000 trees and supported more than 40 local shelters. Every order helps — thank you for being part of the pack.",
        ],
      },
    ],
  },
];
