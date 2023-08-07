const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const { connectToDatabase } = require('./db');
const { getProducts,createProduct,getProductById, editProduct, deleteProduct} = require('./product');

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
app.get('/edit/:id', async (req, res) => {
  const productId = req.params.id;
  const product = await db.getProductById(productId);

  if (!product) {
    return res.status(404).send('Sản phẩm không tồn tại.');
  }

  res.render('editproduct', { product });
});

// Route handler để xử lý khi người dùng yêu cầu xóa sản phẩm
app.get('/delete/:name', async (req, res) => {
  const productname = req.params.name;

  const deleted = await db.deleteProduct(productname);

  if (!deleted) {
    return res.status(404).send('Sản phẩm không tồn tại.');
  }

  res.redirect('/listproduct');
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
// Route cho trang help
app.get('/signin', (req, res) => {
  res.render('signin');
});
// Route cho trang help
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
