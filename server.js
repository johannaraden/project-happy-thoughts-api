import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts"
mongoose.connect(mongoUrl)

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully')
})

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message)
})


// Defines the port the app will run on. Defaults to 8080, but can be 
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()


// Thought model 

const Thought = mongoose.model('Thought', {
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(express.json())


// Adding middleware for targeting server error for every request
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailable'})
  }
})  

// My endpoints

app.get('/desc', (req, res) => {
  res.send(`<h2>Hello!</h2><h4>Structure for this API.</h4><ul><li>'/' shows the 20 latest thoughts in the database</li><li>POST method '/' gives the user the possibility to post their own thought. </li><li> POST method '/:thoughtId/like' adds a like to that specific thought.</li></ul>`)
})

// Get 20 of the latest thoughts in descending order starting from the last posted one.

app.get('/', async (req, res) => {
  const thoughts = await Thought.find().sort({createdAt: 'desc'}).limit(20).exec()
  res.status(200).json(thoughts)
})

// Post your own thought

app.post('/', async (req, res) => {
  const { message } = req.body
  const thought = new Thought({message})
  try {
    const savedThought = await thought.save()
    res.status(201).json(savedThought)
  } catch (error) {
      res.status(400).json({message: 'Sorry could not save this thought to the database', error: error.errors});
      }
  } 
)

// POST /:thoughtId/like - add a like

app.post('/:thoughtId/like', async (req, res) => {
  const { thoughtId } = req.params

  try {
    await Thought.updateOne({ _id: thoughtId }, { $inc: { hearts: 1 } })
    res.status(200).json()
  } catch {
    res.status(404).json({message: 'Could not update likes to an undefined thougt.'})
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
