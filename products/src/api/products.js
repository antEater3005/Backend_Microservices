const ProductService = require('../services/product-service');
const UserAuth = require('./middlewares/auth');
const { PublishMessage, ConsumeMessage } = require('../utils/index');
const { countDocuments } = require('../database/models/Product');
const { CUSTOMER_BINDING_KEY, SHOPPING_BINDING_KEY } = require('../config');

module.exports = (app, channel) => {
  const service = new ProductService();

  app.post('/product/create', async (req, res, next) => {
    try {
      const { name, desc, type, unit, price, available, supplier, banner } =
        req.body;
      // validation
      const { data } = await service.CreateProduct({
        name,
        desc,
        type,
        unit,
        price,
        available,
        supplier,
        banner,
      });
      return res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get('/category/:type', async (req, res, next) => {
    const type = req.params.type;

    try {
      const { data } = await service.GetProductsByCategory(type);
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get('/:id', async (req, res, next) => {
    const productId = req.params.id;

    try {
      const { data } = await service.GetProductDescription(productId);
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });
  // get details of more than elements
  app.post('/ids', async (req, res, next) => {
    try {
      const { ids } = req.body;
      const products = await service.GetSelectedProducts(ids);
      return res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  });
  // add to wishlist
  app.put('/wishlist', UserAuth, async (req, res, next) => {
    const { _id } = req.user;

    try {
      const { data } = await service.GetProductPayload(
        _id,
        {
          productId: req.body._id,
        },
        'ADD_TO_WISHLIST'
      );
      const { error } = data;
      if (error) return res.status(404).json('Product not found!');
      PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data));
      return res.status(200).json(data.data.product);
    } catch (err) {}
  });

  app.delete('/wishlist/:id', UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const productId = req.params.id;
    try {
      const { data } = await service.GetProductPayload(
        _id,
        {
          productId: productId,
        },
        'REMOVE_FROM_WISHLIST'
      );
      const { error } = data;
      if (error) return res.status(404).json({ error });
      // ! Data is in json form we need to send a string, so convert the json object to string
      PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data));
      return res.status(200).json(data.payload);
    } catch (err) {
      next(err);
    }
  });

  // Add a product to cart

  app.put('/cart', UserAuth, async (req, res, next) => {
    const { _id } = req.user;

    try {
      const { data } = await service.GetProductPayload(
        _id,
        { productId: req.body._id, qty: req.body.qty },
        'ADD_TO_CART'
      );
      const { error } = data;

      if (error) return res.status(404).json('Product not found!');
      PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data));
      PublishMessage(channel, SHOPPING_BINDING_KEY, JSON.stringify(data));

      const response = { product: data.data.product, unit: data.data.qty };

      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  });

  // Remove from cart
  app.delete('/cart/:id', UserAuth, async (req, res, next) => {
    const { _id } = req.user;
    const productId = req.params.id;
    try {
      const { data } = await service.GetProductPayload(
        _id,
        {
          productId: productId,
        },
        'REMOVE_FROM_CART'
      );
      const { error } = { data };

      if (error) return res.status(404).json('Product not found!');

      // PublishCustomerEvents(data);
      // PublishShoppingEvents(data);

      PublishMessage(channel, CUSTOMER_BINDING_KEY, JSON.stringify(data));
      PublishMessage(channel, SHOPPING_BINDING_KEY, JSON.stringify(data));

      const response = {
        product: data.data.product,
        unit: data.data.qty,
      };

      return res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  });

  //get Top products and category
  app.get('/', async (req, res, next) => {
    //check validation
    try {
      const { data } = await service.GetProducts();
      return res.status(200).json(data);
    } catch (error) {
      next(err);
    }
  });
};
