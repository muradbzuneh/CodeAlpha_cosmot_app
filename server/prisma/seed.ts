import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

const IMG = (file: string) => `/uploads/products/${file}`;

const products = [
  { name: "Satin Balm", 
    description: "A weightless face balm that melts into skin to seal in moisture overnight.",
    price: 2600,
    stock: 50,
    imageUrl: IMG("product-balm.jpg"),
    category: "complexion",
    gender: "all", 
    age: "adult",
    bodyPart: "face",
    size: "50ml",  
    isNew: true  },
  { 
    name: "Mineral Tint",
    description: "Four buildable shades of mineral pigment for a natural, lit-from-within complexion.",  
    price: 1800,
    stock: 30,
    imageUrl: IMG("product-tint.jpg"),
    category: "color", 
    gender: "women",
    age: "adult",
    bodyPart: "face",
    size: "4 × 5g",
    isNew: false },
  { name: "Dew Serum",         description: "Hyaluronic + niacinamide concentrate that plumps fine lines and restores radiance.",        price: 3500, stock: 40, imageUrl: IMG("product-serum.jpg"),   category: "complexion", gender: "all",   age: "mature", bodyPart: "face",  size: "30ml",   isNew: true  },
  { name: "Cloud Cleanser",    description: "Gentle daily cleanser that removes makeup and impurities without stripping skin.",           price: 1500, stock: 60, imageUrl: IMG("product-cleanser.jpg"),category: "complexion", gender: "all",   age: "teen",   bodyPart: "face",  size: "150ml",  isNew: false },
  { name: "Vermillion Lip",    description: "Long-wear satin lipstick enriched with shea butter for all-day comfort.",                    price: 2100, stock: 45, imageUrl: IMG("product-lipstick.jpg"),category: "color",      gender: "women", age: "adult",  bodyPart: "lips", size: "4g",     isNew: false },
  { name: "Noir Mask",         description: "Charcoal + retinol overnight mask for renewed, refined skin by morning.",                   price: 3000, stock: 35, imageUrl: IMG("product-mask.jpg"),    category: "age",        gender: "all",   age: "mature", bodyPart: "face",  size: "75ml",   isNew: true  },
  { name: "Amber Facial Oil",  description: "Squalane-rich facial oil that reinforces the barrier and boosts elasticity.",               price: 4000, stock: 25, imageUrl: IMG("product-oil.jpg"),     category: "complexion", gender: "all",   age: "adult",  bodyPart: "face",  size: "30ml",   isNew: false }, 
  { name: "Stone Powder",      description: "Silk-milled finishing powder that blurs pores and controls shine all day.",                 price: 2300, stock: 55, imageUrl: IMG("product-powder.jpg"),  category: "color",      gender: "women", age: "adult",  bodyPart: "face",  size: "10g",    isNew: false },
  { name: "Halo Eye Cream",    description: "Peptide eye cream that smooths fine lines and reduces puffiness around the eyes.",          price: 2900, stock: 30, imageUrl: IMG("product-eye.jpg"),     category: "age",        gender: "all",   age: "mature", bodyPart: "eyes",  size: "15ml",   isNew: true  },
  { name: "Ember Body Mist",   description: "Hydrating amber-rose body mist with a soft, lingering signature scent.",                    price: 2500, stock: 40, imageUrl: IMG("product-mist.jpg"),    category: "body",       gender: "all",   age: "adult",  bodyPart: "body", size: "100ml",  isNew: false },
];

async function main() {
  console.log("Seeding products...");

  for (const product of products) {
    const id = product.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.product.upsert({
      where: { id },
      update: { imageUrl: product.imageUrl },
      create: { id, ...product },
    });
  }

  const count = await prisma.product.count();
  console.log(`Done. ${count} products in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
