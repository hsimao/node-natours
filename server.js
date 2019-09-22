const mongoose = require('mongoose');
const dotenv = require('dotenv');

const configName = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
dotenv.config({ path: `${__dirname}/config/${configName}.env` });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB conection successful!'));

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App start on port ${port}...`);
});
