import { db } from "../db";
import { users, transactions, products, jobs, ratings } from "../db/schema";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import bcrypt from "bcryptjs";

const SHEETS_DIR = path.resolve(process.cwd(), "../sheets");

const parseCSV = (fileName: string): any[] => {
  const filePath = path.join(SHEETS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
    return [];
  }
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
};

const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  try {
    // Format is likely DD/MM/YYYY HH:MM:SS or similar
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date();

    if (timePart) {
      const [hours, minutes, seconds] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
    }
    return new Date(year, month - 1, day);
  } catch (e) {
    return new Date();
  }
};

const runMigration = async () => {
  console.log("🚀 Iniciando migración de datos...");

  try {
    // 1. Asegurar Usuario SISTEMA
    console.log("⚙️ Configurando usuario SISTEMA...");
    await db.insert(users).values({
      id: "SISTEMA",
      name: "Sistema Túmin",
      phone: "0000000000",
      nip: await bcrypt.hash("SISTEMA_SECURE_KEY", 10),
      region: "GENERAL",
      role: "COORDINADOR",
      status: "ACTIVO",
    }).onConflictDoNothing();

    // 2. Migrar Usuarios
    console.log("👥 Migrando usuarios...");
    const usersData = parseCSV("Tumin_Core_Database - USUARIOS.csv");
    const validUserIds = new Set(usersData.map((u: any) => u.user_id));
    validUserIds.add("SISTEMA");

    for (const row of usersData) {
      let role: "SOCIO" | "COORDINADOR_LOCAL" | "COORDINADOR" = "SOCIO";
      if (row.rol === "COORDINADOR LOCAL") role = "COORDINADOR_LOCAL";
      if (row.rol === "COORDINADOR") role = "COORDINADOR";

      const createdAt = parseDate(row.fecha_creacion);

      await db.insert(users).values({
        id: row.user_id,
        name: row.nombre,
        phone: row.teléfono,
        email: row.email || null,
        nip: await bcrypt.hash(row.nip || "1234", 10),
        region: row.region,
        role,
        referrerId: validUserIds.has(row.referido_por) ? row.referido_por : null,
        status: (row.activo === "SÍ" || row.activo === "SI") ? "ACTIVO" : "CONGELADO",
        createdAt,
      }).onConflictDoNothing();
    }

    // 3. Migrar Ledger (Transacciones)
    console.log("💰 Migrando historial contable...");
    const ledgerData = parseCSV("Tumin_Core_Database - LEDGER.csv");
    
    // Process transactions in chunks to avoid large memory/query issues
    const chunkSize = 100;
    for (let i = 0; i < ledgerData.length; i += chunkSize) {
      const chunk = ledgerData.slice(i, i + chunkSize);
      const transactionsToInsert = chunk.map((row: any) => {
        let type: "TRANSFERENCIA" | "BONO" | "MINADO" | "PAGO_TRABAJO" = "TRANSFERENCIA";
        if (row.type === "Minado Diario") type = "MINADO";
        if (row.type.includes("Bono") || row.type.includes("Auditoría")) type = "BONO";
        if (row.type.includes("Trabajo")) type = "PAGO_TRABAJO";

        const createdAt = parseDate(row.timestamp);

        return {
          fromId: validUserIds.has(row.from_user) ? row.from_user : "SISTEMA",
          toId: validUserIds.has(row.to_user) ? row.to_user : "SISTEMA",
          amount: parseFloat(row.amount) || 0,
          concept: row.type,
          type,
          createdAt,
        };
      });

      if (transactionsToInsert.length > 0) {
        await db.insert(transactions).values(transactionsToInsert);
      }
    }

    // 4. Migrar Productos
    console.log("📦 Migrando bazar...");
    const productsData = parseCSV("Tumin_Core_Database - PRODUCTOS.csv");
    for (const row of productsData) {
      const sellerId = row.ID_Socio;
      if (!validUserIds.has(sellerId)) {
        console.warn(`⚠️ Saltando producto de socio desconocido: ${sellerId}`);
        continue;
      }
      
      await db.insert(products).values({
        sellerId: sellerId,
        name: row.Producto,
        priceMxn: parseFloat(row.Precio_MXN || "0"),
        priceTumin: parseFloat(row.Precio_Tumin || "0"),
        categories: row.Categoría ? row.Categoría.split(",").map((c: string) => c.trim()) : [],
        region: row.Region || "GENERAL",
        status: row.Activo === "ACTIVO" ? "ACTIVO" : "INACTIVO",
        imageUrl: null,
      }).onConflictDoNothing();
    }

    console.log("✅ Migración finalizada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
};

runMigration();
