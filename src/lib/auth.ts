import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import md5 from "md5";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key if available (for bypassing RLS), otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error("Supabase key is required. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.");
}

if (!supabaseUrl) {
  throw new Error("Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple password hashing (in production, use bcrypt)
export function hashPassword(password: string): string {
  return md5(password + (process.env.PASSWORD_SALT || "foloup_salt_2024"));
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate a simple JWT-like token
export function generateToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    iat: Date.now(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = md5(encoded + (process.env.JWT_SECRET || "foloup_jwt_secret"));
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): { valid: boolean; userId?: string } {
  try {
    const [encoded, signature] = token.split(".");
    const expectedSignature = md5(encoded + (process.env.JWT_SECRET || "foloup_jwt_secret"));
    
    if (signature !== expectedSignature) {
      return { valid: false };
    }
    
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
    
    if (payload.exp < Date.now()) {
      return { valid: false };
    }
    
    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false };
  }
}

// Database operations - using existing "user" table
export async function createUser(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}) {
  const hashedPassword = hashPassword(data.password);
  const userId = nanoid();
  
  const { data: user, error } = await supabase
    .from("user")  // Using existing "user" table
    .insert({
      id: userId,
      email: data.email.toLowerCase(),
      password_hash: hashedPassword,
      first_name: data.first_name,
      last_name: data.last_name,
      status: 'active',
      role: 'admin',
    })
    .select()
    .single();
  
  if (error) throw error;
  return user;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("user")  // Using existing "user" table
    .select("*")
    .eq("email", email.toLowerCase())
    .single();
  
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("user")  // Using existing "user" table
    .select("id, email, first_name, last_name, avatar_url, organization_id, role, status, created_at, updated_at")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserLastLogin(userId: string) {
  const { error } = await supabase
    .from("user")
    .update({ last_login: new Date().toISOString() })
    .eq("id", userId);
  
  if (error) console.error("Failed to update last login:", error);
}
