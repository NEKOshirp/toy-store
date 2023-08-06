const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');



const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { connectToDatabase } = require('./db');
const { getProducts,createProduct } = require('./product');

connectToDatabase();
 
// Cấu hình sử dụng Handlebars

app.use(bodyParser.json());

app.set('view engine', 'hbs');

// Sử dụng body-parser để xử lý dữ liệu gửi lên từ form
app.use(bodyParser.urlencoded({ extended: false }));

// Đường dẫn tới các tệp tin tĩnh (CSS, JS, hình ảnh)
app.use(express.static('public'));



app.get('/listproduct',async (req,res)=>{
  const items = await getProducts();
  res.render('listproduct',{products:items})
})

app.post('/add', async (req, res) => {
  const { name, price } = req.body;
  try {
    const newItem = await createProduct({ 'name':name, 'price': parseFloat(price) });
    res.redirect('/')
  } catch (err) {
    res.status(400).json({ message: err.message });
  }   
});
// API để cập nhật thông tin sản phẩm theo ID
app.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const updatedFields = {};

    if (name) {
      updatedFields.name = name;
    }
    if (price) {
      updatedFields.price = parseFloat(price);
    }

    const modifiedCount = await updateProduct(id, updatedFields);

    if (modifiedCount > 0) {
      res.redirect('/listproduct');
    } else {
      res.status(404).json({ message: 'Product not found or no changes were made.' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// API để xóa sản phẩm theo ID
app.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await deleteProduct(id);

    if (deletedCount > 0) {
      res.redirect('/listproduct');
    } else {
      res.status(404).json({ message: 'Product not found or already deleted.' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



app.get('/product', (req, res) => {
  res.render('product');
});

// Route cho trang chủ
app.get('/', (req, res) => {
  res.render('home');
});

// Route cho trang about
app.get('/about', (req, res) => {
  res.render('about');
});

// Route cho trang help
app.get('/help', (req, res) => {
  res.render('help');
});

// Route cho trang signin
app.get('/signin', (req, res) => {
    res.render('signin');
  });

  // Route cho trang signup
app.get('/signup', (req, res) => {
    res.render('signup');
  });

// Xử lý form trong trang help
app.post('/help', (req, res) => {
  const email = req.body.email;
  res.render('thankyou', { email });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Ứng dụng đang chạy tại http://localhost:${PORT}`);
});
