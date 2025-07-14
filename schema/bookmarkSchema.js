const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    bookmarkId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    userId: {
      type: Number,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    folderId: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);
