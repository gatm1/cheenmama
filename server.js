const express = require('express');
const { createClient } from '@supabase/supabase-js';
const path = require('path');
const app = express();

// Configuración de Supabase (¡ÚNICA declaración!)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Variable para almacenar el día activo del menú (por defecto Jueves)
let activeMenuDay = 'Jueves';


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

// ... el resto de tus rutas ...
