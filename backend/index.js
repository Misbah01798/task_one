const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const app = express();
require('dotenv').config();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected")).catch(err => console.log(err));

// Mongoose schema and model
const formSchema = new mongoose.Schema({
  formName: String,
  formActive: Boolean,
  receivedAt: { type: Date, default: Date.now },
});

const Form = mongoose.model('Form', formSchema);

// Webhook endpoint to receive data from forms.app
app.post('/webhook', async (req, res) => {
  const { formName, formActive } = req.body;
  
  // Save to MongoDB
  const newForm = new Form({ formName, formActive });
  await newForm.save();

  // Send data to 123FormBuilder API
  try {
    const response = await axios.post('https://api.123formbuilder.com/v2/forms', {
      name: formName,
      is_active: formActive ? 1 : 0,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.FORM_BUILDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(response.data);
    res.status(200).send('Form created in 123FormBuilder');
  } catch (error) {
    console.error('Error sending data to 123FormBuilder:', error);
    res.status(500).send('Error creating form');
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
