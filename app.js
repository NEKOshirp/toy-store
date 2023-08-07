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

// Kết nối tới cơ sở dữ liệu MongoDB
mongoose.connect('mongodb+srv://truong:truong2001@cluster0.g2wdmun.mongodb.net/toys', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Đã kết nối tới MongoDB');
}).catch((err) => {
  console.error('Lỗi kết nối MongoDB:', err);
});




// Định nghĩa Schema và Model cho sản phẩm
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String
  }
});

const Product = mongoose.model('Product', productSchema);

// Định nghĩa Schema và Model cho người dùng
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
    enum: ['user', 'admin'], // Chỉ chấp nhận 'user' hoặc 'admin'
    default: 'user' // Giá trị mặc định là 'user'
  }
});

const User = mongoose.model('User', userSchema);

// Cấu hình session
app.use(session({
  secret: 'mysecretkey',
  resave: true,
  saveUninitialized: true
}));

// Cấu hình body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình EJS làm view engine
app.set('view engine', 'ejs');

// Cấu hình Express phục vụ các tệp tĩnh từ thư mục public
app.use(express.static('public'));

// Trang chủ - Hiển thị danh sách sản phẩm và chức năng tìm kiếm
app.get('/', async (req, res) => {
  try {
    // Lấy danh sách sản phẩm từ cơ sở dữ liệu
    const products = await Product.find({});

    // Kiểm tra xem người dùng đã nhập từ khóa tìm kiếm hay chưa
    const searchKeyword = req.query.keyword || ''; // Lấy từ khóa tìm kiếm từ query parameters

    // Lọc danh sách sản phẩm dựa trên từ khóa tìm kiếm
    const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchKeyword.toLowerCase()));

    res.render('home', { loggedIn: req.session.loggedIn, products: filteredProducts });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// Hàm điều chỉnh kích thước ảnh trước khi lưu
const resizeImage = async (file) => {
  const filePath = path.join('public/uploads', file.filename);

  try {
    // Đọc ảnh từ đường dẫn filePath
    const imageBuffer = await sharp(filePath).toBuffer();

    // Resize ảnh với kích thước mới (300x200)
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(300, 200)
      .toBuffer();

    // Ghi ảnh đã resize vào đường dẫn filePath
    await sharp(resizedImageBuffer).toFile(filePath);
  } catch (err) {
    console.error('Lỗi điều chỉnh kích thước ảnh:', err);
  }
};

// Cấu hình multer để lưu ảnh vào thư mục public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Trang chủ - Hiển thị danh sách sản phẩm và chức năng tìm kiếm
app.get('/', async (req, res) => {
  try {
    // Lấy danh sách sản phẩm từ cơ sở dữ liệu
    const products = await Product.find({});
    res.render('home', { loggedIn: req.session.loggedIn, products });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// Trang admin - Thêm, sửa và xóa sản phẩm
app.get('/admin', async (req, res) => {
  // Kiểm tra đăng nhập
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }

  // Kiểm tra quyền của người dùng
  if (req.session.role !== 'admin') {
    res.render('error', { message: 'Ai dạy dùng tài khoản user để vào trang admin đấy :)?' });
    return;
  }

  try {
    // Lấy danh sách sản phẩm từ cơ sở dữ liệu
    const products = await Product.find({});
    res.render('admin', { products: products });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// Trang đăng nhập - hiển thị form đăng nhập
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Xử lý đăng nhập
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra thông tin đăng nhập
  User.findOne({ username })
    .then(user => {
      if (!user) {
        res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
        return;
      }

      // So sánh mật khẩu
      bcrypt.compare(password, user.password)
        .then(result => {
          if (!result) {
            res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
            return;
          }

          // Đăng nhập thành công
          req.session.loggedIn = true;
          req.session.role = user.role; // Lưu quyền của người dùng vào session

          // Kiểm tra nếu người dùng là admin thì chuyển hướng đến trang admin
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


// Trang đăng ký
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Xử lý đăng ký
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Kiểm tra thông tin đăng ký
  User.findOne({ username })
    .then(user => {
      if (user) {
        res.render('register', { error: 'Tên đăng nhập đã tồn tại' });
        return;
      }

      // Tạo người dùng mới
      const newUser = new User({
        username,
        password
      });

      // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
      bcrypt.hash(newUser.password, 10)
        .then(hashedPassword => {
          newUser.password = hashedPassword;

          // Lưu người dùng vào cơ sở dữ liệu
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

// Đăng xuất
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Thêm sản phẩm
app.post('/admin/add', upload.single('image'), (req, res) => {
  // Kiểm tra đăng nhập
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }

  const { name, price } = req.body;

  // Lưu tên, giá và đường dẫn ảnh sản phẩm vào cơ sở dữ liệu
  const newProduct = new Product({
    name,
    price,
    imageUrl: req.file ? '/uploads/' + req.file.filename : null, // Lưu đường dẫn ảnh vào cơ sở dữ liệu (nếu có)
  });

  newProduct.save()
    .then(() => {
      res.redirect('/admin');
    })
    .catch(err => {
      console.error('Lỗi lưu sản phẩm:', err);
      res.render('error', { message: 'Lỗi lưu sản phẩm' });
    });
});

// Sửa sản phẩm
app.get('/admin/edit/:id', (req, res) => {
  // Kiểm tra đăng nhập
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }

  const { id } = req.params;

  // Tìm sản phẩm theo ID và hiển thị trang chỉnh sửa
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

// Xử lý chỉnh sửa sản phẩm
app.post('/admin/edit/:id', async (req, res) => {
  // Kiểm tra đăng nhập
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }

  const { id } = req.params;
  const { name, price } = req.body;

  try {
    // Tìm sản phẩm theo ID và cập nhật thông tin
    await Product.findByIdAndUpdate(id, { name, price });
    res.redirect('/admin');
  } catch (err) {
    console.error('Lỗi cập nhật sản phẩm:', err);
    res.render('error', { message: 'Lỗi cập nhật sản phẩm' });
  }
});

// Xóa sản phẩm
app.post('/admin/delete/:id', (req, res) => {
  // Kiểm tra quyền của người dùng
  if (!req.session || req.session.role !== 'admin') {
    res.redirect('/login');
    return;
  }

  const { id } = req.params;

  // Xóa sản phẩm theo ID
  Product.findByIdAndDelete(id)
    .then(() => {
      res.redirect('/admin');
    })
    .catch(err => {
      console.error('Lỗi xóa sản phẩm:', err);
      res.render('error', { message: 'Lỗi xóa sản phẩm' });
    });
});

// Trang quản lý tài khoản người dùng và quản lý tài khoản admin
app.get('/manage-users', async (req, res) => {
  // Kiểm tra đăng nhập
  if (!req.session || !req.session.loggedIn) {
    res.redirect('/login');
    return;
  }

  // Kiểm tra quyền của người dùng
  if (req.session.role !== 'admin') {
    res.render('error', { message: 'Bạn không có quyền truy cập vào trang quản lý tài khoản' });
    return;
  }

  try {
    // Lấy danh sách người dùng từ cơ sở dữ liệu (loại bỏ trường mật khẩu)
    const users = await User.find({}).select('-password');
    res.render('manage_users', { users });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// Xóa người dùng
app.post('/delete-user/:id', async (req, res) => {
  // Kiểm tra quyền của người dùng
  if (!req.session || req.session.role !== 'admin') {
    res.redirect('/login');
    return;
  }

  const { id } = req.params;

  try {
    // Xóa người dùng theo ID
    await User.findByIdAndDelete(id);
    res.redirect('/manage-users');
  } catch (err) {
    console.error('Lỗi xóa người dùng:', err);
    res.render('error', { message: 'Lỗi xóa người dùng' });
  }
});

// Trang chủ - Hiển thị danh sách sản phẩm và chức năng tìm kiếm
app.get('/', async (req, res) => {
  try {
    // Lấy danh sách sản phẩm từ cơ sở dữ liệu
    const products = await Product.find({});

    // Kiểm tra xem người dùng đã nhập từ khóa tìm kiếm hay chưa
    const searchKeyword = req.query.keyword || ''; // Lấy từ khóa tìm kiếm từ query parameters

    // Lọc danh sách sản phẩm dựa trên từ khóa tìm kiếm
    const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchKeyword.toLowerCase()));

    res.render('home', { loggedIn: req.session.loggedIn, products: filteredProducts });
  } catch (err) {
    console.error('Lỗi truy vấn cơ sở dữ liệu:', err);
    res.render('error', { message: 'Lỗi truy vấn cơ sở dữ liệu' });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang lắng nghe tại http://localhost:${port}`);
});
