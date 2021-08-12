'use strict';

const mongoose = require('mongoose');
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }) 
  .then(() => {
    console.log("MongoDB connected")
  }) 
  .catch((err) => console.log(err));

const stocksSchema = new mongoose.Schema({
  stock: String,
  price: Number,
  likes: Number,
  ip: Array
})

const Stock = new mongoose.model("Stock", stocksSchema)


module.exports = function (app) {

  const request = require('request')

  app.route('/api/stock-prices')
    .get(function (req, res){
      
      let symbol = req.query.stock

      if (!(symbol instanceof Array)) {
        symbol = [symbol]
      }

      let price = []
      let stock = []

      request("https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/" + symbol[0] + "/quote", (err, response, body) => {
        if (!err && response.statusCode == 200) {
          price.push(response.body.match(/"latestPrice":\d+\.\d+/)[0].split(":")[1])
          stock.push(response.body.match(/"symbol":"\w+/)[0].split("\"")[3])
          
          if (symbol.length > 1) {
            request("https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/" + symbol[1] + "/quote", (err, response, body) => {
              if (err) {
                return console.log(err)
              }
              price.push(response.body.match(/"latestPrice":\d+\.\d+/)[0].split(":")[1])
              stock.push(response.body.match(/"symbol":"\w+/)[0].split("\"")[3])

              Stock.find({stock: {$in: [stock[0], stock[1]]}}, (err, doc) => {
                if (err) {
                  return console.log(err)
                }

                //save
                if (doc.length == 0) {

                  const newStocks1 = new Stock({
                    stock: stock[0],
                    price: price[0],
                    likes: 0,
                    ip: []
                  })

                  const newStocks2 = new Stock({
                    stock: stock[1],
                    price: price[1],
                    likes: 0,
                    ip: []
                  })

                  if (req.query.like == "true") {
                    newStocks1.likes = newStocks1.likes + 1
                    newStocks2.likes = newStocks2.likes + 1
                    newStocks1.ip = [...newStocks1.ip, req.ip]
                    newStocks2.ip = [...newStocks2.ip, req.ip]
                  }

                  newStocks1.save()
                  newStocks2.save()

                  return res.json({
                    stockData: [
                      {
                        stock: newStocks1.stock,
                        price: newStocks1.price,
                        rel_likes: newStocks1.likes - newStocks2.likes
                      },
                      {
                        stock: newStocks2.stock,
                        price: newStocks2.price,
                        rel_likes: newStocks2.likes - newStocks1.likes
                      }
                    ]
                  })

                }

                if (doc.length == 1) {
                  if (doc[0].stock == stock[0]) {

                    const newStocks1 = new Stock({
                      stock: stock[1],
                      price: price[1],
                      likes: 0,
                      ip: []
                    })

                    if (req.query.like == "true") {
                      newStocks1.likes = newStocks1.likes + 1
                      newStocks1.ip = [...newStocks1.ip, req.ip]

                      if (doc[0].ip.indexOf(req.ip) == -1) {
                        Stock.findOneAndUpdate({stock: doc[0].stock}, {likes: doc[0].likes + 1, ip: [...doc[0].ip, req.ip]}, {new: true}, (err, doc) => {
                          if (err) {
                            return console.log(err)
                          }

                          newStocks1.save()

                          return res.json({
                            stockData: [
                              {
                                stock: doc.stock,
                                price: doc.price,
                                likes: doc.likes - newStocks1.likes
                              },
                              {
                                stock: newStocks1.stock,
                                price: newStocks1.price,
                                likes: newStocks1.likes - doc.likes
                              }
                            ]
                          })

                        })
                      }


                    }

                    newStocks1.save()

                    return res.json({
                      stockData: [
                        {
                          stock: doc[0].stock,
                          price: doc[0].price,
                          likes: doc[0].likes - newStocks1.likes
                        },
                        {
                          stock: newStocks1.stock,
                          price: newStocks1.price,
                          likes: newStocks1.likes - doc[0].likes
                        }
                      ]
                    })
                  } else if (doc[1].stock == stock[1]) {

                      const newStocks0 = new Stock({
                        stock: stock[0],
                        price: price[0],
                        likes: 0,
                        ip: []
                      })

                      if (req.query.like == "true") {
                        newStocks0.likes = newStocks0.likes + 1
                        newStocks0.ip = [...newStocks0.ip, req.ip]

                        if (doc[0].ip.indexOf(req.ip) == -1) {
                          Stock.findOneAndUpdate({stock: doc[0].stock}, {likes: doc[0].likes + 1, ip: [...doc[0].ip, req.ip]}, {new: true}, (err, doc) => {
                            if (err) {
                              return console.log(err)
                            }

                            newStocks0.save()

                            return res.json({
                              stockData: [
                                {
                                  stock: doc.stock,
                                  price: doc.price,
                                  likes: doc.likes - newStocks0.likes
                                },
                                {
                                  stock: newStocks0.stock,
                                  price: newStocks0.price,
                                  likes: newStocks0.likes - doc.likes
                                }
                              ]
                            })

                          })
                        }
                      }

                      newStocks0.save()

                      return res.json({
                        stockData: [
                          {
                            stock: doc[0].stock,
                            price: doc[0].price,
                            likes: doc[0].likes - newStocks0.likes
                          },
                          {
                            stock: newStocks0.stock,
                            price: newStocks0.price,
                            likes: newStocks0.likes - doc[0].likes
                          }
                        ]
                      })
                  }
                }


                //if like is true
                if (req.query.like == "true") {

                  let doc1 = doc[0]
                  let doc2 = doc[1]

                  let stock1IPs = doc1.ip
                  let stock1totalLikes = doc1.likes
                  let stock2IPs = doc2.ip
                  let stock2totalLikes = doc2.likes

                  if (stock1IPs.indexOf(req.ip) == -1 && stock2IPs.indexOf(req.ip) == -1) {
                    Stock.findOneAndUpdate({stock: doc1.stock}, {ip: [...stock1IPs, req.ip], likes: stock1totalLikes + 1}, {new: true}, (err, docOne) => {
                      if (err) {
                        return console.log(err)
                      }
                    })
                    Stock.findOneAndUpdate({stock: doc2.stock}, {ip: [...stock2IPs, req.ip], likes: stock2totalLikes + 1}, {new: true}, (err, docTwo) => {
                      if (err) {
                        return console.log(err)
                      }
                    })

                    return res.json({
                      stockData: [
                        {
                          stock: doc1.stock,
                          price: doc1.price,
                          likes: doc1.likes - doc2.likes
                        },
                        {
                          stock: doc2.stock,
                          price: doc2.price,
                          likes: doc2.likes - doc1.likes
                        }
                      ]
                    })

                  }

                  else if (stock1IPs.indexOf(req.ip) == -1) {
                    Stock.findOneAndUpdate({stock: doc1.stock}, {ip: [...stock1IPs, req.ip], likes: stock1totalLikes + 1}, {new: true}, (err, docOne) => {
                      if (err) {
                        return console.log(err)
                      }
                    })
                    return res.json({
                      stockData: [
                        {
                          stock: doc1.stock,
                          price: doc1.price,
                          likes: (doc1.likes + 1) - doc2.likes
                        },
                        {
                          stock: doc2.stock,
                          price: doc2.price,
                          likes: doc2.likes - (doc1.likes + 1)
                        }
                      ]
                    })
                  }

                  else if (stock2IPs.indexOf(req.ip) == -1) {
                    Stock.findOneAndUpdate({stock: doc2.stock}, {ip: [...stock2IPs, req.ip], likes: stock2totalLikes + 1}, {new: true}, (err, docTwo) => {
                      if (err) {
                        return console.log(err)
                      }
                    })
                    return res.json({
                      stockData: [
                        {
                          stock: doc1.stock,
                          price: doc1.price,
                          likes: doc1.likes - (doc2.likes + 1)
                        },
                        {
                          stock: doc2.stock,
                          price: doc2.price,
                          likes: (doc2.likes + 1) - doc1.likes
                        }
                      ]
                    })
                  }

                }

                //if like is not true
                return res.json({
                  stockData: [
                    {
                      stock: doc[0].stock,
                      price: doc[0].price,
                      rel_likes: doc[0].likes - doc[1].likes
                    },
                    {
                      stock: doc[1].stock,
                      price: doc[1].price,
                      rel_likes: doc[1].likes - doc[0].likes
                    }
                  ]
                })

              })
            })
          } else {
            Stock.findOne({stock: req.query.stock}, (err, doc) => {
              if (err) {
                return console.log(err)
              }
  
              const newStocks = new Stock({
                stock: stock[0],
                price: price[0],
                likes: 0,
                ip: []
              })

              if (doc == null) {

                if (req.query.like == "true") {
                  newStocks.ip = [...newStocks.ip, req.ip]
                  newStocks.likes = newStocks.likes + 1
                }

                newStocks.save()

                return res.json({
                  stockData: {
                    stock: newStocks.stock,
                    price: newStocks.price,
                    likes: newStocks.likes
                  }
                })


              } else {
                Stock.findOne({stock: req.query.stock}, (err, doc) => {
                  if (err) {
                    return console.log(err)
                  }
  
                  let totalLikes = doc.likes
                  let allIp = doc.ip
                  let presentIp = true
  
                  if (allIp.indexOf(req.ip) == -1) {
                    presentIp = false
                  } 
  
                  if (req.query.like == "true" && presentIp == false) {
                    Stock.findOneAndUpdate({stock: req.query.stock}, {likes: totalLikes + 1, ip: [...doc.ip, req.ip]}, {new: true}, (err, doc) => {
                      if (err) {
                        return console.log(err)
                      }
  
                      return res.json({
                        stockData: {
                          stock: doc.stock,
                          price: doc.price,
                          likes: doc.likes
                        }
                      })
                    })
                  } else {
                    return res.json({
                      stockData: {
                        stock: doc.stock,
                        price: doc.price,
                        likes: doc.likes
                      }
                    })
                  }
                })
              }
            })

          }
        }

        

      })


    });
    
};
