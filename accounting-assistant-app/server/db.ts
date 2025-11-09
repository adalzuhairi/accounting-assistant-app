import dotenv from "dotenv";
dotenv.config(); // <--- ajoute ceci avant d'accéder à process.env

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Create a connection to the database
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// For query logging
const queriesLogOptions = { query: true };

// Connect to the database
export const client = postgres(connectionString, { prepare: false });

// Initialize Drizzle with the client and schema
export const db = drizzle(client, { schema, logger: true });