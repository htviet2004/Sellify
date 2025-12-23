/**
 * Model Configurations for Admin CRUD
 * Defines columns, fields, filters for each model
 */

// ==================== USERS ====================
export const usersConfig = {
  title: 'Users',
  apiEndpoint: '/api/users/admin/crud/users/',
  idField: 'user_id',
  searchPlaceholder: 'Search by username, email, name...',
  columns: [
    { label: 'ID', field: 'user_id' },
    { label: 'Username', field: 'username' },
    { label: 'Email', field: 'email' },
    { label: 'Full Name', field: 'full_name' },
    { label: 'User Type', field: 'user_type' },
    { 
      label: 'Status', 
      field: 'status',
      render: (row) => (
        <span className={`admin-status-badge status-${row.status}`}>
          {row.status}
        </span>
      )
    },
    { label: 'Created', field: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { 
      name: 'user_type', 
      label: 'User Type', 
      type: 'select', 
      required: true,
      options: [
        { value: 'buyer', label: 'Buyer' },
        { value: 'seller', label: 'Seller' },
        { value: 'admin', label: 'Admin' }
      ]
    },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select', 
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'banned', label: 'Banned' }
      ]
    },
  ],
  filters: [
    { 
      name: 'user_type', 
      label: 'User Type', 
      type: 'select',
      options: [
        { value: 'buyer', label: 'Buyer' },
        { value: 'seller', label: 'Seller' },
        { value: 'admin', label: 'Admin' }
      ]
    },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'banned', label: 'Banned' }
      ]
    },
  ]
};

// ==================== PROFILES ====================
export const profilesConfig = {
  title: 'Profiles',
  apiEndpoint: '/api/users/admin/crud/profiles/',
  idField: 'id',
  searchPlaceholder: 'Search by username...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'User', field: 'username' },
    { label: 'Email', field: 'user_email' },
    { label: 'City', field: 'city' },
    { label: 'District', field: 'district' },
    { label: 'Country', field: 'country' },
  ],
  fields: [
    { name: 'bio', label: 'Bio', type: 'textarea' },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'district', label: 'District', type: 'text' },
    { name: 'ward', label: 'Ward', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
  ],
  filters: []
};

// ==================== PRODUCTS ====================
export const productsConfig = {
  title: 'Products',
  apiEndpoint: '/api/users/admin/crud/products/',
  idField: 'id',
  searchPlaceholder: 'Search by name, seller...',
  columns: [
    { label: 'ID', field: 'id' },
    { 
      label: 'Image', 
      field: 'image',
      render: (row) => row.image ? (
        <img src={row.image} alt={row.name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      ) : 'No image'
    },
    { label: 'Name', field: 'name' },
    { label: 'Price', field: 'price', render: (row) => `$${row.price}` },
    { label: 'Stock', field: 'stock' },
    { label: 'Seller', field: 'seller_name' },
    { 
      label: 'Active', 
      field: 'is_active',
      render: (row) => row.is_active ? 
        <span className="admin-status-badge status-active">Yes</span> : 
        <span className="admin-status-badge status-inactive">No</span>
    },
  ],
  fields: [
    { name: 'name', label: 'Product Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'price', label: 'Price', type: 'number', required: true },
    { name: 'stock', label: 'Stock', type: 'number', required: true },
    { name: 'category', label: 'Category ID', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  filters: [
    { 
      name: 'is_active', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    },
  ]
};

// ==================== CATEGORIES ====================
export const categoriesConfig = {
  title: 'Categories',
  apiEndpoint: '/api/users/admin/crud/categories/',
  idField: 'id',
  searchPlaceholder: 'Search categories...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'Name', field: 'name' },
    { label: 'Slug', field: 'slug' },
    { label: 'Parent', field: 'parent', render: (row) => row.parent || 'None' },
    { 
      label: 'Active', 
      field: 'is_active',
      render: (row) => row.is_active ? 
        <span className="admin-status-badge status-active">Yes</span> : 
        <span className="admin-status-badge status-inactive">No</span>
    },
  ],
  fields: [
    { name: 'name', label: 'Category Name', type: 'text', required: true },
    { name: 'parent', label: 'Parent Category ID', type: 'number' },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  filters: [
    { 
      name: 'is_active', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    },
  ]
};

// ==================== CART ITEMS ====================
export const cartItemsConfig = {
  title: 'Cart Items',
  apiEndpoint: '/api/users/admin/crud/cart-items/',
  idField: 'id',
  searchPlaceholder: 'Search by user, product...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'User', field: 'username' },
    { label: 'Product', field: 'product_name' },
    { label: 'Quantity', field: 'quantity' },
    { label: 'Color', field: 'color' },
    { label: 'Size', field: 'size' },
    { label: 'Added', field: 'added_at', render: (row) => new Date(row.added_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'user', label: 'User ID', type: 'number', required: true },
    { name: 'product', label: 'Product ID', type: 'number', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
  ],
  filters: []
};

// ==================== ORDERS ====================
export const ordersConfig = {
  title: 'Orders',
  apiEndpoint: '/api/users/admin/crud/orders/',
  idField: 'order_id',
  searchPlaceholder: 'Search by order ID, email, phone...',
  columns: [
    { label: 'Order ID', field: 'order_id' },
    { label: 'Customer', field: 'full_name' },
    { label: 'Email', field: 'email' },
    { label: 'Phone', field: 'phone' },
    { 
      label: 'Status', 
      field: 'status',
      render: (row) => (
        <span className={`admin-status-badge status-${row.status}`}>
          {row.status_display || row.status}
        </span>
      )
    },
    { label: 'Total', field: 'total_amount', render: (row) => `$${row.total_amount}` },
    { label: 'Date', field: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true },
    { name: 'address', label: 'Address', type: 'text', required: true },
    { name: 'ward', label: 'Ward', type: 'text' },
    { name: 'district', label: 'District', type: 'text' },
    { name: 'city', label: 'City', type: 'text', required: true },
    { 
      name: 'payment_method', 
      label: 'Payment Method', 
      type: 'select',
      options: [
        { value: 'COD', label: 'Cash on Delivery' },
        { value: 'CARD', label: 'Credit/Debit Card' },
        { value: 'BANK', label: 'Bank Transfer' }
      ]
    },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  filters: [
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    { 
      name: 'payment_method', 
      label: 'Payment', 
      type: 'select',
      options: [
        { value: 'COD', label: 'COD' },
        { value: 'CARD', label: 'Card' },
        { value: 'BANK', label: 'Bank' }
      ]
    },
  ]
};

// ==================== ORDER ITEMS ====================
export const orderItemsConfig = {
  title: 'Order Items',
  apiEndpoint: '/api/users/admin/crud/order-items/',
  idField: 'id',
  searchPlaceholder: 'Search by order ID, product...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'Order ID', field: 'order_id_display' },
    { label: 'Product', field: 'product_name' },
    { label: 'Quantity', field: 'quantity' },
    { label: 'Price', field: 'price', render: (row) => `$${row.price}` },
    { label: 'Color', field: 'color' },
    { label: 'Size', field: 'size' },
  ],
  fields: [
    { name: 'order', label: 'Order ID', type: 'text', required: true },
    { name: 'product', label: 'Product ID', type: 'number', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'price', label: 'Price', type: 'number', required: true },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
  ],
  filters: []
};

// ==================== CONVERSATIONS ====================
export const conversationsConfig = {
  title: 'Conversations',
  apiEndpoint: '/api/users/admin/crud/conversations/',
  idField: 'id',
  searchPlaceholder: 'Search by buyer, shop...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'Buyer', field: 'buyer_username' },
    { label: 'Shop', field: 'shop_username' },
    { label: 'Product', field: 'product_name' },
    { label: 'Buyer Unread', field: 'buyer_unread' },
    { label: 'Shop Unread', field: 'shop_unread' },
    { label: 'Created', field: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'buyer', label: 'Buyer ID', type: 'number', required: true },
    { name: 'shop', label: 'Shop ID', type: 'number', required: true },
    { name: 'product', label: 'Product ID', type: 'number' },
  ],
  filters: []
};

// ==================== MESSAGES ====================
export const messagesConfig = {
  title: 'Messages',
  apiEndpoint: '/api/users/admin/crud/messages/',
  idField: 'id',
  searchPlaceholder: 'Search messages...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'Conversation', field: 'conversation' },
    { label: 'Sender', field: 'sender_username' },
    { label: 'Content', field: 'content', render: (row) => row.content?.substring(0, 100) || '' },
    { label: 'Sent', field: 'created_at', render: (row) => new Date(row.created_at).toLocaleString() },
  ],
  fields: [
    { name: 'conversation', label: 'Conversation ID', type: 'number', required: true },
    { name: 'sender', label: 'Sender ID', type: 'number', required: true },
    { name: 'content', label: 'Message Content', type: 'textarea', required: true },
  ],
  filters: [
    { name: 'conversation', label: 'Conversation ID', type: 'number' },
  ]
};

// ==================== REVIEWS ====================
export const reviewsConfig = {
  title: 'Reviews',
  apiEndpoint: '/api/users/admin/crud/reviews/',
  idField: 'id',
  searchPlaceholder: 'Search by user, product, comment...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'User', field: 'user_name' },
    { label: 'Product', field: 'product' },
    { 
      label: 'Rating', 
      field: 'rating',
      render: (row) => '⭐'.repeat(row.rating)
    },
    { label: 'Comment', field: 'comment', render: (row) => row.comment?.substring(0, 50) || 'No comment' },
    { label: 'Date', field: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'user', label: 'User ID', type: 'number', required: true },
    { name: 'product', label: 'Product ID', type: 'number', required: true },
    { 
      name: 'rating', 
      label: 'Rating', 
      type: 'select', 
      required: true,
      options: [
        { value: 1, label: '1 Star' },
        { value: 2, label: '2 Stars' },
        { value: 3, label: '3 Stars' },
        { value: 4, label: '4 Stars' },
        { value: 5, label: '5 Stars' }
      ]
    },
    { name: 'comment', label: 'Comment', type: 'textarea' },
  ],
  filters: [
    { 
      name: 'rating', 
      label: 'Rating', 
      type: 'select',
      options: [
        { value: 1, label: '1 Star' },
        { value: 2, label: '2 Stars' },
        { value: 3, label: '3 Stars' },
        { value: 4, label: '4 Stars' },
        { value: 5, label: '5 Stars' }
      ]
    },
  ]
};

// ==================== WISHLIST ITEMS ====================
export const wishlistItemsConfig = {
  title: 'Wishlist Items',
  apiEndpoint: '/api/users/admin/crud/wishlist-items/',
  idField: 'id',
  searchPlaceholder: 'Search by user, product...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'User ID', field: 'user' },
    { label: 'Product', field: 'product', render: (row) => row.product?.name || `ID: ${row.product}` },
    { label: 'Color', field: 'color' },
    { label: 'Size', field: 'size' },
    { label: 'Note', field: 'note' },
    { label: 'Added', field: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'user', label: 'User ID', type: 'number', required: true },
    { name: 'product_id', label: 'Product ID', type: 'number', required: true },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
    { name: 'note', label: 'Note', type: 'textarea' },
  ],
  filters: []
};

// ==================== SAVED ITEMS ====================
export const savedItemsConfig = {
  title: 'Saved Items',
  apiEndpoint: '/api/users/admin/crud/saved-items/',
  idField: 'id',
  searchPlaceholder: 'Search by user, product...',
  columns: [
    { label: 'ID', field: 'id' },
    { label: 'User ID', field: 'user' },
    { label: 'Product', field: 'product', render: (row) => row.product?.name || `ID: ${row.product}` },
    { label: 'Quantity', field: 'quantity' },
    { label: 'Color', field: 'color' },
    { label: 'Size', field: 'size' },
    { label: 'Saved', field: 'moved_from_cart_at', render: (row) => new Date(row.moved_from_cart_at).toLocaleDateString() },
  ],
  fields: [
    { name: 'user', label: 'User ID', type: 'number', required: true },
    { name: 'product_id', label: 'Product ID', type: 'number', required: true },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
  ],
  filters: []
};
