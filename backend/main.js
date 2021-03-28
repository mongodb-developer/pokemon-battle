const { MongoClient, ObjectID } = require("mongodb");
const Express = require("express");
const Cors = require("cors");

const app = Express();

const http = require("http").Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

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
var changesBattles;

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
    changesBattles.on("change", (next) => {
        io.to(socket.activeRoom).emit("refresh", next.fullDocument);
    });
    socket.on("join", async (battleId) => {
        try {
            let result = await collections.battles.findOne({ "_id": new ObjectID.createFromHexString(battleId) });
            if (!result) {
                await collections.battles.insertOne({ });
            }
            socket.join(battleId);
            socket.emit("joined", battleId);
            socket.activeRoom = battleId;
        } catch (ex) {
            console.error(ex);
        }
    });
    socket.on("attack", async (pokemon, move) => {
        await collections.battles.updateOne(
            {
                "_id": new ObjectID.createFromHexString(socket.activeRoom)
            },
            {
                "$inc": {
                    "pokemon_one.pp": -5,
                    "pokemon_two.hp": -25
                }
            }
        );
        io.to(socket.activeRoom).emit("attack", move);
    });
});

http.listen(3000, async () => {
    try {
        await mongoClient.connect();
        collections.battles = mongoClient.db("game").collection("battle");
        collections.pokemon = mongoClient.db("game").collection("pokemon");
        changesBattles = collections.battles.watch([
            {
                "$match": {
                    "operationType": "update"
                }
            }
        ], { fullDocument: "updateLookup" });
        console.log("Listening on *:3000...");
    } catch (ex) {
        console.error(ex);
    }
});