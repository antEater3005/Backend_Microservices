const { OrderModel, CartModel } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { APIError, BadRequestError } = require('../../utils/app-errors');
const { exists } = require('../models/Order');

//Dealing with data base operations
class ShoppingRepository {
  // payment

  async Orders(customerId) {
    try {
      const orders = await OrderModel.find({ customerId });
      return orders;
    } catch (err) {
      throw APIError(
        'API Error',
        STATUS_CODES.INTERNAL_ERROR,
        'Unable to Find Orders'
      );
    }
  }

  // to find cart

  async Cart(customerId) {
    try {
      const cartItems = await CartModel.find({ customerId: customerId });
      if (cartItems) {
        return cartItems;
      }
      throw new Error('Data not found!');
    } catch (err) {
      throw err;
    }
  }

  // add or remove an item from cart

  async AddCartItem(customerId, product, qty, isRemove) {
    try {
      const cart = await CartModel.findOne({ customerId: customerId });

      const { _id } = product;
      if (cart) {
        let cartItems = cart.items;
        let isExist = false;
        if (cartItems.length > 0) {
          cartItems.map((item) => {
            if (item.product._id.toString() === _id.toString()) {
              if (isRemove) {
                cartItems.splice(cartItems.indexOf(item), 1);
              } else {
                item.unit = qty;
              }
              isExist = true;
            }
          });
        }
        if (!isExist && isRemove) return { response: 'Item not in cart!' };

        if (!isExist && !isRemove)
          cartItems.push({ product: { ...product }, unit: qty });

        cart.items = cartItems;

        const response = await cart.save();
        return { response };
      } else {
        return await CartModel.create({
          customerId,
          items: [{ product: { ...product }, unit: qty }],
        });
      }

      throw new Error('Unable to add to cart!');
    } catch (err) {
      console.log(err);
      throw new APIError(
        'API Error',
        STATUS_CODES.INTERNAL_ERROR,
        'Unable to Create Cart'
      );
    }
  }

  async CreateNewOrder(customerId, txnId) {
    //check transaction for payment Status

    try {
      const cart = await CartModel.findOne({ customerId: customerId });

      if (cart) {
        let amount = 0;

        let cartItems = cart.items;

        if (cartItems.length > 0) {
          //process Order
          cartItems.map((item) => {
            amount += parseInt(item.product.price) * parseInt(item.unit);
          });

          const orderId = uuidv4();

          const order = new OrderModel({
            orderId,
            customerId,
            amount,
            txnId,
            status: 'received',
            items: cartItems,
          });

          cart.items = [];

          const orderResult = await order.save();

          await cart.save();
          return orderResult;
        } else return { error: 'Cart Empty' };
      }

      return {};
    } catch (err) {
      throw APIError(
        'API Error',
        STATUS_CODES.INTERNAL_ERROR,
        'Unable to Find Category'
      );
    }
  }
}

module.exports = ShoppingRepository;
