import Database from 'better-sqlite3';
import path from 'path';

let db: any;

try {
  const dbPath = path.resolve(process.cwd(), 'database.sqlite');
  console.log(`[DB] Инициализация базы данных по пути: ${dbPath}`);
  db = new Database(dbPath);

  // Инициализация таблиц
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      telegram_id INTEGER UNIQUE,
      username TEXT,
      first_name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      price REAL,
      image_url TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      amount REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Очистим старое меню и добавим новое
  db.prepare('DELETE FROM products').run();
  console.log("[DB] Наполнение меню свежим кофе...");
  const insertProduct = db.prepare('INSERT INTO products (name, description, price, category) VALUES (?, ?, ?, ?)');
  
  insertProduct.run('Эспрессо', 'Классический шот бодрости (30 мл)', 180, 'Кофе');
  insertProduct.run('Американо', 'Черный кофе на основе эспрессо (200 мл)', 230, 'Кофе');
  insertProduct.run('Капучино', 'Баланс эспрессо и нежной молочной пенки (стандарт)', 320, 'Кофе');
  insertProduct.run('Латте', 'Мягкий молочный вкус (большой)', 380, 'Кофе');
  insertProduct.run('Флэт Уайт', 'Насыщенный молочный кофе с двойным эспрессо', 350, 'Кофе');
  insertProduct.run('Раф-кофе', 'Нежный сливочный вкус с натуральной ванилью', 420, 'Кофе');
  insertProduct.run('Колд Брю', 'Холодный кофе длительной экстракции (фильтр)', 390, 'Холодный кофе');
  insertProduct.run('Бамбл-кофе', 'Освежающий микс с карамелью и апельсиновым соком', 450, 'Холодный кофе');
  insertProduct.run('Мокко', 'Кофейный десерт с добавлением шоколада', 410, 'Кофе');
  insertProduct.run('Аффогато', 'Эспрессо с шариком сливочного мороженого', 480, 'Десерты');
  insertProduct.run('Ристретто', 'Максимально концентрированный и крепкий шот', 170, 'Кофе');
  insertProduct.run('Вьетнамский кофе', 'Традиционный рецепт со сладкой сгущенкой', 360, 'Кофе');
  insertProduct.run('Кофе по-турецки', 'Приготовленный в джезве на песке', 280, 'Кофе');
  insertProduct.run('Нитро Кофе', 'Газированный азотом для кремовой текстуры', 440, 'Холодный кофе');
  insertProduct.run('Дрип-кофе', 'Черный кофе из пакета-дрипа для ценителей', 210, 'Кофе');
} catch (error) {
  console.error("[DB] Критическая ошибка базы данных:", error);
  // Заглушка, чтобы приложение не падало
  db = {
    prepare: () => ({
      get: () => ({ count: 0, sum: 0 }),
      all: () => [],
      run: () => {}
    }),
    exec: () => {}
  };
}

export default db;
