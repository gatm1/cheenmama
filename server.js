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

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
