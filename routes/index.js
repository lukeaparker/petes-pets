const Pet = require('../models/pet');

module.exports = (app) => {

  /* GET home page. */
  app.get('/', (req, res) => {
    Pet.find().exec((err, pets) => {
      res.render('pets-index', { pets: pets });    
    });
  });

  // SEARCH PET
  app.get('/search', (req, res) => {
    term = new RegExp(req.query.term, 'i')

    Pet.find({$or:[
      {'name': term},
      {'species': term}
    ]}).exec((err, pets) => {
      res.render('pets-index', { pets: pets });
    })
  });
  
}
