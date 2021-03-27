const { MongoClient } = require("mongodb");
const Express = require("express");
const Cors = require("cors");

const app = Express();

const http = require("http").Server(app);
const io = require('socket.io')(http);

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(Cors());

const mongoClient = new MongoClient(
    process.env["ATLAS_URI"], 
    { 
        useUnifiedTopology: true 
    }
);

var collections = {};

app.get("/pokemon", async (request, response) => {
    try {
        let result = await collections.pokemon.find({}).toArray();
        response.send(result);
    } catch (e) {
        response.status(500).send({ message: e.message });
    }
});

app.get("/battles", async (request, response) => {
    try {
        let result = await collections.battles.find({}).toArray();
        response.send(result);
    } catch (e) {
        response.status(500).send({ message: e.message });
    }
});

io.on("connection", (socket) => {
    console.log("A client has connected!");
    socket.on("join", async (battleId) => {
        try {
            let result = await collections.battles.findOne({ "_id": battleId });
            if (!result) {
                await collection.battles.insertOne({ "_id": battleId });
            }
            socket.join(battleId);
            socket.emit("joined", battleId);
            socket.activeRoom = battleId;
        } catch (ex) {
            console.error(ex);
        }
    });
    socket.on("attack", (move) => {
        console.log(socket.activeRoom);
        io.to(socket.activeRoom).emit("attack", move);
    });
});

http.listen(3000, async () => {
    try {
        await mongoClient.connect();
        collections.battles = mongoClient.db("game").collection("battle");
        collections.pokemon = mongoClient.db("game").collection("pokemon");
        console.log("Listening on *:3000...");
    } catch (ex) {
        console.error(ex);
    }
});