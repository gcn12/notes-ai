import { useState } from "react";
import Spacer from "./Spacer";

export default function AddData() {
  const [addData, setAddData] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveToDB = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await fetch(process.env.NEXT_PUBLIC_SERVER_URL || "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: addData }),
      });
      setIsSuccess(true);
      setAddData("");
    } catch (err) {
      console.log(err);
    }
    setIsSaving(false);
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
      <button className="bg-black rounded-6px text-white py-8px">
        {isSaving ? "saving..." : "save"}{" "}
      </button>
      <Spacer size={16} axis="y" />
      {isSuccess ? <p>Data added successfully</p> : null}
    </form>
  );
}
