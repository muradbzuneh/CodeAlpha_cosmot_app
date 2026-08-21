

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  image: string;
  category: "complexion" | "body" | "age" | "color";
  gender: "all" | "women" | "men";
  age: "teen" | "adult" | "mature";
  bodyPart: "face" | "lips" | "body" | "eyes";
  size: string;
  isNew?: boolean;
};

export const products: Product[] = [
  {
    id: "satin-balm",
    name: "Satin Balm",
    tagline: "Nourish + Bloom",
    description: "A weightless face balm that melts into skin to seal in moisture overnight.",
    price: 2600,
    image: balm,
    category: "complexion",
    gender: "all",
    age: "adult",
    bodyPart: "face",
    size: "50ml",
    isNew: true,
  },
  {
    id: "mineral-tint",
    name: "Mineral Tint",
    tagline: "Luminous Finish",
    description: "Four buildable shades of mineral pigment for a natural, lit-from-within complexion.",
    price: 1800,
    image: tint,
    category: "color",
    gender: "women",
    age: "adult",
    bodyPart: "face",
    size: "4 × 5g",
    isNew: true,
  },
  {
    id: "dew-serum",
    name: "Dew Serum",
    tagline: "Cellular hydration",
    description: "Hyaluronic + niacinamide concentrate that plumps fine lines and restores radiance.",
    price: 3500,
    image: serum,
    category: "complexion",
    gender: "all",
    age: "mature",
    bodyPart: "face",
    size: "30ml",
    isNew: true,
  },
  {
    id: "cloud-cleanser",
    name: "Cloud Cleanser",
    tagline: "Velvet wash",
    description: "Gentle daily cleanser that removes makeup and impurities without stripping skin.",
    price: 1500,
    image: cleanser,
    category: "complexion",
    gender: "all",
    age: "teen",
    bodyPart: "face",
    size: "150ml",
  },
  {
    id: "vermillion-lip",
    name: "Vermillion Lip",
    tagline: "Satin red",
    description: "Long-wear satin lipstick enriched with shea butter for all-day comfort.",
    price: 2100,
    image: lipstick,
    category: "color",
    gender: "women",
    age: "adult",
    bodyPart: "lips",
    size: "4g",
  },
  {
    id: "noir-mask",
    name: "Noir Mask",
    tagline: "Overnight repair",
    description: "Charcoal + retinol overnight mask for renewed, refined skin by morning.",
    price: 3000,
    image: mask,
    category: "age",
    gender: "all",
    age: "mature",
    bodyPart: "face",
    size: "75ml",
    isNew: true,
  },
  {
    id: "amber-oil",
    name: "Amber Facial Oil",
    tagline: "Cold-pressed glow",
    description: "Squalane-rich facial oil that reinforces the barrier and boosts elasticity.",
    price: 4000,
    image: oil,
    category: "complexion",
    gender: "all",
    age: "adult",
    bodyPart: "face",
    size: "30ml",
    isNew: true,
  },
  {
    id: "stone-powder",
    name: "Stone Powder",
    tagline: "Soft-focus matte",
    description: "Silk-milled finishing powder that blurs pores and controls shine all day.",
    price: 2300,
    image: powder,
    category: "color",
    gender: "women",
    age: "adult",
    bodyPart: "face",
    size: "10g",
  },
  {
    id: "halo-eye",
    name: "Halo Eye Cream",
    tagline: "Brightening lift",
    description: "Peptide eye cream that smooths fine lines and reduces puffiness around the eyes.",
    price: 2900,
    image: eye,
    category: "age",
    gender: "all",
    age: "mature",
    bodyPart: "eyes",
    size: "15ml",
    isNew: true,
  },
  {
    id: "ember-mist",
    name: "Ember Body Mist",
    tagline: "Warm amber veil",
    description: "Hydrating amber-rose body mist with a soft, lingering signature scent.",
    price: 2500,
    image: mist,
    category: "body",
    gender: "all",
    age: "adult",
    bodyPart: "body",
    size: "100ml",
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
