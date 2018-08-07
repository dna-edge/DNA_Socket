const fs = require('fs');

const file = '/DNAenv.json';

let data = '';

try {
  data = fs.readFileSync('/home'+file, 'utf8');
} catch (err) {
  data = fs.readFileSync(__dirname+file, 'utf8');
}

const jsonData = JSON.parse(data);

module.exports = jsonData;