 // Hàm xử lý tìm kiếm sản phẩm
 function searchProduct() {
    const keyword = document.getElementById('searchInput').value;
    window.location.href = `/?keyword=${keyword}`;
  }

  // Bắt sự kiện nhấn Enter để tìm kiếm
  document.getElementById('searchInput').addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
      searchProduct();
    }
  });
    // Mảng lưu trữ các sản phẩm trong giỏ hàng
    let cartItems = [];

    // Hàm thêm sản phẩm vào giỏ hàng
    function addToCart(productId) {
      // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
      const existingItem = cartItems.find(item => item.productId === productId);

      if (existingItem) {
        // Nếu sản phẩm đã tồn tại, tăng số lượng sản phẩm lên 1
        existingItem.quantity++;
      } else {
        // Nếu sản phẩm chưa tồn tại, thêm mới vào giỏ hàng với số lượng là 1
        cartItems.push({ productId, quantity: 1 });
      }

      // Cập nhật số lượng sản phẩm trong giỏ hàng trên giao diện
      updateCartItemCount();
      // Hiển thị danh sách sản phẩm trong giỏ hàng trong modal
      updateCartItemsListModal();
      // Cập nhật tổng tiền của giỏ hàng trong modal
      updateCartTotalModal();
    }

    // Hàm cập nhật số lượng sản phẩm trong giỏ hàng trên giao diện
    function updateCartItemCount() {
      const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
      // Hiển thị số lượng sản phẩm trong giỏ hàng trên giao diện
      document.getElementById('cartItemCount').innerText = cartItemCount;
      document.getElementById('cartItemCountModal').innerText = cartItemCount; // Cập nhật số lượng sản phẩm trong modal
    }

    // Hàm hiển thị danh sách sản phẩm trong giỏ hàng trong modal
    function updateCartItemsListModal() {
      const cartItemsListModal = document.getElementById('cartItemsListModal');
      cartItemsListModal.innerHTML = '';

      cartItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerText = `Sản phẩm: ${item.productId}, Số lượng: ${item.quantity}`;
        cartItemsListModal.appendChild(listItem);
      });
    }

    // Hàm cập nhật tổng tiền của giỏ hàng trong modal
    function updateCartTotalModal() {
      const cartTotalModal = document.getElementById('cartTotalModal');
      const cartTotal = cartItems.reduce((total, item) => {
        const product = products.find(prod => prod._id === item.productId);
        return total + product.price * item.quantity;
      }, 0);

      cartTotalModal.innerText = cartTotal;
    }

    // Hàm xử lý khi nhấn nút Thanh toán trong modal
    function checkout() {
      // Ở đây, bạn có thể thực hiện các hành động liên quan đến việc thanh toán,
      // chẳng hạn như gửi thông tin giỏ hàng đến server để xử lý đơn hàng,
      // hoặc chuyển hướng đến trang thanh toán, ...
      // Trong ví dụ này, chúng ta chỉ hiển thị thông báo và làm rỗng giỏ hàng.

      // Hiển thị thông báo
      alert('Cảm ơn bạn đã mua hàng! Đơn hàng của bạn đã được ghi nhận.');

      // Làm rỗng giỏ hàng
      cartItems = [];
      updateCartItemCount();
      updateCartItemsListModal();
      updateCartTotalModal();

      // Đóng khung modal giỏ hàng sau khi thanh toán
      $('#cartModal').modal('hide');
    }
