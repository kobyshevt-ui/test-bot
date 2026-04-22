import { Bot, Context, session, SessionFlavor, InlineKeyboard } from "grammy";
import db from "../db/index.ts";

interface SessionData {
  step: "idle" | "awaiting_name" | "browsing_catalog" | "confirming_order";
  orderData?: {
    productId: number;
    amount: number;
  };
}

export type MyContext = Context & SessionFlavor<SessionData>;

export function createBot(token: string) {
  const bot = new Bot<MyContext>(token);

  bot.use(session({ initial: () => ({ step: "idle" }) }));

  bot.use(async (ctx, next) => {
    if (ctx.from) {
      const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(ctx.from.id);
      if (!user) {
        db.prepare('INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)')
          .run(ctx.from.id, ctx.from.username || 'unknown', ctx.from.first_name);
      }
    }
    await next();
  });

  const mainMenu = (ctx: MyContext) => {
    return ctx.reply(`👋 Привет, ${ctx.from?.first_name || 'друг'}! Я тестовый бот для записи и заказов. 🤖\n\nВыберите действие:`, {
      reply_markup: new InlineKeyboard()
        .text("🛍 Каталог товаров", "catalog").row()
        .text("📅 Мои заказы", "my_orders").row()
        .text("ℹ️ О нас", "about")
    });
  };

  bot.command("start", async (ctx) => {
    ctx.session.step = "idle";
    await mainMenu(ctx);
  });

  bot.callbackQuery("main_menu", async (ctx) => {
    await mainMenu(ctx);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("about", async (ctx) => {
    await ctx.editMessageText("ℹ️ *О нас*\n\nМы лучший сервис для автоматизации вашего бизнеса! 🚀\n\n📍 Адрес: Москва, ул. Технологий, 1\n📞 Телефон: +7 (999) 000-00-00\n🌐 Сайт: [example.com](http://example.com)", {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("🏠 В главное меню", "main_menu")
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("my_orders", async (ctx) => {
    if (!ctx.from) return;
    const orders = db.prepare(`
      SELECT o.*, p.name FROM orders o 
      JOIN products p ON o.product_id = p.id 
      WHERE o.user_id = (SELECT id FROM users WHERE telegram_id = ?)
      ORDER BY o.created_at DESC LIMIT 10
    `).all(ctx.from.id) as any[];

    let text = "📅 *Ваши последние заказы:*\n\n";
    if (orders.length === 0) {
      text += "У вас пока нет заказов. Пора что-нибудь купить! 😉";
    } else {
      orders.forEach(o => {
        text += `▫️ *${o.name}* — ${o.amount}₽\nСтатус: ${o.status === 'paid' ? '✅ Оплачен' : '⏳ Ожидает'}\nДата: ${new Date(o.created_at).toLocaleDateString()}\n\n`;
      });
    }

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("🏠 В главное меню", "main_menu")
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("catalog", async (ctx) => {
    const products = db.prepare('SELECT * FROM products').all() as any[];
    let text = "📦 *Наш каталог:*\n\nВыберите товар из списка ниже:";
    const keyboard = new InlineKeyboard();

    products.forEach(p => {
      keyboard.text(`${p.name} — ${p.price}₽`, `buy_${p.id}`).row();
    });

    keyboard.text("🏠 В главное меню", "main_menu");
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: keyboard });
    await ctx.answerCallbackQuery();
  });

  // --- БЛОК ОПЛАТЫ (ЮKassa / Тинькофф Pay) ---
  
  bot.command("pay", async (ctx) => {
    // Пример создания инвойса через команду
    await ctx.replyWithInvoice(
      "Тестовый платеж", 
      "Оплата услуг через Telegram Payments", 
      "payload_test", 
      process.env.VITE_PAYMENT_TOKEN || "", // Токен от BotFather
      "RUB", 
      [{ label: "Услуга", amount: 10000 }] // Сумма в копейках (100.00 руб)
    );
  });

  bot.callbackQuery(/^buy_(\d+)$/, async (ctx) => {
    const productId = parseInt(ctx.match[1]);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    
    ctx.session.step = "confirming_order";
    ctx.session.orderData = { productId, amount: product.price };

    const text = `💳 *Оформление заказа*\n\nТовар: *${product.name}*\nЦена: *${product.price}₽*\n\nНажмите «Оплатить», чтобы перейти к защищенному шлюзу оплаты (ЮKassa/Тинькофф).`;
    
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("💳 Оплатить сейчас", `pay_now_${product.id}`).row()
        .text("◀️ Назад в каталог", "catalog")
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^pay_now_(\d+)$/, async (ctx) => {
    const productId = parseInt(ctx.match[1]);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    const token = process.env.VITE_PAYMENT_TOKEN;

    if (!token || token === "MY_PROVIDER_TOKEN") {
      await ctx.reply("❌ Ошибка: Провайдер оплаты не настроен. Добавьте VITE_PAYMENT_TOKEN в Secrets.");
      return await ctx.answerCallbackQuery();
    }

    await ctx.replyWithInvoice(
      product.name,
      product.description || "Оплата товара",
      `order_${productId}_${Date.now()}`,
      token,
      "RUB",
      [{ label: product.name, amount: Math.round(product.price * 100) }] // Сумма в копейках
    );
    await ctx.answerCallbackQuery();
  });

  // Обязательное подтверждение перед списанием
  bot.on("pre_checkout_query", async (ctx) => {
    await ctx.answerPreCheckoutQuery(true);
  });

  // Обработка успешного платежа
  bot.on("message:successful_payment", async (ctx) => {
    const payload = ctx.message.successful_payment.invoice_payload;
    const amount = ctx.message.successful_payment.total_amount / 100;
    
    // Извлекаем ID товара из payload (например "order_1_12345")
    const productId = parseInt(payload.split('_')[1]);

    if (ctx.from) {
      db.prepare("INSERT INTO orders (user_id, product_id, amount, status) VALUES ((SELECT id FROM users WHERE telegram_id = ?), ?, ?, 'paid')")
        .run(ctx.from.id, productId, amount);
    }

    await ctx.reply(`✅ *Оплата принята!*\n\nСумма: ${amount}₽\nСпасибо за покупку! Информация о заказе передана администратору.`, { parse_mode: "Markdown" });
  });

  // --- КОНЕЦ БЛОКА ОПЛАТЫ ---

  bot.command("admin", async (ctx) => {
    const user = db.prepare('SELECT is_admin FROM users WHERE telegram_id = ?').get(ctx.from?.id) as any;
    if (user?.is_admin || ctx.from?.id === 12345678) {
      await ctx.reply("👨‍💻 *Админ-панель*\n\nВы авторизованы как администратор.", { parse_mode: "Markdown" });
    } else {
      await ctx.reply("❌ У вас нет прав администратора.");
    }
  });

  return bot;
}
