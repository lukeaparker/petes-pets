// MODELS
const Pet = require('../models/pet');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const Upload = require('s3-uploader');

// PET ROUTES
module.exports = (app) => {


  const client = new Upload(process.env.S3_BUCKET, {
    aws: {
      path: 'pets/avatar',
      region: process.env.S3_REGION,
      acl: 'public-read',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    cleanup: {
      versions: true,
      original: true
    },
    versions: [{
      maxWidth: 400,
      aspect: '16:10',
      suffix: '-standard'
    },{
      maxWidth: 300,
      aspect: '1:1',
      suffix: '-square'
    }]
  });

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  app.post('/pets', upload.single('avatar'), (req, res, next) => {
    var pet = new Pet(req.body);
    pet.save(function (err) {
      if (req.file) {
        // Upload the images
        client.upload(req.file.path, {}, function (err, versions, meta) {
          if (err) { return res.status(400).send({ err: err }) };

          // Pop off the -square and -standard and just use the one URL to grab the image
          versions.forEach(function (image) {
            var urlArray = image.url.split('-');
            urlArray.pop();
            var url = urlArray.join('-');
            pet.avatarUrl = url;
            pet.save();
          });

          res.send({ pet: pet });
        });
      } else {
        res.send({ pet: pet });
      }
    })
  })

  // SHOW PET
  app.get('/pets/:id', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-show', { pet: pet });
    });
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-edit', { pet: pet });
    });
  });

  app.put('/pets/:id', (req, res) => {
    Pet.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true },
      function(err, pet) {
        if (err) {
          // STATUS OF 400 FOR VALIDATIONS
          res.status(400).send(err);
        }
        res.redirect(`/pets/${pet._id}`)
      });
  });

  // DELETE PET
  app.delete('/pets/:id', (req, res) => {
    Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
      if (req.file) {
        // Upload the images
        client.upload(req.file.path, {}, function (err, versions, meta) {
          if (err) { return res.status(400).send({ err: err }) };

          // Pop off the -square and -standard and just use the one URL to grab the image
          versions.forEach(function (image) {
            var urlArray = image.url.split('-');
            urlArray.pop();
            var url = urlArray.join('-');
            pet.avatarUrl = url;
            pet.save();
          });

          res.send({ pet: pet });
        });
      } else {
        res.send({ pet: pet });
      }
      return res.redirect('/')
    });
  });

// PURCHASE
app.post('/pets/:id/purchase', (req, res) => {
  console.log(req.body);
  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  var stripe = require("stripe")(process.env.PRIVATE_STRIPE_API_KEY);

  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express

  const charge = stripe.charges.create({
    amount: 999,
    currency: 'usd',
    description: 'Example charge',
    source: token,
  }).then(() => {
    res.redirect(`/pets/${req.params.id}`);
  });
});

}
