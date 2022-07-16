const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.adhgt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const servicesCollection = client.db('camera-store').collection('services');
        const bookingsCollection = client.db('booking').collection('services');

        app.get('/service', async(req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/available', async(req, res) => {
          const date = req.query.date || "Jul 6, 2022";
          //step1: get all services
          const services = await servicesCollection.find().toArray();

          //step2: get the order of that day
          const query = {date: date};
          const bookings = await bookingsCollection.find(query).toArray();

          //step3: for each order ,find bookings for that order
          services.forEach(service => {
            const serviceBooking = bookings.filter(b => b.appointments === service.name);
            const booked = serviceBooking.map(s => s.slot);
            const available = service.slots.filter(s=> !booked.includes(s));
            service.available = available; 
          })
          res.send(services);
        })

        app.post('/booking', async(req, res) => {
          const booking = req.body;
          const query = {appointments: booking.appointments, date: booking.date, user: booking.user}
          const exists = await bookingsCollection.findOne(query);
          if(exists){
            return res.send({success: false, booking: exists})
          }
          const result = await bookingsCollection.insertOne(booking);
          return res.send({success: true, result});
        })
    }
    finally{

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Camerassories machine listening to ${port}`)
})