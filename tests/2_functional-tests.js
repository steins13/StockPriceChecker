const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

async function oneStock() {
  chai.request(server).get("/api/stock-prices?stock=GOOG").end((err, res) => {return res})
}
async function oneStockLike() {
  chai.request(server).get("/api/stock-prices?stock=GOOG&like=true").end((err, res) => {return res})
}
async function twoStocks() {
  chai.request(server).get("/api/stock-prices?stock=AAP&stock=AAPL").end((err, res) => {return res})
}
async function twoStocksLike() {
  chai.request(server).get("/api/stock-prices?stock=AAP").end((err, res) => {
    like1 = res.body.stockData.likes
    chai.request(server).get("/api/stock-prices?stock=ADBE").end((err, res) => {
        like2 = res.body.stockData.likes
        chai.request(server).get("/api/stock-prices?stock=AAP&stock=ADBE&like=true").end((err, res) => {return res})
      })
  })
}


suite('Functional Tests', function() {

  let like = 0

  test("Viewing one stock", () => {
    oneStock().then((res) => {
      like = res.body.stockData.likes
      assert.equal(res.status, 200);
      assert.property(res.body, "stockData");
      assert.property(res.body.stockData, "stock");
      assert.isString(res.body.stockData.stock);
      assert.equal(res.body.stockData.stock, "GOOG");
      assert.property(res.body.stockData, "price");
      assert.isNumber(res.body.stockData.price);
      assert.property(res.body.stockData, "likes")
      assert.isNumber(res.body.stockData.likes);
    })
    .catch((err) => {
      return err
    })
  })

  test("Viewing one stock and liking it", () => {
    oneStockLike().then((res) => {
      assert.equal(res.status, 200);
      assert.property(res.body, "stockData");
      assert.property(res.body.stockData, "stock");
      assert.isString(res.body.stockData.stock);
      assert.equal(res.body.stockData.stock, "GOOG");
      assert.property(res.body.stockData, "price");
      assert.isNumber(res.body.stockData.price);
      assert.property(res.body.stockData, "likes")
      assert.isNumber(res.body.stockData.likes);
      assert.equal(res.body.stockData.likes, like + 1);
    })
    .catch((err) => {
      return err
    })
  })

  test("Viewing the same stock and liking it again", () => {
    oneStockLike().then((res) => {
      assert.equal(res.status, 200);
      assert.property(res.body, "stockData");
      assert.property(res.body.stockData, "stock");
      assert.isString(res.body.stockData.stock);
      assert.equal(res.body.stockData.stock, "GOOG");
      assert.property(res.body.stockData, "price");
      assert.isNumber(res.body.stockData.price);
      assert.property(res.body.stockData, "likes")
      assert.isNumber(res.body.stockData.likes);
      assert.equal(res.body.stockData.likes, like + 1);
    })
    .catch((err) => {
      return err
    })
  })

  test("Viewing two stocks", () => {
    twoStocks().then((res) => {
      assert.equal(res.status, 200);
      assert.property(res.body, "stockData");
      assert.isArray(res.body.stockData);
      assert.lengthOf(res.body.stockData, 2);
      assert.property(res.body.stockData[0], "stock");
      assert.property(res.body.stockData[1], "stock");
      assert.equal(res.body.stockData[1].stock, "AAP");
      assert.equal(res.body.stockData[0].stock, "AAPL");
      assert.property(res.body.stockData[0], "price");
      assert.property(res.body.stockData[1], "price");
      assert.property(res.body.stockData[0], "rel_likes");
      assert.property(res.body.stockData[1], "rel_likes");
    })
    .catch((err) => {
      return err
    })
  })

  let like1
  let like2

  test("Viewing two stocks and liking them", () => {
    twoStocksLike().then((res) => {
      assert.equal(res.status, 200);
      assert.property(res.body, "stockData");
      assert.isArray(res.body.stockData);
      assert.lengthOf(res.body.stockData, 2);
      assert.property(res.body.stockData[0], "stock");
      assert.property(res.body.stockData[1], "stock");
      assert.equal(res.body.stockData[0].stock, "AAP");
      assert.equal(res.body.stockData[1].stock, "ADBE");
      assert.property(res.body.stockData[0], "price");
      assert.property(res.body.stockData[1], "price");
      assert.property(res.body.stockData[0], "rel_likes");
      assert.equal(res.body.stockData[0].rel_likes, like1 - like2);
      assert.property(res.body.stockData[1], "rel_likes");
      assert.equal(res.body.stockData[1].rel_likes, like2 - like1);
    })
    .catch((err) => {
      return err
    })
  })

});
