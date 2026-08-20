import { authenticate, requireRole } from "../middleware/auth.js";
import {z} from "zod";
import {prisma} from "../lib/prisma.js"

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category: z.string().optional(),
  gender: z.string().optional(),
  age:      z.string().optional(),
  bodyPart:   z.string().optional(),
  size:    z.string().optional()
});

export async function getProducts(req, res) {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
}

export async function getProductById(req, res) {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch product" });
    }
}

export async function createProduct(req, res) {
    try {
        const validatedData = productSchema.parse(req.body);
        const product = await prisma.product.create({
            data: validatedData
        });
        res.status(201).json(product);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid product data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to create product" });
    }
}

export async function updateProduct(req, res) {
    const { id } = req.params;
    try{
        const body = productSchema.partial().parse(req.body);
        const product = await prisma.product.update({
            where: {id: req.params.id },
            data: body,
    })
} catch (err){
    if (err instanceof z.ZodError){
        return res.status(400).json({error:"validation failed", details:err.issues})
    }
    console.error(err);
        res.status(500).json({error:"failed to update product"})
    }
}

export async function deleteProduct(req, res) {
    const { id } = req.params;
    try {
        const product = await prisma.product.delete({
            where: { id: parseInt(id) },
        });
        res.json(product);
    }
    catch {
        res.status(500).json({ error: "Failed to delete product" });
    }
}