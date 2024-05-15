"use client";

import { useState } from "react";
import Spacer from "./Spacer";

export default function Search() {
  const [search, setSearch] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const getSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/search?search=${search}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();
    setAnswer(data.data);
    setIsSearching(false);
  };

  return (
    <>
      <form onSubmit={getSearch} className="flex flex-col max-w-[500px]">
        <label htmlFor="search" className="visually-hidden">
          search
        </label>
        <textarea
          onChange={(e) => setSearch(e.target.value)}
          id="search"
          autoComplete="off"
          className="bg-[#FAFAFA] [border:1px_solid_#C5C5C5] rounded-6px resize-none h-[80px]"
          value={search}
        />
        <Spacer size={16} axis="y" />
        <button className="bg-black rounded-6px text-white py-8px">
          {isSearching ? "searching..." : "search"}
        </button>
      </form>
      {answer.length > 0 ? (
        <>
          <Spacer size={32} axis="y" />
          <p>{answer}</p>
        </>
      ) : null}
    </>
  );
}
