import Head from 'next/head'
import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import randomstring from "randomstring";

const socket = socketIOClient('http://localhost:3000');

export default function Battle({pokemon, battleId}) {
  const [battle, setBattle] = useState({
    _id: null,
    playerOne: {
      pokemon: {}
    },
    playerTwo: {
      pokemon: {}
    }
  });
  useEffect(() => {
    socket.connect();
    
    socket.on("connect", async () => {
      socket.emit("join", battleId ? battleId : randomstring.generate());
    });

    socket.on("refresh", (battle)=>{
      setBattle(battle)
    })
  }, []);

  return (
    <div className="bg-blue-100 h-screen">
      <h1 className="text-center text-5xl p-16 font-bold">PokeBattle!</h1>

      <h2 className="text-center">Battle ID: {battle._id}</h2>

      {/* Select Pokemon Stage */}
      {(!battle.playerOne.pokemon._id || !battle.playerTwo.pokemon._id)  &&
        <SelectStage battle={battle} pokemon={pokemon}></SelectStage>
      }

    {/* Fight Stage */}
    {(battle.playerOne.pokemon._id && battle.playerTwo.pokemon._id) &&
      <FightStage battle={battle}></FightStage>
    }

      {/* Victory Stage */}
      {(battle.playerOne.pokemon.hp <= 0 || battle.playerTwo.pokemon.hp <= 0) &&
        <VictoryStage battle={battle}></VictoryStage>
      }
    </div>
  )
}

const SelectStage = ({battle, pokemon}) => {
  return (
      <div className="container mx-auto text-center">
        <div className="flex space-x-24">
          <div className="w-1/2">
            <h1>Player 1</h1>
            <div className="flex flex-wrap">
              {pokemon && pokemon.map(mon=>(
                <div key={mon._id} className={"w-1/4 " + (battle.playerOne.pokemon._id === mon._id ? "bg-green-200" : "")} onClick={()=>socket.emit("select", 1, mon)}>
                  <img src={mon.image} />
                  <h2 className="text-xl font-bold">
                    {mon.name}
                  </h2>
                </div>
              ))}
            </div>
          </div>
          <div className="w-1/2">
            <h1>Player 2</h1>
            <div className="flex flex-wrap">
            {pokemon && pokemon.map(mon=>(
              <div key={mon._id} className={"w-1/4 " + (battle.playerTwo.pokemon._id === mon._id ? "bg-green-200" : "")} onClick={()=>socket.emit("select", 2, mon)}>
                  <img src={mon.image} />
                  <h2 className="text-xl font-bold">
                    {mon.name}
                  </h2>
              </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  )
}

const FightStage = ({battle}) => {
  return (
    <div className="container mx-auto text-center">
    <h1 className="p-8 text-4xl font-bold">FIGHT!</h1>
    <div className="flex space-x-16">
      <div className="w-1/2">
        <h1>Player 1</h1>
        <img className="w-64 mx-auto" src={battle.playerOne.pokemon.image} />
        <h2 className="text-4xl font-bold text-center">{battle.playerOne.pokemon.name}</h2>

        <div className="text-2xl font-bold">HP {battle.playerOne.pokemon.hp}</div>
        <div className="text-2xl font-bold">PP {battle.playerOne.pokemon.pp}</div>

        <div className="flex flex-col">
          {battle.playerOne.pokemon.moves.map(move=>(
            <div key={move.name} onClick={()=>socket.emit("attack", 1, move)}>
              <div className="w-full p-6 m-2 bg-blue-300">{move.name} ({move.pp})</div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/2">
        <h1>Player 2</h1>
        <img className="w-64 mx-auto" src={battle.playerTwo.pokemon.image} />
        <h2 className="text-4xl font-bold text-center">{battle.playerTwo.pokemon.name}</h2>

        <div className="text-2xl font-bold">HP {battle.playerTwo.pokemon.hp}</div>
        <div className="text-2xl font-bold">PP {battle.playerTwo.pokemon.pp}</div>
        <div className="flex flex-col">
          {battle.playerTwo.pokemon.moves.map(move=>(
            <div key={move.name} onClick={()=>socket.emit("attack", 2, move)}>
              <div className="w-full p-6 m-2 bg-blue-300">{move.name} ({move.pp})</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  )
}

const VictoryStage = ({battle}) => {
  return (
    <div className="fixed h-screen w-full left-0 top-0 bg-purple-300 text-center p-48 text-7xl font-bold">
          {battle.playerOne.pokemon.hp <= 0 &&
            <div>
              <img className="w-64 mx-auto" src={battle.playerTwo.pokemon.image} />
              <h1>Player Two Wins!!!</h1>
            </div>
          }
          {battle.playerTwo.pokemon.hp <= 0 &&
            <div>
              <img className="w-64 mx-auto" src={battle.playerOne.pokemon.image} />
              <h1>Player One Wins!!!</h1>
            </div>
          }

          <a className="pt-24 text-2xl" href="/">Play Again?</a>
        </div>
  )
}

export async function getServerSideProps({query}) {
  const response = await fetch('http://localhost:3000/pokemon');
  const data = await response.json();
  const pokemon = JSON.parse(JSON.stringify(data));

  return {
    props: {
      pokemon: pokemon,
      battleId: query.battleId || null
    },
  }
}