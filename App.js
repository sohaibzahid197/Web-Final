const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const ejs = require('ejs');

app.set('view engine', 'ejs'); // Set the view engine to EJS
app.use(bodyParser.urlencoded({ extended: true }));

let products = []; 

fs.readFile('products.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading products data:', err);
  } else {
    products = JSON.parse(data);
  }
});

// Function to find a product by its ID
function findProductById(id) {
  const product = products.find((product) => product.id === parseInt(id));
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

// Configure session middleware
app.use(
  session({
    secret: 'my-secret-key',
    resave: false,
    saveUninitialized: true
  })
);

// Root route
app.get('/', (req, res) => {
  res.render('index', { products });
});

app.get('/edit/:id', (req, res) => {
  const { id } = req.params;
  try {
    const product = findProductById(id);
    res.render('edit', { product });
  } catch (error) {
    res.status(404).send('Product not found');
  }
});

// Update product route
app.post('/update/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, is_available, category_name } = req.body;
  try {
    const product = findProductById(id);
    product.name = name;
    product.price = price;
    product.is_available = is_available === 'true';
    product.category_name = category_name;
    fs.writeFile('products.json', JSON.stringify(products), 'utf8', (err) => {
      if (err) {
        console.error('Error updating product:', err);
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
  }
  res.redirect('/');
});

app.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  try {
    const productIndex = products.findIndex((product) => product.id === parseInt(id));
    if (productIndex !== -1) {
      products.splice(productIndex, 1);
      fs.writeFile('products.json', JSON.stringify(products), 'utf8', (err) => {
        if (err) {
          console.error('Error deleting product:', err);
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.json({ success: false });
  }
});

app.post('/add-to-cart', (req, res) => {
  const { id, quantity } = req.body;
  const product = findProductById(id);

  const cartItem = {
    name: product.name,
    quantity: parseInt(quantity),
    unitPrice: product.price,
    totalPrice: product.price * parseInt(quantity),
  };

  req.session.cart = req.session.cart || [];
  req.session.cart.push(cartItem);

  res.redirect('/cart');
});

// Cart route
app.get('/cart', (req, res) => {
  const calculateTotalBill = (cart) => {
    let totalBill = 0;
    cart.forEach((item) => {
      totalBill += item.totalPrice;
    });
    return totalBill;
  };

  res.render('cart', { cart: req.session.cart || [], calculateTotalBill });
});

// Start the server
app.listen(9000, () => {
  console.log('Server is running on port 9000, http://localhost:9000/');
});
