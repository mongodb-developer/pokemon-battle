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
    "mongodb+srv://mongodb:mongodb@cluster0.tdm0q.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", 
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
            let result = await collections.battles.findOne({ "_id": battleId });
            if(result){
              socket.emit("refresh", result)
            } else {
              let newBattle = await collections.battles.insertOne({
                "_id": battleId,
                playerOne: {
                  pokemon: {}
                },
                playerTwo: {
                  pokemon: {}
                }
              });
              socket.emit("refresh", newBattle.ops[0]);
            }
            
            socket.join(battleId);
            socket.activeRoom = battleId;

        } catch (ex) {
            console.error(ex);
        }
    });

    socket.on("select", async (player, pokemon) => {
      try {
        if(player === 1){
          await collections.battles.updateOne(
            {
                "_id": socket.activeRoom
            },
            {
            $set : {
                playerOne : {
                  pokemon : pokemon
                }
              }
            }
          );
        } else {
          await collections.battles.updateOne(
            {
                "_id": socket.activeRoom
            },
            {
            $set : {
                playerTwo : {
                  pokemon : pokemon
                }
              }
            }
          );
        }
        }
        catch (e){
          console.log(e);
        }
  });

    socket.on("attack", async (player, move) => {
      try{
      if(player === 1){
        await collections.battles.updateOne(
          {
              "_id": socket.activeRoom
          },
          {
            "$inc": {
                "playerOne.pokemon.pp": -move.pp,
                "playerTwo.pokemon.hp": -move.damage
            }
          }
        );
      } else {
        await collections.battles.updateOne(
          {
              "_id": socket.activeRoom
          },
          {
            "$inc": {
                "playerTwo.pokemon.pp": -move.pp,
                "playerOne.pokemon.hp": -move.damage
            }
          }
        );
      }
    } catch (e) {
      console.log(e);
    }
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