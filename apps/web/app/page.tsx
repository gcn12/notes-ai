"use client";

import AddData from "@/components/AddData";
import Search from "@/components/Search";
import Spacer from "@/components/Spacer";
import { useEffect, useState } from "react";

export default function Home() {
  const [page, setPage] = useState<"search" | "add-data">("search");

  return (
    <div className="grid place-items-center">
      <div className="px-36px py-48px bg-white [border:1px_solid_rgba(0,0,0,.1)] rounded-12px w-[500px] shadow-sm">
        <div className="flex">
          <button
            className={`${
              page === "search" ? "font-500 underline" : ""
            } text-20px`}
            onClick={() => setPage("search")}
          >
            search
          </button>
          <Spacer size={8} axis="x" />
          <button
            className={`${
              page === "add-data" ? "font-500 underline" : ""
            } text-20px`}
            onClick={() => setPage("add-data")}
          >
            add data
          </button>
        </div>
        <Spacer size={24} axis="y" />
        {page === "search" ? <Search /> : <AddData />}
      </div>
    </div>
  );
}
