const mongoose = require('mongoose');

const uri = 'mongodb+srv://vhj1170000:si1v3r19071991@cluster0.ng1xikd.mongodb.net/dummyapi?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
  });
