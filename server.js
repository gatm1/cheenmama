const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// Variable para almacenar el día activo del menú (por defecto Jueves)
let activeMenuDay = 'Jueves';

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
        'INSERT INTO settings (whatsapp_number, special_orders_phone, admin_password) VALUES ($1, $2, $3)',
        ['+523318331309', '3318331309', 'zirus']
      );
      console.log('Configuraciones por defecto inicializadas');
    }
    // No necesitamos verificar si admin_password es 'temporary' porque ya no usamos hash
  } catch (err) {
    console.error('Error al inicializar configuraciones:', err);
  }
}

// Llamar a la función de inicialización al iniciar el servidor
initializeSettings();

// Obtener productos (usar el día activo seleccionado por el admin)
app.get('/api/products', async (req, res) => {
  try {
    // Usar el día activo seleccionado por el admin
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

// Establecer el día activo del menú
app.post('/api/set-menu-day', (req, res) => {
  const { day } = req.body;
  if (day !== 'Jueves' && day !== 'Viernes') {
    return res.status(400).send('Día inválido. Debe ser "Jueves" o "Viernes".');
  }
  activeMenuDay = day;
  console.log(`Día activo del menú cambiado a: ${activeMenuDay}`);
  res.json({ message: `Menú activo cambiado a ${day}` });
});

// Obtener el día activo del menú
app.get('/api/get-menu-day', (req, res) => {
  res.json({ day: activeMenuDay });
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
      [whatsappNumber, specialOrdersPhone, adminPassword] // Guardamos adminPassword en texto plano
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
