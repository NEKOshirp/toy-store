const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const ejs = require('ejs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://truong:truong2001@cluster0.g2wdmun.mongodb.net/toys', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Đã kết nối tới MongoDB');
}).catch((err) => {
  console.error('Lỗi kết nối MongoDB:', err);
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String
  }
});

const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

const User = mongoose.model('User', userSchema);

app.use(session({
  secret: 'mysecretkey',
  resave: true,
  saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('public'));

const resizeImage = async (file) => {
  const filePath = path.join('public/uploads', file.filename);

  try {
    const imageBuffer = await sharp(filePath).toBuffer();
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(300, 200)
      .toBuffer();
    await sharp(resizedImageBuffer).toFile(filePath);
  } catch (err) {
    console.error('Lỗi điều chỉnh kích thước ảnh:', err);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

app.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    const searchKeyword = req.query.keyword || '';
    const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchKeyword.toLowerCase()));
    res.render('home', { loggedIn: req.session.loggedIn, products: filteredProducts });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

app.get('/admin', async (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }
  if (req.session.role !== 'admin') {
    res.render('error', { message: 'Ai dạy dùng tài khoản user để vào trang admin đấy :)?' });
    return;
  }
  try {
    const products = await Product.find({});
    res.render('admin', { products: products });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then(user => {
      if (!user) {
        res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
        return;
      }
      bcrypt.compare(password, user.password)
        .then(result => {
          if (!result) {
            res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
            return;
          }
          req.session.loggedIn = true;
          req.session.role = user.role;
          if (user.role === 'admin') {
            res.redirect('/admin');
          } else {
            res.redirect('/');
          }
        })
        .catch(err => {
          console.error('Lỗi so sánh mật khẩu:', err);
          res.render('error', { message: 'Lỗi so sánh mật khẩu' });
        });
    })
    .catch(err => {
      console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
      res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
    });
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then(user => {
      if (user) {
        res.render('register', { error: 'Tên đăng nhập đã tồn tại' });
        return;
      }
      const newUser = new User({
        username,
        password
      });
      bcrypt.hash(newUser.password, 10)
        .then(hashedPassword => {
          newUser.password = hashedPassword;
          newUser.save()
            .then(() => {
              res.redirect('/login');
            })
            .catch(err => {
              console.error('Lỗi lưu người dùng:', err);
              res.render('error', { message: 'Lỗi lưu người dùng' });
            });
        })
        .catch(err => {
          console.error('Lỗi mã hóa mật khẩu:', err);
          res.render('error', { message: 'Lỗi mã hóa mật khẩu' });
        });
    })
    .catch(err => {
      console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
      res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
    });
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.post('/admin/add', upload.single('image'), (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return; 
  }
  const { name, price } = req.body;
  let errorMessage = ''; // Khởi tạo errorMessage
  if (parseInt(price) < 20) {
    errorMessage = 'Giá phải lớn hơn hoặc bằng 20.';
  }
  const newProduct = new Product({
    name,
    price,
    imageUrl: req.file ? '/uploads/' + req.file.filename : null,
  });
  if (errorMessage) {
    // Truyền errorMessage vào khi render trang admin
    res.render('admin', { products: [], errorMessage });
    return;
  }
  newProduct.save()
    .then(() => {
      res.redirect('/admin');
    })
    .catch(err => {
      console.error('Lỗi lưu sản phẩm:', err);
      res.render('error', { message: 'Lỗi lưu sản phẩm' });
    });
});


app.get('/admin/edit/:id', (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }
  const { id } = req.params;
  Product.findById(id)
    .then(product => {
      if (!product) {
        res.render('error', { message: 'Không tìm thấy sản phẩm' });
        return;
      }
      res.render('edit', { product });
    })
    .catch(err => {
      console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
      res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
    });
});

app.post('/admin/edit/:id', async (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }
  const { id } = req.params;
  const { name, price } = req.body;
  try {
    await Product.findByIdAndUpdate(id, { name, price });
    res.redirect('/admin');
  } catch (err) {
    console.error('Lỗi cập nhật sản phẩm:', err);
    res.render('error', { message: 'Lỗi cập nhật sản phẩm' });
  }
});

app.post('/admin/delete/:id', (req, res) => {
  if (!req.session || req.session.role !== 'admin') {
    res.redirect('/login');
    return;
  }
  const { id } = req.params;
  Product.findByIdAndDelete(id)
    .then(() => {
      res.redirect('/admin');
    })
    .catch(err => {
      console.error('Lỗi xóa sản phẩm:', err);
      res.render('error', { message: 'Lỗi xóa sản phẩm' });
    });
});

app.get('/manage-users', async (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }
  if (req.session.role !== 'admin') {
    res.render('error', { message: 'Bạn không có quyền truy cập vào trang quản lý tài khoản' });
    return;
  }
  try {
    const users = await User.find({}).select('-password');
    res.render('manage_users', { users });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

app.post('/delete-user/:id', async (req, res) => {
  if (!req.session || req.session.role !== 'admin') {
    res.redirect('/login');
    return;
  }
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.redirect('/manage-users');
  } catch (err) {
    console.error('Lỗi xóa người dùng:', err);
    res.render('error', { message: 'Lỗi xóa người dùng' });
  }
});

app.listen(port, () => {
  console.log(`Server đang lắng nghe tại http://localhost:${port}`);
});
