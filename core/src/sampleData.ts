export type SampleCategory = { name: string; slug: string };

export type SampleProduct = {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  badge: string | null;
  tag: string | null;
};

export const sampleCategories: SampleCategory[] = [
  { name: "Dogs", slug: "dogs" },
  { name: "Cats", slug: "cats" },
  { name: "Foods", slug: "foods" },
  { name: "Groom", slug: "groom" },
  { name: "Collar", slug: "collar" },
  { name: "Bed", slug: "bed" },
  { name: "Toys", slug: "toys" },
];

export const sampleProducts: SampleProduct[] = [
  // Dogs category
  {
    name: "Premium Dog Food — Chicken & Rice",
    description:
      "Nutritious dry food for active adult dogs, made with real chicken and wholesome grains.",
    price: 24.99,
    image_url: "https://images.unsplash.com/photo-1565708097881-b382c57d3dbf?w=600&h=600&fit=crop",
    category: "dogs",
    badge: "-20%",
    tag: "XL",
  },
  {
    name: "Orthopedic Dog Bed — Memory Foam",
    description:
      "Ultra-comfortable memory foam bed for dogs with joint pain. Washable cover included.",
    price: 59.99,
    image_url: "https://images.unsplash.com/photo-1541188495357-ad2d2e0c9c18?w=600&h=600&fit=crop",
    category: "dogs",
    badge: null,
    tag: "Large",
  },
  {
    name: "Retractable Dog Leash 5m",
    description:
      "Durable nylon retractable leash with ergonomic handle. Extends up to 5 meters for freedom.",
    price: 18.99,
    image_url: "https://images.unsplash.com/photo-1591198030640-3bd6a212f5fc?w=600&h=600&fit=crop",
    category: "dogs",
    badge: null,
    tag: null,
  },
  {
    name: "Dog Chew Toy — Beef Bone",
    description: "Long-lasting beef-flavored bone toy for aggressive chewers. Helps clean teeth.",
    price: 9.99,
    image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&h=600&fit=crop",
    category: "dogs",
    badge: "Best Seller",
    tag: null,
  },

  // Cats category
  {
    name: "Organic Cat Treats — Salmon",
    description:
      "Grain-free salmon treats made from real wild-caught salmon. Perfect for training.",
    price: 7.99,
    image_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=600&fit=crop",
    category: "cats",
    badge: "-15%",
    tag: null,
  },
  {
    name: "Cat Scratching Post — 80cm",
    description:
      "Premium sisal scratching post with interactive hanging toy. Keeps your furniture safe.",
    price: 34.99,
    image_url: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600&h=600&fit=crop",
    category: "cats",
    badge: null,
    tag: null,
  },
  {
    name: "Luxury Cat Bed — Cave Style",
    description: "Cozy cave bed for cats who love to burrow. Machine washable and super soft.",
    price: 42.99,
    image_url: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop",
    category: "cats",
    badge: null,
    tag: "Medium",
  },
  {
    name: "Interactive Feather Wand Toy",
    description: "Engaging feather wand toy to stimulate your cat's natural hunting instincts.",
    price: 6.99,
    image_url: "https://images.unsplash.com/photo-1571566882372-1598d8abd90c?w=600&h=600&fit=crop",
    category: "cats",
    badge: null,
    tag: null,
  },

  // Foods category
  {
    name: "Grain-Free Puppy Food — Lamb",
    description: "Complete nutrition for growing puppies. Rich in lamb protein and essential DHA.",
    price: 32.49,
    image_url: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop",
    category: "foods",
    badge: "New",
    tag: "5lb",
  },
  {
    name: "Wet Cat Food Variety Pack",
    description: "Assorted flavors of premium wet cat food. 12-pack of 3oz cans.",
    price: 18.99,
    image_url: "https://images.unsplash.com/photo-1561758033-48d5264ae74b?w=600&h=600&fit=crop",
    category: "foods",
    badge: null,
    tag: null,
  },
  {
    name: "Freeze-Dried Dog Treats — Beef Liver",
    description: "Single-ingredient freeze-dried beef liver treats. High protein, no additives.",
    price: 14.99,
    image_url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=600&fit=crop",
    category: "foods",
    badge: "-25%",
    tag: null,
  },
  {
    name: "Premium Fish Food Flakes",
    description: "Balanced nutrition for tropical fish. Rich in vitamins and minerals.",
    price: 8.49,
    image_url: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=600&h=600&fit=crop",
    category: "foods",
    badge: null,
    tag: null,
  },

  // Groom category
  {
    name: "Pet Grooming Brush — Deshedding Tool",
    description:
      "Professional deshedding brush removes loose fur and reduces shedding by up to 90%.",
    price: 22.49,
    image_url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=600&fit=crop",
    category: "groom",
    badge: null,
    tag: null,
  },
  {
    name: "Dog Shampoo — Oatmeal & Aloe",
    description: "Gentle hypoallergenic shampoo for sensitive skin. pH balanced for dogs.",
    price: 12.99,
    image_url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop",
    category: "groom",
    badge: null,
    tag: "16oz",
  },
  {
    name: "Nail Grinder for Dogs & Cats",
    description: "Quiet, rechargeable nail grinder with multiple speed settings and safety guard.",
    price: 27.99,
    image_url: "https://images.unsplash.com/photo-1621607368568-12e2c41d6a1f?w=600&h=600&fit=crop",
    category: "groom",
    badge: "Best Seller",
    tag: null,
  },

  // Collar category
  {
    name: "Reflective Dog Collar — Adjustable",
    description:
      "High-visibility reflective collar for nighttime walks. Durable nylon with quick-release buckle.",
    price: 14.99,
    image_url: "https://images.unsplash.com/photo-1591946600635-4c2e6f9837a9?w=600&h=600&fit=crop",
    category: "collar",
    badge: null,
    tag: "M",
  },
  {
    name: "Cat Collar with Bell — Breakaway",
    description: "Safe breakaway cat collar with gentle bell alert. Adjustable and lightweight.",
    price: 9.99,
    image_url: "https://images.unsplash.com/photo-1548625360-1fc83f6c60ba?w=600&h=600&fit=crop",
    category: "collar",
    badge: null,
    tag: null,
  },
  {
    name: "Personalized ID Tag — Engraved",
    description: "Stainless steel ID tag with custom engraving. Comes with a free split ring.",
    price: 11.99,
    image_url: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=600&h=600&fit=crop",
    category: "collar",
    badge: null,
    tag: null,
  },

  // Bed category
  {
    name: "Heated Pet Bed — Self-Warming",
    description:
      "Self-warming bed with plush fleece lining. No electricity needed — reflects body heat.",
    price: 39.99,
    image_url: "https://images.unsplash.com/photo-1541188495357-ad2d2e0c9c18?w=600&h=600&fit=crop",
    category: "bed",
    badge: "-30%",
    tag: null,
  },
  {
    name: "Donut Cat Bed — Washable",
    description:
      "Round bolster bed with raised edges for security. Machine washable and extra plush.",
    price: 36.99,
    image_url: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop",
    category: "bed",
    badge: null,
    tag: "Small",
  },
  {
    name: "Waterproof Dog Bed — Outdoor",
    description: "Durable waterproof bed for outdoor use. UV-resistant fabric with quick-dry foam.",
    price: 49.99,
    image_url: "https://images.unsplash.com/photo-1559703247-d8b719206b53?w=600&h=600&fit=crop",
    category: "bed",
    badge: null,
    tag: "Large",
  },

  // Toys category
  {
    name: "Rope Tug Toy — Cotton",
    description: "Natural cotton rope toy for interactive tug-of-war. Helps clean teeth and gums.",
    price: 7.49,
    image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&h=600&fit=crop",
    category: "toys",
    badge: null,
    tag: null,
  },
  {
    name: "Squeaky Plush Toy Set — 3 Pack",
    description: "Assorted squeaky plush toys with crinkle paper inside. Irresistible for dogs.",
    price: 16.99,
    image_url: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&h=600&fit=crop",
    category: "toys",
    badge: null,
    tag: null,
  },
  {
    name: "Laser Pointer Cat Toy — USB Rechargeable",
    description: "Rechargeable laser toy for endless cat fun. Includes multiple pattern modes.",
    price: 13.99,
    image_url: "https://images.unsplash.com/photo-1571566882372-1598d8abd90c?w=600&h=600&fit=crop",
    category: "toys",
    badge: "New",
    tag: null,
  },
  {
    name: "Interactive Treat Puzzle Dog Toy",
    description: "Mental stimulation puzzle that dispenses treats. Adjustable difficulty levels.",
    price: 21.99,
    image_url: "https://images.unsplash.com/photo-1591946600635-4c2e6f9837a9?w=600&h=600&fit=crop",
    category: "toys",
    badge: null,
    tag: null,
  },
];
