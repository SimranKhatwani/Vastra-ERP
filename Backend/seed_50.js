const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/garmenterp').then(async () => {
    const Product = require('./src/models/productModel');
    const Tenant = require('./src/models/tenantModel');
    
    let tenant = await Tenant.findOne();
    if (!tenant) {
        tenant = await Tenant.create({ name: 'Default Tenant' });
    }
    const tenantId = tenant._id;

    const categories = ['Shirts', 'T-Shirts', 'Trousers', 'Jeans', 'Jackets', 'Suits', 'Ethnic Wear'];
    const colors = ['Red', 'Blue', 'Black', 'White', 'Grey', 'Navy', 'Olive', 'Maroon'];
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38'];
    const brands = ['Raymond', 'Peter England', 'Levis', 'Allen Solly', 'Van Heusen', 'Arrow'];
    
    let products = [];
    for(let i = 1; i <= 50; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        
        products.push({
            tenantId,
            name: `Premium ${brand} ${color} ${cat}`,
            sku: `SKU-${1000 + i}`,
            barcode: `BCODE${1000000 + i}`,
            category: cat,
            brand: brand,
            color: color,
            size: size,
            purchasePrice: Math.floor(Math.random() * 1000) + 500,
            sellingPrice: Math.floor(Math.random() * 1500) + 1500,
            mrp: Math.floor(Math.random() * 2000) + 2000,
            stock: Math.floor(Math.random() * 50) + 10,
            gstPercent: 12,
            status: 'In Stock'
        });
    }

    await Product.insertMany(products);
    console.log('Inserted 50 products successfully!');
    process.exit(0);
}).catch(console.error);
