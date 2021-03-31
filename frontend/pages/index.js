import React, { useState, useEffect } from "react";

export default function Home() {
  const [battleId, setBattleId] = useState("");
  return (
    <div className="bg-blue-100 h-screen">
      <h1 className="text-center text-5xl p-16 font-bold">PokeBattle!</h1>

      <div className="flex text-center space-x-16">
        <div className="w-1/2">
          <a className="w-full p-6 m-2 bg-blue-300" href="/battle">New Game</a>
        </div>
        <div className="w-1/2">
            <input className="w-1/2 p-6" type="text" onChange={(e)=>setBattleId(e.target.value)}></input>
            <a className="w-full p-6 m-2 bg-blue-300" href={"/battle?battleId=" + battleId}>Join Game</a>
        </div>
        
      </div>
    </div>
  )
}
