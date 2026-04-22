import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { createBot } from "./src/bot/bot.ts";
import db from "./src/db/index.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Маршруты
  app.get("/api/stats", (req, res) => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
      const totalRev = db.prepare("SELECT SUM(amount) as sum FROM orders WHERE status = 'paid'").get() as any;
      const recentOrders = db.prepare(`
        SELECT o.*, u.username, p.name as product_name 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        JOIN products p ON o.product_id = p.id 
        ORDER BY o.created_at DESC LIMIT 5
      `).all();

      res.json({
        users: userCount?.count || 0,
        orders: orderCount?.count || 0,
        revenue: totalRev?.sum || 0,
        recentOrders: recentOrders || []
      });
    } catch (e) {
      console.error("[API Error] /api/stats:", e);
      res.status(500).json({ error: "Internal Server Error", details: String(e) });
    }
  });

  app.get("/api/users", (req, res) => {
    try {
      const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/all-orders", (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT o.*, u.username, p.name as product_name 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        JOIN products p ON o.product_id = p.id 
        ORDER BY o.created_at DESC
      `).all();
      res.json(orders);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/broadcast", (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    try {
      const users = db.prepare('SELECT telegram_id FROM users').all() as any[];
      console.log(`[BROADCAST] Сообщение: "${message}" отправляется ${users.length} пользователям`);
      res.json({ success: true, count: users.length });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Запуск бота (ФОНОВЫЙ)
  const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (BOT_TOKEN && BOT_TOKEN !== "MY_BOT_TOKEN" && BOT_TOKEN.includes(":")) {
    try {
      const bot = createBot(BOT_TOKEN);
      bot.start({
        onStart: (botInfo) => console.log(`[BOT] Успешно запущен как @${botInfo.username}`),
      }).catch(err => {
        console.error("[BOT] Ошибка запуска:", err);
      });
    } catch (e) {
      console.error("[BOT] Не удалось инициализировать бота:", e);
    }
  } else {
    console.warn("[BOT] Токен не настроен или некорректен. Бот не будет работать.");
  }

  // Vite
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Запуск Vite в режиме middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Слушает на http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[SERVER] Ошибка при старте:", err);
});
