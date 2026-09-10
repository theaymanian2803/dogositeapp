import { createClient } from "@libsql/client";
import {
  ensureWebTables,
  productSlug,
  sampleCategories,
  sampleProducts,
  slugify,
} from "@petpals/core";

const url = process.env.TURSO_DB_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Missing TURSO_DB_URL");
  process.exit(1);
}

const turso = createClient({ url, authToken });

type OrderItem = { id: string; name: string; qty: number; price: number; image_url: string };

const sampleOrders: {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
}[] = [
  {
    first_name: "Alice",
    last_name: "Johnson",
    phone: "+1-555-0101",
    address: "123 Maple St, Springfield, IL 62701",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Premium Dog Food",
        qty: 2,
        price: 24.99,
        image_url: "https://images.unsplash.com/photo-1565708097881-b382c57d3dbf?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Chew Bone Toy",
        qty: 1,
        price: 8.99,
        image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200",
      },
    ],
    total: 58.97,
    status: "delivered",
  },
  {
    first_name: "Bob",
    last_name: "Smith",
    phone: "+1-555-0202",
    address: "456 Oak Ave, Portland, OR 97201",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Cat Scratching Post",
        qty: 1,
        price: 34.99,
        image_url: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=200",
      },
    ],
    total: 34.99,
    status: "shipped",
  },
  {
    first_name: "Carol",
    last_name: "Williams",
    phone: "+1-555-0303",
    address: "789 Pine Rd, Austin, TX 73301",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Organic Cat Treats",
        qty: 3,
        price: 6.99,
        image_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Pet Bed Deluxe",
        qty: 1,
        price: 49.99,
        image_url: "https://images.unsplash.com/photo-1541188495357-ad2d2e0c9c18?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Stainless Steel Bowl",
        qty: 2,
        price: 12.49,
        image_url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200",
      },
    ],
    total: 85.95,
    status: "processing",
  },
  {
    first_name: "David",
    last_name: "Brown",
    phone: "+1-555-0404",
    address: "321 Elm St, Denver, CO 80201",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Dog Leash (Retractable)",
        qty: 1,
        price: 18.99,
        image_url: "https://images.unsplash.com/photo-1591198030640-3bd6a212f5fc?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Grooming Brush Kit",
        qty: 1,
        price: 22.49,
        image_url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200",
      },
    ],
    total: 41.48,
    status: "new",
  },
  {
    first_name: "Eve",
    last_name: "Davis",
    phone: "+1-555-0505",
    address: "654 Birch Ln, Seattle, WA 98101",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Fish Tank Filter",
        qty: 1,
        price: 29.99,
        image_url: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?w=200",
      },
    ],
    total: 34.99,
    status: "cancelled",
  },
  {
    first_name: "Frank",
    last_name: "Miller",
    phone: "+1-555-0606",
    address: "987 Walnut Ct, Chicago, IL 60601",
    items: [
      {
        id: crypto.randomUUID(),
        name: "Premium Dog Food",
        qty: 4,
        price: 24.99,
        image_url: "https://images.unsplash.com/photo-1565708097881-b382c57d3dbf?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Dog Leash (Retractable)",
        qty: 2,
        price: 18.99,
        image_url: "https://images.unsplash.com/photo-1591198030640-3bd6a212f5fc?w=200",
      },
      {
        id: crypto.randomUUID(),
        name: "Chew Bone Toy",
        qty: 3,
        price: 8.99,
        image_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200",
      },
    ],
    total: 163.91,
    status: "new",
  },
];

const sampleReviews = [
  {
    user_name: "Yasmine B.",
    rating: 5,
    title: "My cat loves it!",
    body: "Ordered the sea fish food and my cat finished the whole bowl in minutes. Delivery was fast and paying on delivery made it so easy.",
  },
  {
    user_name: "Omar K.",
    rating: 5,
    title: "Great quality, fast delivery",
    body: "The grooming brush is excellent quality. The seller called to confirm the order right away. Highly recommend this store!",
  },
  {
    user_name: "Salma R.",
    rating: 4,
    title: "Happy puppy",
    body: "Bought the soft puppy bed — my dog sleeps on it all day. Would love to see more sizes and colors.",
  },
];

async function seed() {
  await ensureWebTables(turso);

  const existing = await turso.execute({
    sql: "SELECT id FROM admins WHERE email = ?",
    args: ["admin@gmail.com"],
  });
  if (existing.rows.length === 0) {
    await turso.execute({
      sql: "INSERT INTO admins (id, email, password) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), "admin@gmail.com", "admin123"],
    });
    console.log("Admin created: admin@gmail.com / admin123");
  }

  for (const c of sampleCategories) {
    await turso.execute({
      sql: "INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), c.name, slugify(c.name)],
    });
  }

  for (const p of sampleProducts) {
    await turso.execute({
      sql: "INSERT INTO products (id, name, slug, description, price, image_url, category, badge, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        crypto.randomUUID(),
        p.name,
        productSlug(p.name),
        p.description,
        p.price,
        p.image_url,
        p.category,
        p.badge,
        p.tag,
      ],
    });
  }

  const productRows = await turso.execute(
    "SELECT id FROM products ORDER BY created_at DESC LIMIT 3",
  );
  const productIds = productRows.rows.map((r) => String(r.id));
  for (const [i, r] of sampleReviews.entries()) {
    await turso.execute({
      sql: "INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, body, image_url, status) VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, 'approved')",
      args: [crypto.randomUUID(), productIds[i] ?? null, r.user_name, r.rating, r.title, r.body],
    });
  }

  for (const o of sampleOrders) {
    await turso.execute({
      sql: "INSERT INTO orders (id, first_name, last_name, phone, address, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        crypto.randomUUID(),
        o.first_name,
        o.last_name,
        o.phone,
        o.address,
        JSON.stringify(o.items),
        o.total,
        o.status,
      ],
    });
  }

  console.log(
    `Seeded ${sampleCategories.length} categories, ${sampleProducts.length} products, ${sampleOrders.length} orders, ${sampleReviews.length} reviews.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
