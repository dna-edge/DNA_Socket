const mongoose = require('mongoose');

const paginationCount = require('../utils/config').pagenation_count;

let Schema = {};

Schema.createSchema = (mongoose) => {
  const dmSchema = mongoose.Schema({
    sender_idx: { type: Number, required: true },
    contents: { type: String, required: true },
    type: { type: String, default: "Message" }
  });

  return dmSchema;
};

module.exports = Schema;