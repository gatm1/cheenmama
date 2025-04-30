const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('Conectado a PostgreSQL'))
  .catch(err => console.error('Error al conectar a PostgreSQL:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar configuraciones por defecto si no existen
async function initializeSettings() {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (result.rows.length === 0) {
      // Si no hay registro, insertar uno con valores por defecto
      await pool.query(
        'INSERT INTO settings (whatsapp_number, special_orders_phone, admin_password, active_menu_day) VALUES ($1, $2, $3, $4)',
        ['+523334906992', '3334906992', 'zirus', 'Jueves']
      );
      console.log('Configuraciones por defecto inicializadas');
    }
  } catch (err) {
    console.error('Error al inicializar configuraciones:', err);
  }
}

// Llamar a la función de inicialización al iniciar el servidor
initializeSettings();

// Obtener productos (usar el día activo almacenado en la base de datos)
app.get('/api/products', async (req, res) => {
  try {
    // Obtener el día activo desde la base de datos
    const settingsResult = await pool.query('SELECT active_menu_day FROM settings WHERE id = 1');
    if (settingsResult.rows.length === 0) {
      return res.status(404).send('Configuraciones no encontradas');
    }
    const activeMenuDay = settingsResult.rows[0].active_menu_day;

    const result = await pool.query(
      'SELECT * FROM products WHERE day = $1 ORDER BY category, name',
      [activeMenuDay]
    );
    console.log('Productos obtenidos:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /api/products:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Obtener todos los productos (para admin)
app.get('/api/products/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY category, name');
    console.log('Todos los productos obtenidos:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /api/products/all:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Agregar producto
app.post('/api/products', async (req, res) => {
  const { name, description, price, category, day } = req.body;
  if (!name || !price || !category || !day) {
    return res.status(400).send('Faltan campos requeridos');
  }
  // Validar que el día sea permitido
  if (!['Jueves', 'Viernes', 'Sábado'].includes(day)) {
    return res.status(400).send('Día inválido. Debe ser "Jueves", "Viernes" o "Sábado".');
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category, day) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || '', price, category, day]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en POST /api/products:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Actualizar producto
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, day } = req.body;
  if (!name || !price || !category || !day) {
    return res.status(400).send('Faltan campos requeridos');
  }
  // Validar que el día sea permitido
  if (!['Jueves', 'Viernes', 'Sábado'].includes(day)) {
    return res.status(400).send('Día inválido. Debe ser "Jueves", "Viernes" o "Sábado".');
  }
  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, category = $4, day = $5 WHERE id = $6 RETURNING *',
      [name, description || '', price, category, day, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /api/products/:id:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Eliminar producto
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error en DELETE /api/products/:id:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Establecer el día activo del menú (guardar en la base de datos)
app.post('/api/set-menu-day', async (req, res) => {
  const { day } = req.body;
  if (!['Jueves', 'Viernes', 'Sábado'].includes(day)) {
    return res.status(400).send('Día inválido. Debe ser "Jueves", "Viernes" o "Sábado".');
  }
  try {
    const result = await pool.query(
      'UPDATE settings SET active_menu_day = $1 WHERE id = 1 RETURNING *',
      [day]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Configuraciones no encontradas');
    }
    console.log(`Día activo del menú cambiado a: ${day}`);
    res.json({ message: `Menú activo cambiado a ${day}` });
  } catch (err) {
    console.error('Error en POST /api/set-menu-day:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Obtener el día activo del menú (leer desde la base de datos)
app.get('/api/get-menu-day', async (req, res) => {
  try {
    const result = await pool.query('SELECT active_menu_day FROM settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).send('Configuraciones no encontradas');
    }
    res.json({ day: result.rows[0].active_menu_day });
  } catch (err) {
    console.error('Error en GET /api/get-menu-day:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Obtener las configuraciones
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).send('Configuraciones no encontradas');
    }
    res.json({
      whatsappNumber: result.rows[0].whatsapp_number,
      specialOrdersPhone: result.rows[0].special_orders_phone,
      adminPassword: result.rows[0].admin_password
    });
  } catch (err) {
    console.error('Error en GET /api/settings:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Actualizar las configuraciones
app.post('/api/settings', async (req, res) => {
  const { whatsappNumber, specialOrdersPhone, adminPassword } = req.body;
  if (!whatsappNumber || !specialOrdersPhone || !adminPassword) {
    return res.status(400).send('Faltan campos requeridos');
  }
  try {
    const result = await pool.query(
      'UPDATE settings SET whatsapp_number = $1, special_orders_phone = $2, admin_password = $3 WHERE id = 1 RETURNING *',
      [whatsappNumber, specialOrdersPhone, adminPassword]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Configuraciones no encontradas');
    }
    res.json({ message: 'Configuraciones actualizadas con éxito' });
  } catch (err) {
    console.error('Error en POST /api/settings:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Verificar la contraseña de administrador
app.post('/api/verify-admin-password', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).send('Falta la contraseña');
  }
  try {
    const result = await pool.query('SELECT admin_password FROM settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.status(404).send('Configuraciones no encontradas');
    }
    const storedPassword = result.rows[0].admin_password;
    if (password === storedPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
  } catch (err) {
    console.error('Error en POST /api/verify-admin-password:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
