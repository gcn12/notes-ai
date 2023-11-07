import { useState } from "react";
import Spacer from "./Spacer";

export default function AddData() {
  const [addData, setAddData] = useState("");

  const saveToDB = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3002", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: addData }),
    });
    const data = await res.json();
  };

  return (
    <form onSubmit={saveToDB} className="flex flex-col max-w-[500px]">
      <label htmlFor="add" className="visually-hidden">
        add data
      </label>
      <textarea
        onChange={(e) => setAddData(e.target.value)}
        id="add"
        autoComplete="off"
        className="bg-[#FAFAFA] [border:1px_solid_#C5C5C5] rounded-6px resize-none h-[80px]"
        value={addData}
      />
      <Spacer size={16} axis="y" />
      <button className="bg-black rounded-6px text-white py-8px">save</button>
    </form>
  );
}
