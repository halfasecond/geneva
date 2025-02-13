import mongoose from 'mongoose'

const createModel = (prefix) => {
  const Schema = new mongoose.Schema({
    slug: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
        type: Object,
    },
    content: {
        type: Array
    },
    tags: [String],
    contentType: {
        type: String,
    },
    published: {
        type: Boolean,
        default: false,
    },
    publishedDate: {
        type: Date,
        default: Date.now,
    },
    author: {
        type: String,
    }
  })
  
  Schema.set('timestamps', true)
  const modelName = prefix ? `${prefix}_cms` : 'cms'
  return mongoose.model(modelName, Schema)
}

export default createModel