
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://atcourwrpscnqhzofnoe.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


// Variable para almacenar el día activo del menú (por defecto Jueves)
let activeMenuDay = 'Jueves';

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Obtener productos (usar el día activo seleccionado por el admin)
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('day', activeMenuDay)
      .order('category')
      .order('name');

    if (error) {
      console.error('Error en GET /api/products (Supabase):', error.message);
      return res.status(500).send('Error al obtener productos: ' + error.message);
    }

    console.log('Productos obtenidos (Supabase):', data);
    res.json(data);
  } catch (err) {
    console.error('Error inesperado en GET /api/products (Supabase):', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Obtener todos los productos (para admin)
app.get('/api/products/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      console.error('Error en GET /api/products/all (Supabase):', error.message);
      return res.status(500).send('Error al obtener todos los productos: ' + error.message);
    }

    console.log('Todos los productos obtenidos (Supabase):', data);
    res.json(data);
  } catch (err) {
    console.error('Error inesperado en GET /api/products/all (Supabase):', err.message);
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
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, description: description || '', price, category, day }])
      .select();

    if (error) {
      console.error('Error en POST /api/products (Supabase):', error.message);
      return res.status(500).send('Error al agregar producto: ' + error.message);
    }

    res.json(data[0]);
  } catch (err) {
    console.error('Error inesperado en POST /api/products (Supabase):', err.message);
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
    const { data, error } = await supabase
      .from('products')
      .update({ name, description: description || '', price, category, day })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error en PUT /api/products/:id (Supabase):', error.message);
      return res.status(500).send('Error al actualizar producto: ' + error.message);
    }

    if (data.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }

    res.json(data[0]);
  } catch (err) {
    console.error('Error inesperado en PUT /api/products/:id (Supabase):', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Eliminar producto
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error en DELETE /api/products/:id (Supabase):', error.message);
      return res.status(500).send('Error al eliminar producto: ' + error.message);
    }

    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error inesperado en DELETE /api/products/:id (Supabase):', err.message);
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
