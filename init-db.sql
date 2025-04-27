CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50)
);

INSERT INTO products (name, description, price, category) VALUES
('Lonche de Bistec', 'Lonche con bistec jugoso', 45.00, 'Platillos'),
('Lonche de Pierna', 'Lonche con pierna sazonada', 45.00, 'Platillos'),
('Chilaquiles con Queso', 'Chilaquiles crujientes con queso', 45.00, 'Platillos'),
('Hamburguesa Grande con Queso', 'Hamburguesa jugosa con queso derretido', 45.00, 'Platillos'),
('Agua de Jamaica', 'Refrescante agua fresca de jamaica', 20.00, 'Bebidas'),
('Agua de Kalúa con Nuez', 'Agua fresca con sabor a kalúa y nuez', 20.00, 'Bebidas'),
('Agua de Horchata de Fresa', 'Horchata con un toque de fresa', 20.00, 'Bebidas'),
('Chocoflan', 'Delicioso postre combinado de chocolate y flan', 50.00, 'Postres'),
('Gelatina Cristalina de Frutas', 'Gelatina fresca con trozos de fruta', 45.00, 'Postres'),
('Pay de Queso con Cajeta y Almendras', 'Pay cremoso con cajeta y almendras', 50.00, 'Postres'),
('Flan Napolitano', 'Flan suave y cremoso', 40.00, 'Postres');